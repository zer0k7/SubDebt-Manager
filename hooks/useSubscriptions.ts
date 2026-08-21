import { useState, useCallback, useEffect } from 'react';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import * as Crypto from 'expo-crypto';
import { getIconKeyFromName } from '../utils/subscriptionIcons';
import { scheduleSubscriptionReminder, cancelNotification, rescheduleDailyReminder } from '../utils/notificationHelpers';

export type ConvertFn = (amount: number, fromCurrency: string) => number;

export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'custom';

export interface Subscription {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  startDate: string;
  expiryDate: string;
  category?: string;
  color?: string;
  iconKey?: string;
  isActive: boolean;
  notificationId?: string;
  createdAt: string;
  // Advanced features
  isTrial?: boolean;
  trialEndDate?: string;
  isShared?: boolean;
  totalPlanAmount?: number;
  myShareAmount?: number;
  sharedWithCount?: number;
  paymentMethod?: string;
  reminderDaysBefore?: number[];
  autoRenew?: boolean;
  urlOrNotes?: string;
  status?: 'active' | 'paused' | 'trial' | 'expired';
}

export interface SubscriptionInput {
  name: string;
  description?: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  startDate: string;
  expiryDate: string;
  category?: string;
  color?: string;
  iconKey?: string;
  isActive: boolean;
  isTrial?: boolean;
  trialEndDate?: string;
  isShared?: boolean;
  totalPlanAmount?: number;
  myShareAmount?: number;
  sharedWithCount?: number;
  paymentMethod?: string;
  reminderDaysBefore?: number[];
  autoRenew?: boolean;
  urlOrNotes?: string;
}

/**
 * Calculates the next renewal date after a given date based on the billing cycle.
 */
