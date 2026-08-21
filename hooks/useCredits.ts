import { useState, useCallback, useEffect, useMemo } from 'react';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import * as Crypto from 'expo-crypto';
import { scheduleDebtReminder, cancelNotification, rescheduleDailyReminder } from '../utils/notificationHelpers';

export type ConvertFn = (amount: number, fromCurrency: string) => number;

export interface CreditPayment {
  id: string;
  amount: number;
  returnedDate: string;
  notes?: string;
}

export interface Credit {
  id: string;
  personName: string;
  phoneNumber?: string;
  amount: number;
  currency: string;
  purpose?: string;
  lentDate: string;
  expectedReturnDate?: string;
  isReturned: boolean;
  returnedDate?: string;
  notes?: string;
  payments?: CreditPayment[];
  notificationId?: string;
  createdAt: string;
}

export interface CreditInput {
  personName: string;
  phoneNumber?: string;
  amount: number;
  currency: string;
  purpose?: string;
  lentDate: string;
  expectedReturnDate?: string;
  notes?: string;
  isReturned?: boolean;
}

export const useCredits = () => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadCredits = useCallback(async () => {
    try {
      const raw = await storage.getString(STORAGE_KEYS.CREDITS);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCredits(Array.isArray(parsed) ? parsed : []);
      } else {
        setCredits([]);
      }
    } catch {
      setCredits([]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  const saveCredits = useCallback((creditsList: Credit[]) => {
    storage.set(STORAGE_KEYS.CREDITS, JSON.stringify(creditsList));
    setCredits(creditsList);
    rescheduleDailyReminder().catch(() => {});
  }, []);

  const addCredit = useCallback(async (input: CreditInput) => {
    const id = Crypto.randomUUID();
    let notificationId: string | undefined;

    if (!input.isReturned && input.expectedReturnDate) {
      notificationId = await scheduleDebtReminder(id, input.personName, input.expectedReturnDate) || undefined;
    }

    const newCredit: Credit = {
      ...input,
      id,
      isReturned: input.isReturned ?? false,
      notificationId,
      createdAt: new Date().toISOString(),
    };

    const updated = [newCredit, ...credits];
    saveCredits(updated);
    return newCredit;
  }, [credits, saveCredits]);

  const updateCredit = useCallback(async (id: string, updates: Partial<CreditInput>) => {
    const creditToUpdate = credits.find(c => c.id === id);
    if (!creditToUpdate) return;

    let newNotificationId = creditToUpdate.notificationId;

    if (
      (updates.personName && updates.personName !== creditToUpdate.personName) ||
      (updates.expectedReturnDate && updates.expectedReturnDate !== creditToUpdate.expectedReturnDate) ||
      (updates.isReturned !== undefined && updates.isReturned !== creditToUpdate.isReturned)
    ) {
      if (creditToUpdate.notificationId) {
        await cancelNotification(creditToUpdate.notificationId);
      }

      const updatedName = updates.personName || creditToUpdate.personName;
      const updatedDate = updates.expectedReturnDate || creditToUpdate.expectedReturnDate;
      const updatedIsReturned = updates.isReturned !== undefined ? updates.isReturned : creditToUpdate.isReturned;

      if (!updatedIsReturned && updatedDate) {
        newNotificationId = await scheduleDebtReminder(id, updatedName, updatedDate) || undefined;
      } else {
        newNotificationId = undefined;
      }
    }

    const updated = credits.map((credit) =>
      credit.id === id ? { ...credit, ...updates, notificationId: newNotificationId } : credit
    );
    saveCredits(updated);
  }, [credits, saveCredits]);

  const deleteCredit = useCallback(async (id: string) => {
    const creditToDelete = credits.find(c => c.id === id);
    if (creditToDelete?.notificationId) {
      await cancelNotification(creditToDelete.notificationId);
    }
    const updated = credits.filter((credit) => credit.id !== id);
    saveCredits(updated);
  }, [credits, saveCredits]);

  const markCreditAsReturned = useCallback(async (id: string) => {
    const creditToUpdate = credits.find(c => c.id === id);
    if (creditToUpdate?.notificationId) {
      await cancelNotification(creditToUpdate.notificationId);
    }

    const updated = credits.map((credit) =>
      credit.id === id
        ? { ...credit, isReturned: true, returnedDate: new Date().toISOString(), notificationId: undefined }
        : credit
    );
    saveCredits(updated);
  }, [credits, saveCredits]);

  const markCreditAsPending = useCallback(async (id: string) => {
    const creditToUpdate = credits.find(c => c.id === id);
    if (!creditToUpdate) return;

    let newNotificationId: string | undefined;
    if (creditToUpdate.expectedReturnDate) {
      newNotificationId = await scheduleDebtReminder(id, creditToUpdate.personName, creditToUpdate.expectedReturnDate) || undefined;
    }

    const updated = credits.map((credit) =>
      credit.id === id
        ? { ...credit, isReturned: false, returnedDate: undefined, notificationId: newNotificationId }
        : credit
    );
    saveCredits(updated);
  }, [credits, saveCredits]);

  const getRemainingAmount = useCallback((credit: Credit) => {
    const totalReturned = (credit.payments || []).reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, credit.amount - totalReturned);
  }, []);

  const addPayment = useCallback((creditId: string, paymentAmount: number, notes?: string) => {
    const updated = credits.map((credit) => {
      if (credit.id === creditId) {
        const newPayment: CreditPayment = {
          id: Crypto.randomUUID(),
          amount: paymentAmount,
          returnedDate: new Date().toISOString(),
          notes,
        };
        const payments = [...(credit.payments || []), newPayment];
        const remaining = credit.amount - payments.reduce((sum, p) => sum + p.amount, 0);
        const isReturned = remaining <= 0;
        
        return {
          ...credit,
          payments,
          isReturned,
          returnedDate: isReturned ? new Date().toISOString() : credit.returnedDate,
        };
      }
      return credit;
    });
    saveCredits(updated);
  }, [credits, saveCredits]);

  const deletePayment = useCallback((creditId: string, paymentId: string) => {
    const updated = credits.map((credit) => {
      if (credit.id === creditId) {
        const payments = (credit.payments || []).filter((p) => p.id !== paymentId);
        const remaining = credit.amount - payments.reduce((sum, p) => sum + p.amount, 0);
        const isReturned = remaining <= 0;
        
        return {
          ...credit,
          payments,
          isReturned,
          returnedDate: isReturned ? credit.returnedDate || new Date().toISOString() : undefined,
        };
      }
      return credit;
    });
    saveCredits(updated);
  }, [credits, saveCredits]);

  const getCreditById = useCallback((id: string) => {
    return credits.find((credit) => credit.id === id);
  }, [credits]);

  const getTotalPendingAmount = useCallback((convertFn?: ConvertFn) => {
    return credits
      .filter((credit) => !credit.isReturned)
      .reduce((total, credit) => {
        const remaining = getRemainingAmount(credit);
        return total + (convertFn ? convertFn(remaining, credit.currency) : remaining);
      }, 0);
  }, [credits, getRemainingAmount]);

  const getTotalReturnedAmount = useCallback((convertFn?: ConvertFn) => {
    return credits.reduce((total, credit) => {
      const paymentsTotal = (credit.payments || []).reduce((sum, p) => {
        return sum + (convertFn ? convertFn(p.amount, credit.currency) : p.amount);
      }, 0);
      return total + paymentsTotal;
    }, 0);
  }, [credits]);

  const [autoArchiveSetting, setAutoArchiveSetting] = useState('never');

  useEffect(() => {
    storage.getString(STORAGE_KEYS.AUTO_ARCHIVE_SETTLED).then((val) => {
      if (val) setAutoArchiveSetting(val);
    });
  }, [credits]);

  const filteredCreditsByArchive = useMemo(() => {
    if (autoArchiveSetting === 'never') return credits;
    const now = Date.now();
    let maxMs = 0;
    if (autoArchiveSetting === '30_days') maxMs = 30 * 24 * 60 * 60 * 1000;
    else if (autoArchiveSetting === '90_days') maxMs = 90 * 24 * 60 * 60 * 1000;
    else if (autoArchiveSetting === '1_year') maxMs = 365 * 24 * 60 * 60 * 1000;

    if (maxMs === 0) return credits;

    return credits.filter((c: Credit) => {
      if (!c.isReturned) return true;
      const createdTime = new Date(c.createdAt).getTime();
      return (now - createdTime) <= maxMs;
    });
  }, [credits, autoArchiveSetting]);

  return {
    credits: filteredCreditsByArchive,
    rawCredits: credits,
    isLoaded,
    addCredit,
    updateCredit,
    deleteCredit,
    markCreditAsReturned,
    markCreditAsPending,
    addPayment,
    deletePayment,
    getRemainingAmount,
    getCreditById,
    getTotalPendingAmount,
    getTotalReturnedAmount,
    refresh: loadCredits,
  };
};
