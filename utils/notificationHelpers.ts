import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { formatCurrency } from './dateHelpers';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4FC3F7',
    });
  }

  // Request permissions on both physical devices and simulators for local notifications
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  // Only request Push Token on physical devices with EAS setup
  if (Device.isDevice) {
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } catch (e) {
      // Ignore EAS token fetching failures gracefully to allow local notifications to function
    }
  }

  return token;
}

export interface SubscriptionReminderOptions {
  id: string;
  name: string;
  expiryDate: string;
  amount?: number;
  currency?: string;
  reminderDaysBefore?: number[]; // e.g. [0, 1, 3, 7]
  isTrial?: boolean;
}

export async function scheduleSubscriptionReminder(
  optionsOrId: string | SubscriptionReminderOptions,
  legacyName?: string,
  legacyExpiryDate?: string
): Promise<string | null> {
  const opts: SubscriptionReminderOptions = typeof optionsOrId === 'string'
    ? {
        id: optionsOrId,
        name: legacyName || 'Subscription',
        expiryDate: legacyExpiryDate || '',
        reminderDaysBefore: [1],
      }
    : optionsOrId;

  if (!opts.expiryDate) return null;
  const expiry = new Date(opts.expiryDate);
  if (isNaN(expiry.getTime())) return null;

  const now = Date.now();
  const scheduledIds: string[] = [];
  const daysList = (opts.reminderDaysBefore && opts.reminderDaysBefore.length > 0)
    ? opts.reminderDaysBefore
    : [1];

  const formattedAmount = opts.amount && opts.currency ? ` (${opts.currency} ${opts.amount})` : '';

  for (const daysBefore of daysList) {
    const triggerDate = new Date(expiry.getTime());
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    // If daysBefore === 0 (day of renewal), set to 9:00 AM
    // Else set to 10:00 AM
    triggerDate.setHours(daysBefore === 0 ? 9 : 10, 0, 0, 0);

    if (triggerDate.getTime() <= now) {
      continue; // Skip past triggers
    }

    let title = opts.isTrial ? '⏳ Free Trial Ending Soon' : '🔔 Subscription Renewal';
    let body = '';

    if (opts.isTrial) {
      if (daysBefore === 0) {
        body = `Your ${opts.name} free trial ends today! Cancel now if you don't wish to be billed${formattedAmount}.`;
      } else if (daysBefore === 1) {
        body = `Your ${opts.name} free trial ends tomorrow! Cancel today to avoid being charged${formattedAmount}.`;
      } else {
        body = `Your ${opts.name} trial ends in ${daysBefore} days${formattedAmount}. Check your renewal settings.`;
      }
    } else {
      if (daysBefore === 0) {
        body = `Your ${opts.name} subscription renews today${formattedAmount}. Tap to view or log renewal.`;
      } else if (daysBefore === 1) {
        body = `Your ${opts.name} subscription renews tomorrow${formattedAmount}!`;
      } else {
        body = `Upcoming renewal: ${opts.name} is due in ${daysBefore} days${formattedAmount}.`;
      }
    }

    try {
      const nid = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'subscription', id: opts.id, isTrial: !!opts.isTrial },
        },
        trigger: { type: 'date', date: triggerDate } as any,
      });
      if (nid) scheduledIds.push(nid);
    } catch (err) {
      // Ignore scheduling errors on unsupported platforms
    }
  }

  return scheduledIds.length > 0 ? scheduledIds.join(',') : null;
}

export async function cancelNotification(notificationId?: string | null) {
  if (!notificationId) return;
  const ids = notificationId.includes(',') ? notificationId.split(',') : [notificationId];
  for (const id of ids) {
    const clean = id.trim();
    if (clean) {
      try {
        await Notifications.cancelScheduledNotificationAsync(clean);
      } catch {}
    }
  }
}

export async function scheduleDebtReminder(id: string, personName: string, dueDate: string) {
  const triggerDate = new Date(dueDate);
  // Remind on the due date morning
  triggerDate.setHours(9, 0, 0, 0); // 9 AM

  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Debt Due Today',
      body: `You have a debt to pay back to ${personName} today.`,
      data: { type: 'debt', id },
    },
    trigger: { type: 'date', date: triggerDate } as any,
  });

  return notificationId;
}