export function calculateNextRenewalDate(currentDateStr: string, cycle: BillingCycle): string {
  const base = new Date(currentDateStr);
  if (isNaN(base.getTime())) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const next = new Date(base.getTime());
  if (cycle === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (cycle === 'monthly') {
    const originalDay = next.getDate();
    next.setMonth(next.getMonth() + 1);
    // Handle month length overflow (e.g., Jan 31 -> Feb 28)
    if (next.getDate() !== originalDay && next.getDate() < 5) {
      next.setDate(0); // Last day of previous month
    }
  } else if (cycle === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    // Custom default to 30 days
    next.setDate(next.getDate() + 30);
  }

  return next.toISOString();
}

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    try {
      const raw = await storage.getString(STORAGE_KEYS.SUBSCRIPTIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSubscriptions(parsed);
      } else {
        setSubscriptions([]);
      }
    } catch {
      setSubscriptions([]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const saveSubscriptions = useCallback((subs: Subscription[]) => {
    storage.set(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
    setSubscriptions(subs);
    rescheduleDailyReminder().catch(() => {});
  }, []);

  const addSubscription = useCallback(async (input: SubscriptionInput) => {
    const id = Crypto.randomUUID();
    let notificationId: string | undefined;

    const effectiveAmount = input.isShared && input.myShareAmount ? input.myShareAmount : input.amount;
    const targetDate = input.isTrial && input.trialEndDate ? input.trialEndDate : input.expiryDate;

    if (input.isActive && targetDate) {
      const nid = await scheduleSubscriptionReminder({
        id,
        name: input.name,
        expiryDate: targetDate,
        amount: effectiveAmount,
        currency: input.currency,
        reminderDaysBefore: input.reminderDaysBefore || [1],
        isTrial: input.isTrial,
      });
      notificationId = nid || undefined;
    }

    const newSubscription: Subscription = {
      ...input,
      id,
      iconKey: input.iconKey || getIconKeyFromName(input.name),
      notificationId,
      createdAt: new Date().toISOString(),
      status: !input.isActive ? 'paused' : input.isTrial ? 'trial' : 'active',
    };

    const updated = [newSubscription, ...subscriptions];
    saveSubscriptions(updated);
    return newSubscription;
  }, [subscriptions, saveSubscriptions]);

  const updateSubscription = useCallback(async (id: string, updates: Partial<SubscriptionInput>) => {
    const subToUpdate = subscriptions.find(s => s.id === id);
    if (!subToUpdate) return;

    let newNotificationId = subToUpdate.notificationId;

    const merged = { ...subToUpdate, ...updates };
    const effectiveAmount = merged.isShared && merged.myShareAmount ? merged.myShareAmount : merged.amount;
    const targetDate = merged.isTrial && merged.trialEndDate ? merged.trialEndDate : merged.expiryDate;

    if (subToUpdate.notificationId) {
      await cancelNotification(subToUpdate.notificationId);
    }

    if (merged.isActive && targetDate) {
      const nid = await scheduleSubscriptionReminder({
        id,
        name: merged.name,
        expiryDate: targetDate,
        amount: effectiveAmount,
        currency: merged.currency,
        reminderDaysBefore: merged.reminderDaysBefore || [1],
        isTrial: merged.isTrial,
      });
      newNotificationId = nid || undefined;
    } else {
      newNotificationId = undefined;
    }

    const updated = subscriptions.map((sub) => {
      if (sub.id === id) {
        const updatedSub: Subscription = {
          ...sub,
          ...updates,
          notificationId: newNotificationId,
          iconKey: updates.iconKey || (updates.name ? getIconKeyFromName(updates.name) : sub.iconKey),
          status: !merged.isActive ? 'paused' : merged.isTrial ? 'trial' : 'active',
        };
        return updatedSub;
      }
      return sub;
    });
    saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  const deleteSubscription = useCallback(async (id: string) => {
    const subToDelete = subscriptions.find(s => s.id === id);
    if (subToDelete?.notificationId) {
      await cancelNotification(subToDelete.notificationId);
    }
    const updated = subscriptions.filter((sub) => sub.id !== id);
    saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  const toggleSubscriptionActive = useCallback(async (id: string) => {
    const subToToggle = subscriptions.find(s => s.id === id);
    if (!subToToggle) return;

    const newActive = !subToToggle.isActive;
    let newNotificationId = subToToggle.notificationId;

    if (subToToggle.notificationId) {
      await cancelNotification(subToToggle.notificationId);
      newNotificationId = undefined;
    }

    if (newActive) {
      const effectiveAmount = subToToggle.isShared && subToToggle.myShareAmount ? subToToggle.myShareAmount : subToToggle.amount;
      const targetDate = subToToggle.isTrial && subToToggle.trialEndDate ? subToToggle.trialEndDate : subToToggle.expiryDate;
      if (targetDate) {
        const nid = await scheduleSubscriptionReminder({
          id,
          name: subToToggle.name,
          expiryDate: targetDate,
          amount: effectiveAmount,
          currency: subToToggle.currency,
          reminderDaysBefore: subToToggle.reminderDaysBefore || [1],
          isTrial: subToToggle.isTrial,
        });
        newNotificationId = nid || undefined;
      }
    }

    const updated = subscriptions.map((sub) =>
      sub.id === id
        ? {
            ...sub,
            isActive: newActive,
            status: (newActive ? (sub.isTrial ? 'trial' : 'active') : 'paused') as Subscription['status'],
            notificationId: newNotificationId,
          }
        : sub
    );
    saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  /**
   * 1-Tap Mark As Renewed action.
   * Advances expiry date to next billing cycle and optionally writes a record into Daily Spending.
   */
  const markAsRenewed = useCallback(async (
    id: string,
    options?: { logToSpending?: boolean; spendingCategory?: string; notes?: string }
  ) => {
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return;

    const oldExpiry = sub.expiryDate || new Date().toISOString();
    const nextExpiry = calculateNextRenewalDate(oldExpiry, sub.billingCycle);

    // Cancel old reminder
    if (sub.notificationId) {
      await cancelNotification(sub.notificationId);
    }

    const effectiveAmount = sub.isShared && sub.myShareAmount ? sub.myShareAmount : sub.amount;

    // Schedule next reminder
    const newNid = await scheduleSubscriptionReminder({
      id,
      name: sub.name,
      expiryDate: nextExpiry,
      amount: effectiveAmount,
      currency: sub.currency,
      reminderDaysBefore: sub.reminderDaysBefore || [1],
      isTrial: false,
    });

    // Optionally append to Daily Spending
    if (options?.logToSpending) {
      try {
        const rawSpending = await storage.getString(STORAGE_KEYS.DAILY_SPENDING);
        const entries = rawSpending ? JSON.parse(rawSpending) : [];
        const newSpendingEntry = {
          id: Crypto.randomUUID(),
          title: `${sub.name} Subscription`,
          amount: effectiveAmount,
          currency: sub.currency,
          category: options.spendingCategory || sub.category || 'Subscriptions',
          spentAt: new Date().toISOString(),
          notes: options.notes || `Recurring renewal (${sub.billingCycle})`,
          createdAt: new Date().toISOString(),
        };
        storage.set(STORAGE_KEYS.DAILY_SPENDING, JSON.stringify([newSpendingEntry, ...entries]));
      } catch (err) {
        // Continue even if logging spending fails
      }
    }

    const updated = subscriptions.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          startDate: oldExpiry,
          expiryDate: nextExpiry,
          isActive: true,
          isTrial: false, // Converted to paid on renewal
          status: 'active' as const,
          notificationId: newNid || undefined,
        };
      }
      return s;
    });

    saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  const duplicateSubscription = useCallback((id: string) => {
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return;

    const newSub: Subscription = {
      ...sub,
      id: Crypto.randomUUID(),
      name: `${sub.name} (Copy)`,
      notificationId: undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSub, ...subscriptions];
    saveSubscriptions(updated);
    return newSub;
  }, [subscriptions, saveSubscriptions]);

  const getSubscriptionById = useCallback((id: string) => {
    return subscriptions.find((sub) => sub.id === id);
  }, [subscriptions]);

  /**
   * Monthly normalized burn rate for all active subscriptions.
   */
  const getMonthlyBurnRate = useCallback((convertFn?: ConvertFn) => {
    return subscriptions
      .filter((s) => s.isActive && !s.isTrial)
      .reduce((sum, s) => {
        const amt = s.isShared && s.myShareAmount ? s.myShareAmount : s.amount;
        const converted = convertFn ? convertFn(amt, s.currency) : amt;
        if (s.billingCycle === 'weekly') return sum + converted * 4.33;
        if (s.billingCycle === 'monthly') return sum + converted;
        if (s.billingCycle === 'yearly') return sum + converted / 12;
        return sum + converted;
      }, 0);
  }, [subscriptions]);

  /**
   * Yearly normalized outflow.
   */
  const getYearlyBurnRate = useCallback((convertFn?: ConvertFn) => {
    return getMonthlyBurnRate(convertFn) * 12;
  }, [getMonthlyBurnRate]);

  const getTotalAmount = useCallback((convertFn?: ConvertFn) => {
    const now = Date.now();
    return subscriptions
      .filter((sub) => {
        if (!sub.isActive) return false;
        if (!sub.expiryDate) return true;
        return new Date(sub.expiryDate).getTime() > now;
      })
      .reduce((total, sub) => {
        const amt = sub.isShared && sub.myShareAmount ? sub.myShareAmount : sub.amount;
        return total + (convertFn ? convertFn(amt, sub.currency) : amt);
      }, 0);
  }, [subscriptions]);

  return {
    subscriptions,
    isLoaded,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionActive,
    markAsRenewed,
    duplicateSubscription,
    getSubscriptionById,
    getTotalAmount,
    getMonthlyBurnRate,
    getYearlyBurnRate,
    refresh: loadSubscriptions,
  };
};
