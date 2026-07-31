import { useState, useCallback, useEffect } from 'react';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { rescheduleDailyReminder } from '../utils/notificationHelpers';

export interface Budget {
  amount: number;
  categoryLimits: Record<string, number>;
}

export const useBudget = () => {
  const [budget, setBudgetState] = useState<Budget>({ amount: 0, categoryLimits: {} });
  const [isLoaded, setIsLoaded] = useState(false);

  const loadBudget = useCallback(async () => {
    try {
      const raw = await storage.getString(STORAGE_KEYS.MONTHLY_BUDGET);
      if (raw) {
        setBudgetState(JSON.parse(raw));
      }
    } catch {
      // Ignore errors
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  const setBudget = useCallback((amount: number) => {
    const newBudget = { ...budget, amount };
    storage.set(STORAGE_KEYS.MONTHLY_BUDGET, JSON.stringify(newBudget));
    setBudgetState(newBudget);
    rescheduleDailyReminder().catch(() => {});
  }, [budget]);

  const setCategoryLimit = useCallback((category: string, limit: number) => {
    const newLimits = { ...budget.categoryLimits, [category]: limit };
    const newBudget = { ...budget, categoryLimits: newLimits };
    storage.set(STORAGE_KEYS.MONTHLY_BUDGET, JSON.stringify(newBudget));
    setBudgetState(newBudget);
  }, [budget]);

  return {
    budget,
    isLoaded,
    setBudget,
    setCategoryLimit,
    refresh: loadBudget,
  };
};
