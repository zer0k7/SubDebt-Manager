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
      // Ignore scheduling errors
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

export async function scheduleDebtReminder(id: string, personName: string, dueDate: string, amount?: number, currency?: string) {
  const triggerDate = new Date(dueDate);
  triggerDate.setHours(9, 0, 0, 0); // 9 AM

  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }

  const amtStr = amount && currency ? ` of ${currency} ${amount}` : '';
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Debt Due Today 💳',
      body: `You have to pay ${personName}${amtStr} today.`,
      data: { type: 'debt', id },
    },
    trigger: { type: 'date', date: triggerDate } as any,
  });

  return notificationId;
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Reschedules all smart notifications dynamically based on active debts, subscriptions,
 * spending logs, and user preference switches.
 */
export async function rescheduleDailyReminder() {
  let isMasterEnabled = true;
  try {
    const val = await storage.getString('daily_reminder_enabled');
    isMasterEnabled = val !== 'false';
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

  if (!isMasterEnabled) {
    return null;
  }

  // Read granular switches (all default to true)
  const debtsEnabledRaw = await storage.getString(STORAGE_KEYS.NOTIF_DEBTS_ENABLED);
  const subsEnabledRaw = await storage.getString(STORAGE_KEYS.NOTIF_SUBSCRIPTIONS_ENABLED);
  const spendingEnabledRaw = await storage.getString(STORAGE_KEYS.NOTIF_SPENDING_ENABLED);
  const creditsEnabledRaw = await storage.getString(STORAGE_KEYS.NOTIF_CREDITS_ENABLED);

  const debtsEnabled = debtsEnabledRaw !== 'false';
  const subsEnabled = subsEnabledRaw !== 'false';
  const spendingEnabled = spendingEnabledRaw !== 'false';
  const creditsEnabled = creditsEnabledRaw !== 'false';

  // Read currency
  let currencyCode = 'INR';
  try {
    const savedCurrency = await storage.getString(STORAGE_KEYS.CURRENCY);
    if (savedCurrency) currencyCode = savedCurrency;
  } catch (err) {}

  // 1. Fetch Debts Data
  let topUnpaidDebt: { personName: string; remainingAmount: number; currency: string } | null = null;
  let unpaidDebtsCount = 0;
  try {
    const rawDebts = await storage.getString(STORAGE_KEYS.DEBTS);
    if (rawDebts) {
      const debts = JSON.parse(rawDebts) as any[];
      const unpaid = debts.filter((d) => !d.isPaid);
      unpaidDebtsCount = unpaid.length;

      if (unpaid.length > 0) {
        // Find most urgent debt
        const sorted = unpaid.map((d) => {
          const totalPaid = Array.isArray(d.payments)
            ? d.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
            : 0;
          const remaining = Math.max(0, (d.amount || 0) - totalPaid);
          return {
            personName: d.personName,
            remainingAmount: remaining,
            currency: d.currency || currencyCode,
            dueDate: d.dueDate ? new Date(d.dueDate).getTime() : Infinity,
          };
        }).sort((a, b) => a.dueDate - b.dueDate || b.remainingAmount - a.remainingAmount);

        if (sorted.length > 0 && sorted[0].remainingAmount > 0) {
          topUnpaidDebt = sorted[0];
        }
      }
    }
  } catch (err) {}

  // 2. Fetch Subscriptions Data (Upcoming Expiring)
  let urgentSub: { name: string; amount: number; currency: string; daysLeft: number; isTrial: boolean } | null = null;
  let activeSubsCount = 0;
  try {
    const rawSubs = await storage.getString(STORAGE_KEYS.SUBSCRIPTIONS);
    if (rawSubs) {
      const subs = JSON.parse(rawSubs) as any[];
      const active = subs.filter((s) => s.isActive !== false);
      activeSubsCount = active.length;

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const expiringList = active.map((s) => {
        const expStr = s.expiryDate || s.nextBillingDate || s.trialEndDate;
        if (!expStr) return null;
        const expDate = new Date(expStr);
        expDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          name: s.name,
          amount: s.amount || 0,
          currency: s.currency || currencyCode,
          daysLeft: diffDays,
          isTrial: !!s.isTrial,
        };
      }).filter((s) => s !== null && s.daysLeft >= 0 && s.daysLeft <= 3) as any[];

      expiringList.sort((a, b) => a.daysLeft - b.daysLeft);
      if (expiringList.length > 0) {
        urgentSub = expiringList[0];
      }
    }
  } catch (err) {}

  // 3. Fetch Credits Data (Unreturned)
  let topCredit: { personName: string; amount: number; currency: string } | null = null;
  let pendingCreditsCount = 0;
  try {
    const rawCredits = await storage.getString(STORAGE_KEYS.CREDITS);
    if (rawCredits) {
      const credits = JSON.parse(rawCredits) as any[];
      const pending = credits.filter((c) => !c.isReturned);
      pendingCreditsCount = pending.length;
      if (pending.length > 0) {
        topCredit = {
          personName: pending[0].personName,
          amount: pending[0].amount,
          currency: pending[0].currency || currencyCode,
        };
      }
    }
  } catch (err) {}

  // 4. Fetch Spending & Budget Data
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

      entries.forEach((e) => {
        const spent = new Date(e.spentAt);
        if (spent.getMonth() === now.getMonth() && spent.getFullYear() === now.getFullYear()) {
          monthlySpending += e.amount || 0;
        }
        const entryDayStr = `${spent.getFullYear()}-${spent.getMonth() + 1}-${spent.getDate()}`;
        if (entryDayStr === todayStr) {
          todaySpent += e.amount || 0;
          todayCount += 1;
        }
      });
    }
  } catch (err) {}

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);

  // Time Slots
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

  // -------------------------------------------------------------
  // SLOT 1: MORNING NOTIFICATION (09:00 AM)
  // -------------------------------------------------------------
  let morningTitle = 'Good Morning! ☀️ Daily Allowance';
  let morningBody = 'Keep your financial goals on track today! Tap to check your balance.';

  if (subsEnabled && urgentSub) {
    if (urgentSub.daysLeft === 0) {
      morningTitle = urgentSub.isTrial ? '⏳ Free Trial Ends Today!' : '🔔 Subscription Renewal Today!';
      morningBody = `Your ${urgentSub.name} subscription renews today (${formatCurrency(urgentSub.amount, urgentSub.currency)}).`;
    } else if (urgentSub.daysLeft === 1) {
      morningTitle = urgentSub.isTrial ? '⏳ Free Trial Ending Tomorrow' : '🔔 Subscription Renewal Tomorrow';
      morningBody = `Your ${urgentSub.name} subscription renews tomorrow (${formatCurrency(urgentSub.amount, urgentSub.currency)}).`;
    } else {
      morningTitle = 'Upcoming Subscription Renewal 🔔';
      morningBody = `${urgentSub.name} is due in ${urgentSub.daysLeft} days (${formatCurrency(urgentSub.amount, urgentSub.currency)}).`;
    }
  } else if (spendingEnabled && budgetAmount > 0) {
    const remaining = budgetAmount - monthlySpending;
    if (remaining > 0) {
      const dailyAllowance = Math.round(remaining / daysRemaining);
      morningBody = `Monthly Budget: ${formatCurrency(remaining, currencyCode)} remaining (~${formatCurrency(dailyAllowance, currencyCode)}/day for ${daysRemaining} days).`;
    } else {
      morningTitle = 'Morning Budget Warning ⚠️';
      morningBody = `You are ${formatCurrency(Math.abs(remaining), currencyCode)} over your monthly budget limit.`;
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

  // -------------------------------------------------------------
  // SLOT 2: MIDDAY NOTIFICATION (14:00 PM) - Prioritizes DEBT reminders
  // -------------------------------------------------------------
  let afternoonTitle = 'Midday Ledger Pulse 📊';
  let afternoonBody = 'Take a quick moment to review your open debt balances and credit logs.';

  if (debtsEnabled && topUnpaidDebt) {
    afternoonTitle = 'Pending Debt Reminder 💳';
    const extraCount = unpaidDebtsCount > 1 ? ` (+${unpaidDebtsCount - 1} other debt${unpaidDebtsCount > 2 ? 's' : ''})` : '';
    afternoonBody = `You have to pay ${topUnpaidDebt.personName} ${formatCurrency(topUnpaidDebt.remainingAmount, topUnpaidDebt.currency)}${extraCount}.`;
  } else if (creditsEnabled && topCredit) {
    afternoonTitle = 'Credit Item Reminder 🤝';
    const extraCreditCount = pendingCreditsCount > 1 ? ` (+${pendingCreditsCount - 1} more)` : '';
    afternoonBody = `${topCredit.personName} owes you ${formatCurrency(topCredit.amount, topCredit.currency)}${extraCreditCount}. Tap to view or send reminder.`;
  } else if (subsEnabled && activeSubsCount > 0) {
    afternoonTitle = 'Active Subscriptions 🔄';
    afternoonBody = `You have ${activeSubsCount} active subscription plans currently tracking.`;
  }

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

  // -------------------------------------------------------------
  // SLOT 3: EVENING NOTIFICATION (20:00 PM) - SPENDING & TOTALS
  // -------------------------------------------------------------
  let eveningTitle = 'Daily Spending Check-in 📝';
  let eveningBody = todayCount > 0
    ? `You logged ${formatCurrency(todaySpent, currencyCode)} across ${todayCount} entries today. Tap to see breakdown.`
    : "Did you spend anything today? Take 10 seconds to log today's transactions!";

  if (!spendingEnabled && debtsEnabled && topUnpaidDebt) {
    eveningTitle = 'Evening Debt Check 💳';
    eveningBody = `Reminder: You have to pay ${topUnpaidDebt.personName} ${formatCurrency(topUnpaidDebt.remainingAmount, topUnpaidDebt.currency)}.`;
  }

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

    const thisMonthEntries = entries.filter((e) => {
      const spent = new Date(e.spentAt);
      return spent.getMonth() === now.getMonth() && spent.getFullYear() === now.getFullYear();
    });

    const thisMonthSpent = thisMonthEntries.reduce((sum, e) => {
      return sum + (e.amount || 0);
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
