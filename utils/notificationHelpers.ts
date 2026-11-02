import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { formatCurrency } from './dateHelpers';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NOTIFICATION_CHANNELS = {
  DEFAULT: 'default',
  DEBTS: 'subdebt_debts',
  SUBSCRIPTIONS: 'subdebt_subscriptions',
  SPENDING: 'subdebt_spending',
  ACCOUNTS: 'subdebt_accounts',
} as const;

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DEFAULT, {
      name: 'General Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0284C7',
    });

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DEBTS, {
      name: 'Debts & Borrowed Liabilities',
      description: 'Notifications for pending debts and repayments due',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EF4444',
    });

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.SUBSCRIPTIONS, {
      name: 'Subscriptions & Renewals',
      description: 'Alerts for upcoming recurring bills and trial expirations',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.SPENDING, {
      name: 'Daily Spending & Budget Caps',
      description: 'Morning budget allowances, evening spending check-ins, and budget warnings',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.ACCOUNTS, {
      name: 'Bank Accounts & Cash Flow',
      description: 'Updates on multi-account liquid reserves and cash flow pulses',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0284C7',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  if (Device.isDevice) {
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } catch {}
  }

  return token;
}

export interface SubscriptionReminderOptions {
  id: string;
  name: string;
  expiryDate: string;
  amount?: number;
  currency?: string;
  reminderDaysBefore?: number[];
  isTrial?: boolean;
}

export async function scheduleSubscriptionReminder(
  optionsOrId: string | SubscriptionReminderOptions,
  legacyName?: string,
  legacyExpiryDate?: string
): Promise<string | null> {
  const isMasterEnabled = (await storage.getString('daily_reminder_enabled')) !== 'false';
  const subsEnabled = (await storage.getString(STORAGE_KEYS.NOTIF_SUBSCRIPTIONS_ENABLED)) !== 'false';
  if (!isMasterEnabled || !subsEnabled) return null;

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
      continue;
    }

    let title = opts.isTrial ? 'Free Trial Ending Soon' : 'Subscription Renewal';
    let body = '';

    if (opts.isTrial) {
      if (daysBefore === 0) {
        body = `Your ${opts.name} free trial ends today. Cancel now if you do not wish to be billed${formattedAmount}.`;
      } else if (daysBefore === 1) {
        body = `Your ${opts.name} free trial ends tomorrow. Cancel today to avoid being charged${formattedAmount}.`;
      } else {
        body = `Your ${opts.name} trial ends in ${daysBefore} days${formattedAmount}. Check your renewal settings.`;
      }
    } else {
      if (daysBefore === 0) {
        body = `Your ${opts.name} subscription renews today${formattedAmount}. Tap to view or log renewal.`;
      } else if (daysBefore === 1) {
        body = `Your ${opts.name} subscription renews tomorrow${formattedAmount}.`;
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
        trigger: {
          type: 'date',
          date: triggerDate,
          channelId: NOTIFICATION_CHANNELS.SUBSCRIPTIONS,
        } as any,
      });
      if (nid) scheduledIds.push(nid);
    } catch {}
  }

  return scheduledIds.length > 0 ? scheduledIds.join(',') : null;
}

export async function scheduleDebtReminder(
  id: string,
  personName: string,
  dueDate: string,
  amount?: number,
  currency?: string
) {
  const isMasterEnabled = (await storage.getString('daily_reminder_enabled')) !== 'false';
  const debtsEnabled = (await storage.getString(STORAGE_KEYS.NOTIF_DEBTS_ENABLED)) !== 'false';
  if (!isMasterEnabled || !debtsEnabled) return null;

  const triggerDate = new Date(dueDate);
  triggerDate.setHours(9, 0, 0, 0);

  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }

  const amtStr = amount && currency ? ` of ${currency} ${amount}` : '';
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Debt Due Today',
      body: `You have to pay ${personName}${amtStr} today.`,
      data: { type: 'debt', id },
    },
    trigger: {
      type: 'date',
      date: triggerDate,
      channelId: NOTIFICATION_CHANNELS.DEBTS,
    } as any,
  });

  return notificationId;
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

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const reminderKeys = [
    'daily_reminder_notification_id',
    'morning_reminder_notification_id',
    'afternoon_reminder_notification_id',
    'evening_reminder_notification_id',
  ];
  for (const k of reminderKeys) {
    await storage.delete(k);
  }
}

