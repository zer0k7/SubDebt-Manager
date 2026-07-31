import { useState, useCallback, useEffect } from 'react';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import * as Crypto from 'expo-crypto';
import { scheduleDebtReminder, cancelNotification } from '../utils/notificationHelpers';

export type ConvertFn = (amount: number, fromCurrency: string) => number;

export interface DebtPayment {
  id: string;
  amount: number;
  paidDate: string;
  notes?: string;
}

export interface Debt {
  id: string;
  personName: string;
  phoneNumber?: string;
  amount: number;
  currency: string;
  purpose?: string;
  takenDate: string;
  dueDate?: string;
  isPaid: boolean;
  paidDate?: string;
  notes?: string;
  payments?: DebtPayment[];
  notificationId?: string;
  createdAt: string;
}

export interface DebtInput {
  personName: string;
  phoneNumber?: string;
  amount: number;
  currency: string;
  purpose?: string;
  takenDate: string;
  dueDate?: string;
  notes?: string;
  isPaid?: boolean;
}

export const useDebts = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadDebts = useCallback(async () => {
    try {
      const raw = await storage.getString(STORAGE_KEYS.DEBTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        setDebts(parsed);
      } else {
        setDebts([]);
      }
    } catch {
      setDebts([]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const saveDebts = useCallback((debtsList: Debt[]) => {
    storage.set(STORAGE_KEYS.DEBTS, JSON.stringify(debtsList));
    setDebts(debtsList);
  }, []);

  const addDebt = useCallback(async (input: DebtInput) => {
    const id = Crypto.randomUUID();
    let notificationId: string | undefined;

    if (!input.isPaid && input.dueDate) {
      notificationId = await scheduleDebtReminder(id, input.personName, input.dueDate) || undefined;
    }

    const newDebt: Debt = {
      ...input,
      id,
      isPaid: input.isPaid ?? false,
      notificationId,
      createdAt: new Date().toISOString(),
    };

    const updated = [newDebt, ...debts];
    saveDebts(updated);
    return newDebt;
  }, [debts, saveDebts]);

  const updateDebt = useCallback(async (id: string, updates: Partial<DebtInput>) => {
    const debtToUpdate = debts.find(d => d.id === id);
    if (!debtToUpdate) return;

    let newNotificationId = debtToUpdate.notificationId;

    if (
      (updates.personName && updates.personName !== debtToUpdate.personName) ||
      (updates.dueDate && updates.dueDate !== debtToUpdate.dueDate) ||
      (updates.isPaid !== undefined && updates.isPaid !== debtToUpdate.isPaid)
    ) {
      if (debtToUpdate.notificationId) {
        await cancelNotification(debtToUpdate.notificationId);
      }

      const updatedName = updates.personName || debtToUpdate.personName;
      const updatedDueDate = updates.dueDate || debtToUpdate.dueDate;
      const updatedIsPaid = updates.isPaid !== undefined ? updates.isPaid : debtToUpdate.isPaid;

      if (!updatedIsPaid && updatedDueDate) {
        newNotificationId = await scheduleDebtReminder(id, updatedName, updatedDueDate) || undefined;
      } else {
        newNotificationId = undefined;
      }
    }

    const updated = debts.map((debt) =>
      debt.id === id ? { ...debt, ...updates, notificationId: newNotificationId } : debt
    );
    saveDebts(updated);
  }, [debts, saveDebts]);

  const deleteDebt = useCallback(async (id: string) => {
    const debtToDelete = debts.find(d => d.id === id);
    if (debtToDelete?.notificationId) {
      await cancelNotification(debtToDelete.notificationId);
    }
    const updated = debts.filter((debt) => debt.id !== id);
    saveDebts(updated);
  }, [debts, saveDebts]);

  const markDebtAsPaid = useCallback(async (id: string) => {
    const debtToUpdate = debts.find(d => d.id === id);
    if (debtToUpdate?.notificationId) {
      await cancelNotification(debtToUpdate.notificationId);
    }

    const updated = debts.map((debt) =>
      debt.id === id
        ? { ...debt, isPaid: true, paidDate: new Date().toISOString(), notificationId: undefined }
        : debt
    );
    saveDebts(updated);
  }, [debts, saveDebts]);

  const markDebtAsUnpaid = useCallback(async (id: string) => {
    const debtToUpdate = debts.find(d => d.id === id);
    if (!debtToUpdate) return;

    let newNotificationId: string | undefined;
    if (debtToUpdate.dueDate) {
      newNotificationId = await scheduleDebtReminder(id, debtToUpdate.personName, debtToUpdate.dueDate) || undefined;
    }

    const updated = debts.map((debt) =>
      debt.id === id
        ? { ...debt, isPaid: false, paidDate: undefined, notificationId: newNotificationId }
        : debt
    );
    saveDebts(updated);
  }, [debts, saveDebts]);

  const getRemainingAmount = useCallback((debt: Debt) => {
    const totalPaid = (debt.payments || []).reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, debt.amount - totalPaid);
  }, []);

  const addPayment = useCallback((debtId: string, paymentAmount: number, notes?: string) => {
    const updated = debts.map((debt) => {
      if (debt.id === debtId) {
        const newPayment: DebtPayment = {
          id: Crypto.randomUUID(),
          amount: paymentAmount,
          paidDate: new Date().toISOString(),
          notes,
        };
        const payments = [...(debt.payments || []), newPayment];
        const remaining = debt.amount - payments.reduce((sum, p) => sum + p.amount, 0);
        const isPaid = remaining <= 0;
        
        return {
          ...debt,
          payments,
          isPaid,
          paidDate: isPaid ? new Date().toISOString() : debt.paidDate,
        };
      }
      return debt;
    });
    saveDebts(updated);
  }, [debts, saveDebts]);

  const deletePayment = useCallback((debtId: string, paymentId: string) => {
    const updated = debts.map((debt) => {
      if (debt.id === debtId) {
        const payments = (debt.payments || []).filter((p) => p.id !== paymentId);
        const remaining = debt.amount - payments.reduce((sum, p) => sum + p.amount, 0);
        const isPaid = remaining <= 0;
        
        return {
          ...debt,
          payments,
          isPaid,
          paidDate: isPaid ? debt.paidDate || new Date().toISOString() : undefined,
        };
      }
      return debt;
    });
    saveDebts(updated);
  }, [debts, saveDebts]);

  const getDebtById = useCallback((id: string) => {
    return debts.find((debt) => debt.id === id);
  }, [debts]);

  const getTotalPendingAmount = useCallback((convertFn?: ConvertFn) => {
    return debts
      .filter((debt) => !debt.isPaid)
      .reduce((total, debt) => {
        const remaining = getRemainingAmount(debt);
        return total + (convertFn ? convertFn(remaining, debt.currency) : remaining);
      }, 0);
  }, [debts, getRemainingAmount]);

  const getTotalPaidAmount = useCallback((convertFn?: ConvertFn) => {
    return debts.reduce((total, debt) => {
      const paymentsTotal = (debt.payments || []).reduce((sum, p) => {
        return sum + (convertFn ? convertFn(p.amount, debt.currency) : p.amount);
      }, 0);
      return total + paymentsTotal;
    }, 0);
  }, [debts]);

  return {
    debts,
    isLoaded,
    addDebt,
    updateDebt,
    deleteDebt,
    markDebtAsPaid,
    markDebtAsUnpaid,
    addPayment,
    deletePayment,
    getRemainingAmount,
    getDebtById,
    getTotalPendingAmount,
    getTotalPaidAmount,
    refresh: loadDebts,
  };
};
