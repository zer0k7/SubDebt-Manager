import { useState, useCallback, useEffect, useMemo } from 'react';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import * as Crypto from 'expo-crypto';

export type ConvertFn = (amount: number, fromCurrency: string) => number;

export type IncomeCategory =
  | 'Salary'
  | 'Freelance'
  | 'Business'
  | 'Investments'
  | 'Rental'
  | 'Gifts'
  | 'Other';

export interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  currency: string;
  category: IncomeCategory;
  receivedAt: string;
  notes?: string;
  isRecurring?: boolean;
  recurrence?: 'monthly' | 'biweekly' | 'weekly';
  createdAt: string;
}

export interface IncomeInput {
  source: string;
  amount: number;
  currency: string;
  category: IncomeCategory;
  receivedAt: string;
  notes?: string;
  isRecurring?: boolean;
  recurrence?: 'monthly' | 'biweekly' | 'weekly';
}

export const INCOME_CATEGORIES: { name: IncomeCategory; icon: string; color: string }[] = [
  { name: 'Salary', icon: 'cash-outline', color: '#66BB6A' },
  { name: 'Freelance', icon: 'laptop-outline', color: '#42A5F5' },
  { name: 'Business', icon: 'briefcase-outline', color: '#FFA726' },
  { name: 'Investments', icon: 'trending-up-outline', color: '#AB47BC' },
  { name: 'Rental', icon: 'home-outline', color: '#26A69A' },
  { name: 'Gifts', icon: 'gift-outline', color: '#EC407A' },
  { name: 'Other', icon: 'wallet-outline', color: '#78909C' },
];

export const useIncome = () => {
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadIncomes = useCallback(async () => {
    try {
      const raw = await storage.getString(STORAGE_KEYS.INCOME_ENTRIES);
      if (raw) {
        const parsed = JSON.parse(raw);
        setIncomes(Array.isArray(parsed) ? parsed : []);
      } else {
        setIncomes([]);
      }
    } catch {
      setIncomes([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadIncomes();
  }, [loadIncomes]);

  const saveIncomes = useCallback(async (list: IncomeEntry[]) => {
    try {
      await storage.set(STORAGE_KEYS.INCOME_ENTRIES, JSON.stringify(list));
      setIncomes(list);
    } catch (err) {
      console.error('Failed to save income entries:', err);
    }
  }, []);

  const addIncome = useCallback(
    async (input: IncomeInput): Promise<IncomeEntry> => {
      const newEntry: IncomeEntry = {
        id: Crypto.randomUUID(),
        source: input.source.trim(),
        amount: input.amount,
        currency: input.currency,
        category: input.category,
        receivedAt: input.receivedAt,
        notes: input.notes?.trim() || undefined,
        isRecurring: input.isRecurring,
        recurrence: input.recurrence,
        createdAt: new Date().toISOString(),
      };

      const updated = [newEntry, ...incomes];
      await saveIncomes(updated);
      return newEntry;
    },
    [incomes, saveIncomes]
  );

  const updateIncome = useCallback(
    async (id: string, input: Partial<IncomeInput>): Promise<void> => {
      const updated = incomes.map((entry) => {
        if (entry.id !== id) return entry;
        return {
          ...entry,
          ...input,
          source: input.source !== undefined ? input.source.trim() : entry.source,
          notes: input.notes !== undefined ? input.notes.trim() || undefined : entry.notes,
        };
      });
      await saveIncomes(updated);
    },
    [incomes, saveIncomes]
  );

  const deleteIncome = useCallback(
    async (id: string): Promise<void> => {
      const updated = incomes.filter((e) => e.id !== id);
      await saveIncomes(updated);
    },
    [incomes, saveIncomes]
  );

  const getTotalIncomeForMonth = useCallback(
    (date: Date, convertFn?: ConvertFn): number => {
      const month = date.getMonth();
      const year = date.getFullYear();

      return incomes
        .filter((entry) => {
          const received = new Date(entry.receivedAt);
          return received.getMonth() === month && received.getFullYear() === year;
        })
        .reduce((sum, entry) => {
          const val = convertFn ? convertFn(entry.amount, entry.currency) : entry.amount;
          return sum + val;
        }, 0);
    },
    [incomes]
  );

  const getTotalIncomeForYear = useCallback(
    (date: Date, convertFn?: ConvertFn): number => {
      const year = date.getFullYear();

      return incomes
        .filter((entry) => {
          const received = new Date(entry.receivedAt);
          return received.getFullYear() === year;
        })
        .reduce((sum, entry) => {
          const val = convertFn ? convertFn(entry.amount, entry.currency) : entry.amount;
          return sum + val;
        }, 0);
    },
    [incomes]
  );

  return {
    incomes,
    isLoaded,
    addIncome,
    updateIncome,
    deleteIncome,
    getTotalIncomeForMonth,
    getTotalIncomeForYear,
    refresh: loadIncomes,
  };
};