export async function cancelDebtNotifications() {
  try {
    const afternoonId = await storage.getString('afternoon_reminder_notification_id');
    if (afternoonId) {
      await Notifications.cancelScheduledNotificationAsync(afternoonId);
      await storage.delete('afternoon_reminder_notification_id');
    }
    const rawDebts = await storage.getString(STORAGE_KEYS.DEBTS);
    if (rawDebts) {
      const debts = JSON.parse(rawDebts) as any[];
      for (const d of debts) {
        if (d.notificationId) {
          await cancelNotification(d.notificationId);
        }
      }
    }
  } catch {}
}

export async function cancelSubscriptionNotifications() {
  try {
    const rawSubs = await storage.getString(STORAGE_KEYS.SUBSCRIPTIONS);
    if (rawSubs) {
      const subs = JSON.parse(rawSubs) as any[];
      for (const s of subs) {
        if (s.notificationId) {
          await cancelNotification(s.notificationId);
        }
      }
    }
  } catch {}
}

export async function cancelSpendingNotifications() {
  try {
    const morningId = await storage.getString('morning_reminder_notification_id');
    const eveningId = await storage.getString('evening_reminder_notification_id');
    if (morningId) {
      await Notifications.cancelScheduledNotificationAsync(morningId);
      await storage.delete('morning_reminder_notification_id');
    }
    if (eveningId) {
      await Notifications.cancelScheduledNotificationAsync(eveningId);
      await storage.delete('evening_reminder_notification_id');
    }
  } catch {}
}

export async function cancelAccountNotifications() {
  try {
    const morningId = await storage.getString('morning_reminder_notification_id');
    if (morningId) {
      await Notifications.cancelScheduledNotificationAsync(morningId);
      await storage.delete('morning_reminder_notification_id');
    }
  } catch {}
}

