import { useState, useCallback, useEffect } from 'react';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import * as Crypto from 'expo-crypto';
import { getIconKeyFromName } from '../utils/subscriptionIcons';
import { scheduleSubscriptionReminder, cancelNotification } from '../utils/notificationHelpers';

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
  isActive: boolean;
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
  }, []);

  const addSubscription = useCallback(async (input: SubscriptionInput) => {
    const id = Crypto.randomUUID();
    let notificationId: string | undefined;
    
    if (input.isActive && input.expiryDate) {
      notificationId = await scheduleSubscriptionReminder(id, input.name, input.expiryDate) || undefined;
    }

    const newSubscription: Subscription = {
      ...input,
      id,
      iconKey: getIconKeyFromName(input.name),
      notificationId,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSubscription, ...subscriptions];
    saveSubscriptions(updated);
    return newSubscription;
  }, [subscriptions, saveSubscriptions]);

  const updateSubscription = useCallback(async (id: string, updates: Partial<SubscriptionInput>) => {
    const subToUpdate = subscriptions.find(s => s.id === id);
    if (!subToUpdate) return;

    let newNotificationId = subToUpdate.notificationId;

    // If name or expiry date or active status changed, reschedule notification
    if (
      (updates.name && updates.name !== subToUpdate.name) ||
      (updates.expiryDate && updates.expiryDate !== subToUpdate.expiryDate) ||
      (updates.isActive !== undefined && updates.isActive !== subToUpdate.isActive)
    ) {
      if (subToUpdate.notificationId) {
        await cancelNotification(subToUpdate.notificationId);
      }
      
      const updatedName = updates.name || subToUpdate.name;
      const updatedExpiry = updates.expiryDate || subToUpdate.expiryDate;
      const updatedIsActive = updates.isActive !== undefined ? updates.isActive : subToUpdate.isActive;

      if (updatedIsActive && updatedExpiry) {
        newNotificationId = await scheduleSubscriptionReminder(id, updatedName, updatedExpiry) || undefined;
      } else {
        newNotificationId = undefined;
      }
    }

    const updated = subscriptions.map((sub) => {
      if (sub.id === id) {
        const updatedSub = { ...sub, ...updates, notificationId: newNotificationId };
        if (updates.name) {
          updatedSub.iconKey = getIconKeyFromName(updates.name);
        }
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

    let newNotificationId = subToToggle.notificationId;
    if (subToToggle.isActive) {
      // Deactivating
      if (subToToggle.notificationId) {
        await cancelNotification(subToToggle.notificationId);
      }
      newNotificationId = undefined;
    } else {
      // Activating
      if (subToToggle.expiryDate) {
        newNotificationId = await scheduleSubscriptionReminder(id, subToToggle.name, subToToggle.expiryDate) || undefined;
      }
    }

    const updated = subscriptions.map((sub) =>
      sub.id === id ? { ...sub, isActive: !sub.isActive, notificationId: newNotificationId } : sub
    );
    saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  const getSubscriptionById = useCallback((id: string) => {
    return subscriptions.find((sub) => sub.id === id);
  }, [subscriptions]);

  const getTotalAmount = useCallback((convertFn?: ConvertFn) => {
    const now = Date.now();
    return subscriptions
      .filter((sub) => {
        if (!sub.isActive) return false;
        // If no expiry date, it's active
        if (!sub.expiryDate) return true;
        // Check if not expired
        return new Date(sub.expiryDate).getTime() > now;
      })
      .reduce((total, sub) => total + (convertFn ? convertFn(sub.amount, sub.currency) : sub.amount), 0);
  }, [subscriptions]);

  return {
    subscriptions,
    isLoaded,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionActive,
    getSubscriptionById,
    getTotalAmount,
    refresh: loadSubscriptions,
  };
};