export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function rescheduleDailyReminder() {
  let isEnabled = false;
  try {
    const val = await storage.getString('daily_reminder_enabled');
    isEnabled = val !== 'false';
  } catch (err) {}

  // Cancel existing scheduled daily notifications
  const reminderKeys = [
    'daily_reminder_notification_id',
    'morning_reminder_notification_id',
    'afternoon_reminder_notification_id',
    'evening_reminder_notification_id',
  ];

  for (const key of reminderKeys) {
    try {
      const existingId = await storage.getString(key);
      if (existingId) {
        await Notifications.cancelScheduledNotificationAsync(existingId);
        await storage.delete(key);
      }
    } catch (err) {}
  }

  if (!isEnabled) {
    return null;
  }

  // Compute live financial data for meaningful notification content
  let currencyCode = 'INR';
  try {
    const savedCurrency = await storage.getString(STORAGE_KEYS.CURRENCY);
    if (savedCurrency) currencyCode = savedCurrency;
  } catch (err) {}

  let budgetAmount = 0;
  try {
    const rawBudget = await storage.getString(STORAGE_KEYS.MONTHLY_BUDGET);
    if (rawBudget) {
      const parsed = JSON.parse(rawBudget);
      budgetAmount = parsed.amount || 0;
    }
  } catch (err) {}

  let monthlySpending = 0;
  let todaySpent = 0;
  let todayCount = 0;

  try {
    const rawSpending = await storage.getString(STORAGE_KEYS.DAILY_SPENDING);
    if (rawSpending) {
      const entries = JSON.parse(rawSpending) as any[];
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

      let rates: Record<string, number> = {};
      try {
        const storedRates = await storage.getString('exchange_rates_v1');
        if (storedRates) rates = JSON.parse(storedRates);
      } catch (err) {}

      const convertAmount = (amount: number, fromCode: string) => {
        if (fromCode === currencyCode) return amount;
        if (!rates || Object.keys(rates).length === 0) return amount;
        const fromRate = rates[fromCode] || 1;
        const toRate = rates[currencyCode] || 1;
        return (amount / fromRate) * toRate;
      };

      entries.forEach((e) => {
        const spent = new Date(e.spentAt);
        const converted = convertAmount(e.amount, e.currency);

        if (spent.getMonth() === now.getMonth() && spent.getFullYear() === now.getFullYear()) {
          monthlySpending += converted;
        }

        const entryDayStr = `${spent.getFullYear()}-${spent.getMonth() + 1}-${spent.getDate()}`;
        if (entryDayStr === todayStr) {
          todaySpent += converted;
          todayCount += 1;
        }
      });
    }
  } catch (err) {}

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);

  let morningHour = 9;
  let morningMinute = 0;
  try {
    const timeStr = await storage.getString('morning_reminder_time');
    if (timeStr && timeStr.includes(':')) {
      const parts = timeStr.split(':');
      morningHour = parseInt(parts[0], 10);
      morningMinute = parseInt(parts[1], 10);
    }
  } catch (err) {}

  let middayHour = 14;
  let middayMinute = 0;
  try {
    const timeStr = await storage.getString('midday_reminder_time');
    if (timeStr && timeStr.includes(':')) {
      const parts = timeStr.split(':');
      middayHour = parseInt(parts[0], 10);
      middayMinute = parseInt(parts[1], 10);
    }
  } catch (err) {}

  // 1. Morning Kickoff Notification
  let morningTitle = 'Good Morning! ☀️ Daily Allowance';
  let morningBody = 'Keep your financial goals on track today! Tap to check your balance.';

  if (budgetAmount > 0) {
    const remaining = budgetAmount - monthlySpending;
    if (remaining > 0) {
      const dailyAllowance = Math.round(remaining / daysRemaining);
      morningBody = `Monthly Budget: ${formatCurrency(remaining, currencyCode)} remaining (~${formatCurrency(dailyAllowance, currencyCode)}/day for ${daysRemaining} days).`;
    } else {
      morningTitle = 'Morning Budget Warning ⚠️';
      morningBody = `You are ${formatCurrency(Math.abs(remaining), currencyCode)} over your monthly budget. Stay mindful of expenses today!`;
    }
  }

  const morningId = await Notifications.scheduleNotificationAsync({
    content: {
      title: morningTitle,
      body: morningBody,
      data: { type: 'morning_kickoff' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: morningHour,
      minute: morningMinute,
    } as any,
  });

  // 2. Midday Pulse Notification
  let afternoonTitle = 'Midday Pulse 📊 Financial Snapshot';
  let afternoonBody = 'Take a quick look at your recurring bills and pending debt settlements.';

  try {
    const rawSubs = await storage.getString(STORAGE_KEYS.SUBSCRIPTIONS);
    let activeSubsCount = 0;
    if (rawSubs) {
      const subs = JSON.parse(rawSubs) as any[];
      activeSubsCount = subs.filter((s) => s.isActive).length;
    }

    const rawCredits = await storage.getString(STORAGE_KEYS.CREDITS);
    let pendingCreditsCount = 0;
    if (rawCredits) {
      const credits = JSON.parse(rawCredits) as any[];
      pendingCreditsCount = credits.filter((c) => !c.isReturned).length;
    }

    if (pendingCreditsCount > 0) {
      afternoonTitle = 'Midday Credit Reminder 🤝';
      afternoonBody = `You have ${pendingCreditsCount} unreturned credit items. Tap to generate 1-tap reminders.`;
    } else if (activeSubsCount > 0) {
      afternoonBody = `You have ${activeSubsCount} active subscriptions running. Check them in the Subscriptions tab.`;
    }
  } catch (err) {}

  const afternoonId = await Notifications.scheduleNotificationAsync({
    content: {
      title: afternoonTitle,
      body: afternoonBody,
      data: { type: 'afternoon_pulse' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: middayHour,
      minute: middayMinute,
    } as any,
  });

  // Read custom reminder time set by user in Settings (e.g. "20:00")
  let customHour = 20;
  let customMinute = 0;
  try {
    const timeStr = await storage.getString('daily_reminder_time');
    if (timeStr && timeStr.includes(':')) {
      const parts = timeStr.split(':');
      customHour = parseInt(parts[0], 10);
      customMinute = parseInt(parts[1], 10);
    }
  } catch (err) {}

  // 1. User Scheduled Daily Check-in Notification
  let eveningTitle = 'Daily Ledger Check-in 📝';
  let eveningBody = todayCount > 0
    ? `Great job! You logged ${formatCurrency(todaySpent, currencyCode)} across ${todayCount} entries today.`
    : "Did you spend anything today? Take 10 seconds to log today's transactions!";

  const eveningId = await Notifications.scheduleNotificationAsync({
    content: {
      title: eveningTitle,
      body: eveningBody,
      data: { type: 'evening_wrapup' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: customHour,
      minute: customMinute,
    } as any,
  });

  try {
    await storage.set('morning_reminder_notification_id', morningId);
    await storage.set('afternoon_reminder_notification_id', afternoonId);
    await storage.set('evening_reminder_notification_id', eveningId);
  } catch (err) {}

  return morningId;
}

export async function checkAndTriggerBudgetAlerts() {
  try {
    let currencyCode = 'INR';
    const savedCurrency = await storage.getString(STORAGE_KEYS.CURRENCY);
    if (savedCurrency) {
      currencyCode = savedCurrency;
    }

    let budgetAmount = 0;
    const rawBudget = await storage.getString(STORAGE_KEYS.MONTHLY_BUDGET);
    if (rawBudget) {
      const parsed = JSON.parse(rawBudget);
      budgetAmount = parsed.amount || 0;
    }

    if (budgetAmount <= 0) {
      await storage.delete('last_budget_alert_threshold');
      return;
    }

    const rawSpending = await storage.getString(STORAGE_KEYS.DAILY_SPENDING);
    if (!rawSpending) {
      await storage.delete('last_budget_alert_threshold');
      return;
    }

    const entries = JSON.parse(rawSpending) as any[];
    const now = new Date();

    let rates: Record<string, number> = {};
    try {
      const storedRates = await storage.getString('exchange_rates_v1');
      if (storedRates) {
        rates = JSON.parse(storedRates);
      }
    } catch (err) {}

    const convertAmount = (amount: number, fromCode: string) => {
      if (fromCode === currencyCode) return amount;
      if (!rates || Object.keys(rates).length === 0) return amount;
      const fromRate = rates[fromCode] || 1;
      const toRate = rates[currencyCode] || 1;
      return (amount / fromRate) * toRate;
    };

    const thisMonthEntries = entries.filter((e) => {
      const spent = new Date(e.spentAt);
      return spent.getMonth() === now.getMonth() && spent.getFullYear() === now.getFullYear();
    });

    const thisMonthSpent = thisMonthEntries.reduce((sum, e) => {
      return sum + convertAmount(e.amount, e.currency);
    }, 0);

    const percentage = budgetAmount > 0 ? (thisMonthSpent / budgetAmount) * 100 : 0;
    let currentThreshold = 0;
    if (percentage >= 100) {
      currentThreshold = 100;
    } else if (percentage >= 90) {
      currentThreshold = 90;
    } else if (percentage >= 70) {
      currentThreshold = 70;
    }

    const lastAlertedStr = await storage.getString('last_budget_alert_threshold');
    const lastAlerted = lastAlertedStr ? parseInt(lastAlertedStr, 10) : 0;

    if (currentThreshold > lastAlerted) {
      let title = '';
      let body = '';
      const formattedSpent = formatCurrency(thisMonthSpent, currencyCode);
      const formattedBudget = formatCurrency(budgetAmount, currencyCode);

      if (currentThreshold === 100) {
        title = 'Budget Exceeded! ⚠️';
        body = `You have spent ${formattedSpent} of your ${formattedBudget} monthly limit.`;
      } else if (currentThreshold === 90) {
        title = 'Critical Budget Limit! 🚨';
        body = `You've used ${percentage.toFixed(0)}% of your ${formattedBudget} budget (${formattedSpent} spent).`;
      } else if (currentThreshold === 70) {
        title = 'Budget Warning! 🔔';
        body = `You've used ${percentage.toFixed(0)}% of your ${formattedBudget} budget (${formattedSpent} spent).`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'budget_alert', percentage: currentThreshold },
        },
        trigger: null,
      });

      await storage.set('last_budget_alert_threshold', currentThreshold.toString());
    } else if (currentThreshold < lastAlerted) {
      await storage.set('last_budget_alert_threshold', currentThreshold.toString());
    }
  } catch (err) {}
}