function computeDynamicSlotTime(
  baseHour: number,
  baseMinute: number,
  isSmartTiming: boolean,
  slotType: 'morning' | 'midday' | 'evening'
): { hour: number; minute: number } {
  if (!isSmartTiming) {
    return { hour: baseHour, minute: baseMinute };
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayOfMonth = now.getDate();

  let hour = baseHour;
  let minute = baseMinute;

  if (slotType === 'morning') {
    if (isWeekend) {
      hour = Math.min(hour + 1, 10);
      minute = 15;
    } else {
      const jitter = ((dayOfMonth * 11) % 25) - 12;
      minute = Math.max(0, Math.min(59, minute + jitter));
    }
  } else if (slotType === 'midday') {
    const jitter = ((dayOfMonth * 7) % 21) - 10;
    minute = Math.max(0, Math.min(59, minute + jitter));
  } else if (slotType === 'evening') {
    const jitter = ((dayOfMonth * 13) % 29) - 14;
    minute = Math.max(0, Math.min(59, minute + jitter));
  }

  return { hour, minute };
}

export async function rescheduleDailyReminder() {
  let isMasterEnabled = true;
  try {
    const val = await storage.getString('daily_reminder_enabled');
    isMasterEnabled = val !== 'false';
  } catch {}

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
    } catch {}
  }

  if (!isMasterEnabled) {
    return null;
  }

  const debtsEnabled = (await storage.getString(STORAGE_KEYS.NOTIF_DEBTS_ENABLED)) !== 'false';
  const subsEnabled = (await storage.getString(STORAGE_KEYS.NOTIF_SUBSCRIPTIONS_ENABLED)) !== 'false';
  const spendingEnabled = (await storage.getString(STORAGE_KEYS.NOTIF_SPENDING_ENABLED)) !== 'false';
  const creditsEnabled = (await storage.getString(STORAGE_KEYS.NOTIF_CREDITS_ENABLED)) !== 'false';
  const accountsEnabled = (await storage.getString(STORAGE_KEYS.NOTIF_ACCOUNTS_ENABLED)) !== 'false';
  const smartTiming = (await storage.getString(STORAGE_KEYS.NOTIF_SMART_TIMING_ENABLED)) !== 'false';

  let currencyCode = 'INR';
  try {
    const savedCurrency = await storage.getString(STORAGE_KEYS.CURRENCY);
    if (savedCurrency) currencyCode = savedCurrency;
  } catch {}

  let topUnpaidDebt: { personName: string; remainingAmount: number; currency: string } | null = null;
  let unpaidDebtsCount = 0;
  try {
    const rawDebts = await storage.getString(STORAGE_KEYS.DEBTS);
    if (rawDebts) {
      const debts = JSON.parse(rawDebts) as any[];
      const unpaid = debts.filter((d) => !d.isPaid);
      unpaidDebtsCount = unpaid.length;

      if (unpaid.length > 0) {
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
  } catch {}

  let urgentSub: { name: string; amount: number; currency: string; daysLeft: number; isTrial: boolean } | null = null;
  try {
    const rawSubs = await storage.getString(STORAGE_KEYS.SUBSCRIPTIONS);
    if (rawSubs) {
      const subs = JSON.parse(rawSubs) as any[];
      const active = subs.filter((s) => s.isActive !== false);
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
      }).filter((s) => s !== null && s.daysLeft >= 0 && s.daysLeft <= 2) as any[];

      expiringList.sort((a, b) => a.daysLeft - b.daysLeft);
      if (expiringList.length > 0) {
        urgentSub = expiringList[0];
      }
    }
  } catch {}

  let topCredit: { personName: string; amount: number; currency: string } | null = null;
  try {
    const rawCredits = await storage.getString(STORAGE_KEYS.CREDITS);
    if (rawCredits) {
      const credits = JSON.parse(rawCredits) as any[];
      const pending = credits.filter((c) => !c.isReturned);
      if (pending.length > 0) {
        topCredit = {
          personName: pending[0].personName,
          amount: pending[0].amount,
          currency: pending[0].currency || currencyCode,
        };
      }
    }
  } catch {}

  let budgetAmount = 0;
  try {
    const rawBudget = await storage.getString(STORAGE_KEYS.MONTHLY_BUDGET);
    if (rawBudget) {
      const parsed = JSON.parse(rawBudget);
      budgetAmount = parsed.amount || 0;
    }
  } catch {}

  let monthlySpending = 0;
  let todaySpent = 0;
  let todayCount = 0;
  try {
    const rawSpending = await storage.getString(STORAGE_KEYS.DAILY_SPENDING);
    if (rawSpending) {
      const entries = JSON.parse(rawSpending) as any[];
      const now = new Date();
      const todayYear = now.getFullYear();
      const todayMonth = now.getMonth();
      const todayDate = now.getDate();

      entries.forEach((e) => {
        const spent = new Date(e.spentAt);
        if (spent.getMonth() === todayMonth && spent.getFullYear() === todayYear) {
          monthlySpending += e.amount || 0;
        }
        if (
          spent.getDate() === todayDate &&
          spent.getMonth() === todayMonth &&
          spent.getFullYear() === todayYear
        ) {
          todaySpent += e.amount || 0;
          todayCount += 1;
        }
      });
    }
  } catch {}

  let totalLiquidBalance = 0;
  try {
    const rawAccounts = await storage.getString(STORAGE_KEYS.ACCOUNTS);
    if (rawAccounts) {
      const accounts = JSON.parse(rawAccounts) as any[];
      totalLiquidBalance = accounts
        .filter((a) => !a.isArchived)
        .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    }
  } catch {}

  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);
  const monthName = now.toLocaleDateString('en-IN', { month: 'long' });

  let morningBaseHour = 9;
  let morningBaseMinute = 0;
  try {
    const timeStr = await storage.getString('morning_reminder_time');
    if (timeStr && timeStr.includes(':')) {
      const parts = timeStr.split(':');
      morningBaseHour = parseInt(parts[0], 10);
      morningBaseMinute = parseInt(parts[1], 10);
    }
  } catch {}

  let middayBaseHour = 14;
  let middayBaseMinute = 0;
  try {
    const timeStr = await storage.getString('midday_reminder_time');
    if (timeStr && timeStr.includes(':')) {
      const parts = timeStr.split(':');
      middayBaseHour = parseInt(parts[0], 10);
      middayBaseMinute = parseInt(parts[1], 10);
    }
  } catch {}

  let eveningBaseHour = 20;
  let eveningBaseMinute = 0;
  try {
    const timeStr = await storage.getString('daily_reminder_time');
    if (timeStr && timeStr.includes(':')) {
      const parts = timeStr.split(':');
      eveningBaseHour = parseInt(parts[0], 10);
      eveningBaseMinute = parseInt(parts[1], 10);
    }
  } catch {}

  if (spendingEnabled || accountsEnabled) {
    const mTime = computeDynamicSlotTime(morningBaseHour, morningBaseMinute, smartTiming, 'morning');
    const remainingBudget = budgetAmount - monthlySpending;
    const dailyAllowance = remainingBudget > 0 ? Math.round(remainingBudget / daysRemaining) : 0;
    const rotationSeed = currentDay % 3;

    let morningTitle = 'Daily Financial Kickoff';
    let morningBody = 'Track your daily expenses to keep your balances balanced.';
    let morningChannel: string = NOTIFICATION_CHANNELS.SPENDING;

    if (budgetAmount > 0) {
      if (remainingBudget > 0) {
        if (rotationSeed === 0) {
          morningTitle = 'Daily Allowance';
          morningBody = `You have ${formatCurrency(remainingBudget, currencyCode)} remaining for ${monthName} (~${formatCurrency(dailyAllowance, currencyCode)}/day for ${daysRemaining} days).`;
        } else if (rotationSeed === 1) {
          morningTitle = 'Monthly Budget Target';
          morningBody = `${formatCurrency(remainingBudget, currencyCode)} available this month. Planned daily target: ~${formatCurrency(dailyAllowance, currencyCode)}.`;
        } else {
          morningTitle = 'Budget Allowance';
          morningBody = `Day ${currentDay} of ${daysInMonth}: ${formatCurrency(remainingBudget, currencyCode)} remaining in your monthly cap.`;
        }
      } else {
        morningTitle = 'Budget Limit Exceeded';
        morningBody = `Monthly spend is ${formatCurrency(Math.abs(remainingBudget), currencyCode)} over your budget cap.`;
      }
    } else if (accountsEnabled && totalLiquidBalance > 0) {
      morningChannel = NOTIFICATION_CHANNELS.ACCOUNTS;
      morningTitle = 'Liquid Reserve Pulse';
      morningBody = `Total balance across your accounts is ${formatCurrency(totalLiquidBalance, currencyCode)}.`;
    }

    try {
      const morningId = await Notifications.scheduleNotificationAsync({
        content: {
          title: morningTitle,
          body: morningBody,
          data: { type: 'morning_kickoff' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: mTime.hour,
          minute: mTime.minute,
          channelId: morningChannel,
        } as any,
      });
      await storage.set('morning_reminder_notification_id', morningId);
    } catch {}
  }

  const hasActionableMiddayItem =
    (debtsEnabled && topUnpaidDebt !== null) ||
    (subsEnabled && urgentSub !== null) ||
    (creditsEnabled && topCredit !== null);

  if (hasActionableMiddayItem) {
    const mdTime = computeDynamicSlotTime(middayBaseHour, middayBaseMinute, smartTiming, 'midday');
    const rotationSeed = currentDay % 3;

    let middayTitle = 'Actionable Ledger Pulse';
    let middayBody = 'Review open balance obligations.';
    let middayChannel: string = NOTIFICATION_CHANNELS.DEBTS;

    if (subsEnabled && urgentSub) {
      middayChannel = NOTIFICATION_CHANNELS.SUBSCRIPTIONS;
      const daysText = urgentSub.daysLeft === 0 ? 'today' : urgentSub.daysLeft === 1 ? 'tomorrow' : `in ${urgentSub.daysLeft} days`;
      if (urgentSub.isTrial) {
        middayTitle = 'Free Trial Expiration';
        middayBody = `Your ${urgentSub.name} trial ends ${daysText}. Check your renewal settings.`;
      } else {
        middayTitle = 'Upcoming Subscription Renewal';
        middayBody = `${urgentSub.name} is due for renewal ${daysText} (${formatCurrency(urgentSub.amount, urgentSub.currency)}).`;
      }
    } else if (debtsEnabled && topUnpaidDebt) {
      middayChannel = NOTIFICATION_CHANNELS.DEBTS;
      const extraCount = unpaidDebtsCount > 1 ? ` (+${unpaidDebtsCount - 1} more)` : '';
      if (rotationSeed === 0) {
        middayTitle = 'Pending Debt Reminder';
        middayBody = `You have to pay ${topUnpaidDebt.personName} ${formatCurrency(topUnpaidDebt.remainingAmount, topUnpaidDebt.currency)}${extraCount}.`;
      } else if (rotationSeed === 1) {
        middayTitle = 'Open Payable Balance';
        middayBody = `${topUnpaidDebt.personName} is owed ${formatCurrency(topUnpaidDebt.remainingAmount, topUnpaidDebt.currency)}${extraCount}. Record a payment when settled.`;
      } else {
        middayTitle = 'Debt Settlement Check';
        middayBody = `Reminder: open balance of ${formatCurrency(topUnpaidDebt.remainingAmount, topUnpaidDebt.currency)} with ${topUnpaidDebt.personName}.`;
      }
    } else if (creditsEnabled && topCredit) {
      middayChannel = NOTIFICATION_CHANNELS.DEFAULT;
      middayTitle = 'Credit Item Return';
      middayBody = `${topCredit.personName} owes you ${formatCurrency(topCredit.amount, topCredit.currency)}.`;
    }

    try {
      const afternoonId = await Notifications.scheduleNotificationAsync({
        content: {
          title: middayTitle,
          body: middayBody,
          data: { type: 'afternoon_pulse' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: mdTime.hour,
          minute: mdTime.minute,
          channelId: middayChannel,
        } as any,
      });
      await storage.set('afternoon_reminder_notification_id', afternoonId);
    } catch {}
  }

  if (spendingEnabled) {
    const eTime = computeDynamicSlotTime(eveningBaseHour, eveningBaseMinute, smartTiming, 'evening');
    const rotationSeed = currentDay % 3;

    let eveningTitle = 'Daily Spending Check';
    let eveningBody = 'Keep your ledger up to date by recording today expenses.';

    if (todayCount > 0) {
      if (rotationSeed === 0) {
        eveningTitle = 'Daily Spending Summary';
        eveningBody = `You logged ${formatCurrency(todaySpent, currencyCode)} across ${todayCount} entries today.`;
      } else if (rotationSeed === 1) {
        eveningTitle = 'Ledger Up to Date';
        eveningBody = `${todayCount} transactions recorded today (${formatCurrency(todaySpent, currencyCode)}). Great job keeping your books current.`;
      } else {
        eveningTitle = 'End-of-Day Total';
        eveningBody = `Today total: ${formatCurrency(todaySpent, currencyCode)} logged across ${todayCount} items. Tap to inspect breakdown.`;
      }
    } else {
      if (rotationSeed === 0) {
        eveningTitle = 'Daily Spending Check';
        eveningBody = 'No transactions recorded yet for today. Did you spend on food, travel, or groceries?';
      } else if (rotationSeed === 1) {
        eveningTitle = 'Quick Expense Check';
        eveningBody = 'Take 10 seconds to record today cash or card purchases to maintain clean numbers.';
      } else {
        eveningTitle = 'Wrap Up Today Ledger';
        eveningBody = 'Unrecorded purchases add up quickly. Record today spending before winding down.';
      }
    }

    try {
      const eveningId = await Notifications.scheduleNotificationAsync({
        content: {
          title: eveningTitle,
          body: eveningBody,
          data: { type: 'evening_wrapup' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: eTime.hour,
          minute: eTime.minute,
          channelId: NOTIFICATION_CHANNELS.SPENDING,
        } as any,
      });
      await storage.set('evening_reminder_notification_id', eveningId);
    } catch {}
  }

  return true;
}

export async function checkAndTriggerBudgetAlerts() {
  try {
    let currencyCode = 'INR';
    const savedCurrency = await storage.getString(STORAGE_KEYS.CURRENCY);
    if (savedCurrency) {
      currencyCode = savedCurrency;
    }

    let budgetAmount = 0;
    let categoryLimits: Record<string, number> = {};
    const rawBudget = await storage.getString(STORAGE_KEYS.MONTHLY_BUDGET);
    if (rawBudget) {
      const parsed = JSON.parse(rawBudget);
      budgetAmount = parsed.amount || 0;
      if (parsed.categoryLimits && typeof parsed.categoryLimits === 'object') {
        categoryLimits = parsed.categoryLimits;
      }
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
        title = 'Monthly Budget Cap Exceeded';
        body = `You have spent ${formattedSpent} of your ${formattedBudget} monthly limit.`;
      } else if (currentThreshold === 90) {
        title = 'Critical Budget Limit';
        body = `You have used ${percentage.toFixed(0)}% of your ${formattedBudget} budget (${formattedSpent} spent).`;
      } else if (currentThreshold === 70) {
        title = 'Budget Warning';
        body = `You have reached ${percentage.toFixed(0)}% of your ${formattedBudget} budget (${formattedSpent} spent).`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'budget_alert', percentage: currentThreshold },
        },
        trigger: { channelId: NOTIFICATION_CHANNELS.SPENDING } as any,
      });

      await storage.set('last_budget_alert_threshold', currentThreshold.toString());
    } else if (currentThreshold < lastAlerted) {
      await storage.set('last_budget_alert_threshold', currentThreshold.toString());
    }

    if (Object.keys(categoryLimits).length > 0) {
      const catAlertedRaw = await storage.getString('last_cat_budget_alerts');
      const catAlerted: Record<string, number> = catAlertedRaw ? JSON.parse(catAlertedRaw) : {};

      for (const [catName, limit] of Object.entries(categoryLimits)) {
        const numLimit = Number(limit);
        if (numLimit > 0) {
          const catSpent = thisMonthEntries
            .filter((e) => e.category && e.category.toLowerCase() === catName.toLowerCase())
            .reduce((sum, e) => sum + (e.amount || 0), 0);

          const catPct = (catSpent / numLimit) * 100;
          let catThreshold = 0;
          if (catPct >= 100) catThreshold = 100;
          else if (catPct >= 80) catThreshold = 80;

          const prevThreshold = catAlerted[catName] || 0;
          if (catThreshold > prevThreshold) {
            catAlerted[catName] = catThreshold;
            const formattedCatSpent = formatCurrency(catSpent, currencyCode);
            const formattedCatLimit = formatCurrency(numLimit, currencyCode);

            await Notifications.scheduleNotificationAsync({
              content: {
                title: catThreshold === 100 ? `Category Limit Exceeded: ${catName}` : `Category Warning: ${catName}`,
                body: catThreshold === 100
                  ? `You have spent ${formattedCatSpent} of your ${formattedCatLimit} limit on ${catName}.`
                  : `You have reached ${catPct.toFixed(0)}% of your ${formattedCatLimit} limit on ${catName}.`,
                data: { type: 'category_budget_alert', category: catName, percentage: catThreshold },
              },
              trigger: { channelId: NOTIFICATION_CHANNELS.SPENDING } as any,
            });
          }
        }
      }
      await storage.set('last_cat_budget_alerts', JSON.stringify(catAlerted));
    }
  } catch {}
}
