import { useState, useCallback, useEffect, useMemo } from 'react';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import * as Crypto from 'expo-crypto';

export type AccountType = 'bank' | 'wallet' | 'cash' | 'savings';

export interface BankAccount {
  id: string;
  name: string;
  accountType: AccountType;
  accountNumberMasked?: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  color: string;
  isArchived: boolean;
  createdAt: string;
}

export type AccountTxType = 'deposit' | 'withdrawal' | 'transfer';

export interface AccountTransaction {
  id: string;
  accountId: string;
  toAccountId?: string;
  type: AccountTxType;
  amount: number;
  balanceAfter: number;
  toAccountBalanceAfter?: number;
  category: string;
  reasonNotes?: string;
  date: string;
  createdAt: string;
}

export interface CreateAccountInput {
  name: string;
  accountType: AccountType;
  accountNumberMasked?: string;
  initialBalance: number;
  currency: string;
  color: string;
}

export interface CreateTransactionInput {
  accountId: string;
  toAccountId?: string;
  type: AccountTxType;
  amount: number;
  category: string;
  reasonNotes?: string;
  date: string;
}

export const ACCOUNT_COLORS = [
  '#0284c7',
  '#16a34a',
  '#7c3aed',
  '#d97706',
  '#dc2626',
  '#0d9488',
  '#4f46e5',
  '#e11d48',
];

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  bank: 'business-outline',
  wallet: 'wallet-outline',
  cash: 'cash-outline',
  savings: 'shield-checkmark-outline',
};

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const rawAccounts = await storage.getString(STORAGE_KEYS.ACCOUNTS);
      const rawTxs = await storage.getString(STORAGE_KEYS.ACCOUNT_TRANSACTIONS);

      const parsedAccounts: BankAccount[] = rawAccounts ? JSON.parse(rawAccounts) : [];
      const parsedTxs: AccountTransaction[] = rawTxs ? JSON.parse(rawTxs) : [];

      parsedTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setAccounts(Array.isArray(parsedAccounts) ? parsedAccounts : []);
      setTransactions(Array.isArray(parsedTxs) ? parsedTxs : []);
    } catch {
      setAccounts([]);
      setTransactions([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addAccount = useCallback(async (input: CreateAccountInput) => {
    const newAccount: BankAccount = {
      id: Crypto.randomUUID(),
      name: input.name.trim(),
      accountType: input.accountType,
      accountNumberMasked: input.accountNumberMasked?.trim() || undefined,
      initialBalance: Number(input.initialBalance) || 0,
      currentBalance: Number(input.initialBalance) || 0,
      currency: input.currency,
      color: input.color || '#0284c7',
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    const updatedAccounts = [newAccount, ...accounts];
    setAccounts(updatedAccounts);
    await storage.set(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
    return newAccount;
  }, [accounts]);

  const editAccount = useCallback(async (id: string, updates: Partial<BankAccount>) => {
    const updated = accounts.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc));
    setAccounts(updated);
    await storage.set(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updated));
  }, [accounts]);

  const deleteAccount = useCallback(async (id: string) => {
    const updatedAccounts = accounts.filter((a) => a.id !== id);
    const updatedTxs = transactions.filter((t) => t.accountId !== id && t.toAccountId !== id);

    setAccounts(updatedAccounts);
    setTransactions(updatedTxs);

    await storage.set(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
    await storage.set(STORAGE_KEYS.ACCOUNT_TRANSACTIONS, JSON.stringify(updatedTxs));
  }, [accounts, transactions]);

  const addTransaction = useCallback(async (input: CreateTransactionInput) => {
    const fromAcc = accounts.find((a) => a.id === input.accountId);
    if (!fromAcc) return;

    const amt = Math.abs(Number(input.amount)) || 0;
    if (amt <= 0) return;

    let updatedAccounts = [...accounts];
    let balanceAfterFrom = fromAcc.currentBalance;

    let balanceAfterTo: number | undefined = undefined;

    if (input.type === 'deposit') {
      balanceAfterFrom += amt;
      updatedAccounts = updatedAccounts.map((a) =>
        a.id === fromAcc.id ? { ...a, currentBalance: balanceAfterFrom } : a
      );
    } else if (input.type === 'withdrawal') {
      balanceAfterFrom -= amt;
      updatedAccounts = updatedAccounts.map((a) =>
        a.id === fromAcc.id ? { ...a, currentBalance: balanceAfterFrom } : a
      );
    } else if (input.type === 'transfer' && input.toAccountId) {
      const toAcc = accounts.find((a) => a.id === input.toAccountId);
      if (!toAcc) return;

      balanceAfterFrom -= amt;
      balanceAfterTo = toAcc.currentBalance + amt;

      updatedAccounts = updatedAccounts.map((a) => {
        if (a.id === fromAcc.id) return { ...a, currentBalance: balanceAfterFrom };
        if (a.id === toAcc.id) return { ...a, currentBalance: balanceAfterTo! };
        return a;
      });
    }

    const newTx: AccountTransaction = {
      id: Crypto.randomUUID(),
      accountId: input.accountId,
      toAccountId: input.toAccountId,
      type: input.type,
      amount: amt,
      balanceAfter: balanceAfterFrom,
      toAccountBalanceAfter: balanceAfterTo,
      category: input.category.trim() || 'General',
      reasonNotes: input.reasonNotes?.trim() || undefined,
      date: input.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const updatedTxs = [newTx, ...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setAccounts(updatedAccounts);
    setTransactions(updatedTxs);

    await storage.set(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
    await storage.set(STORAGE_KEYS.ACCOUNT_TRANSACTIONS, JSON.stringify(updatedTxs));
    return newTx;
  }, [accounts, transactions]);

  const editTransaction = useCallback(async (txId: string, input: Partial<CreateTransactionInput>) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    let updatedAccounts = [...accounts];

    const oldFromAcc = updatedAccounts.find((a) => a.id === tx.accountId);
    if (oldFromAcc) {
      if (tx.type === 'deposit') {
        updatedAccounts = updatedAccounts.map((a) =>
          a.id === oldFromAcc.id ? { ...a, currentBalance: a.currentBalance - tx.amount } : a
        );
      } else if (tx.type === 'withdrawal') {
        updatedAccounts = updatedAccounts.map((a) =>
          a.id === oldFromAcc.id ? { ...a, currentBalance: a.currentBalance + tx.amount } : a
        );
      } else if (tx.type === 'transfer' && tx.toAccountId) {
        const oldToAcc = updatedAccounts.find((a) => a.id === tx.toAccountId);
        updatedAccounts = updatedAccounts.map((a) => {
          if (a.id === oldFromAcc.id) return { ...a, currentBalance: a.currentBalance + tx.amount };
          if (oldToAcc && a.id === oldToAcc.id) return { ...a, currentBalance: a.currentBalance - tx.amount };
          return a;
        });
      }
    }

    const newType = input.type ?? tx.type;
    const newAmount = input.amount !== undefined ? Math.abs(Number(input.amount)) : tx.amount;
    const newAccountId = input.accountId ?? tx.accountId;
    const newToAccountId = newType === 'transfer' ? (input.toAccountId ?? tx.toAccountId) : undefined;
    const newCategory = input.category !== undefined ? input.category.trim() || 'General' : tx.category;
    const newReasonNotes = input.reasonNotes !== undefined ? input.reasonNotes.trim() || undefined : tx.reasonNotes;
    const newDate = input.date ?? tx.date;

    const newFromAcc = updatedAccounts.find((a) => a.id === newAccountId);
    let balanceAfterFrom = newFromAcc ? newFromAcc.currentBalance : 0;
    let balanceAfterTo: number | undefined = undefined;

    if (newFromAcc) {
      if (newType === 'deposit') {
        balanceAfterFrom += newAmount;
        updatedAccounts = updatedAccounts.map((a) =>
          a.id === newFromAcc.id ? { ...a, currentBalance: balanceAfterFrom } : a
        );
      } else if (newType === 'withdrawal') {
        balanceAfterFrom -= newAmount;
        updatedAccounts = updatedAccounts.map((a) =>
          a.id === newFromAcc.id ? { ...a, currentBalance: balanceAfterFrom } : a
        );
      } else if (newType === 'transfer' && newToAccountId) {
        const newToAcc = updatedAccounts.find((a) => a.id === newToAccountId);
        if (newToAcc) {
          balanceAfterFrom -= newAmount;
          balanceAfterTo = newToAcc.currentBalance + newAmount;
          updatedAccounts = updatedAccounts.map((a) => {
            if (a.id === newFromAcc.id) return { ...a, currentBalance: balanceAfterFrom };
            if (a.id === newToAcc.id) return { ...a, currentBalance: balanceAfterTo! };
            return a;
          });
        }
      }
    }

    const updatedTx: AccountTransaction = {
      ...tx,
      accountId: newAccountId,
      toAccountId: newToAccountId,
      type: newType,
      amount: newAmount,
      balanceAfter: balanceAfterFrom,
      toAccountBalanceAfter: balanceAfterTo,
      category: newCategory,
      reasonNotes: newReasonNotes,
      date: newDate,
    };

    const updatedTxs = transactions
      .map((t) => (t.id === txId ? updatedTx : t))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setAccounts(updatedAccounts);
    setTransactions(updatedTxs);

    await storage.set(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
    await storage.set(STORAGE_KEYS.ACCOUNT_TRANSACTIONS, JSON.stringify(updatedTxs));
    return updatedTx;
  }, [accounts, transactions]);

  const deleteTransaction = useCallback(async (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    let updatedAccounts = [...accounts];
    const fromAcc = accounts.find((a) => a.id === tx.accountId);

    if (fromAcc) {
      if (tx.type === 'deposit') {
        updatedAccounts = updatedAccounts.map((a) =>
          a.id === fromAcc.id ? { ...a, currentBalance: a.currentBalance - tx.amount } : a
        );
      } else if (tx.type === 'withdrawal') {
        updatedAccounts = updatedAccounts.map((a) =>
          a.id === fromAcc.id ? { ...a, currentBalance: a.currentBalance + tx.amount } : a
        );
      } else if (tx.type === 'transfer' && tx.toAccountId) {
        const toAcc = accounts.find((a) => a.id === tx.toAccountId);
        updatedAccounts = updatedAccounts.map((a) => {
          if (a.id === fromAcc.id) return { ...a, currentBalance: a.currentBalance + tx.amount };
          if (toAcc && a.id === toAcc.id) return { ...a, currentBalance: a.currentBalance - tx.amount };
          return a;
        });
      }
    }

    const updatedTxs = transactions.filter((t) => t.id !== txId);

    setAccounts(updatedAccounts);
    setTransactions(updatedTxs);

    await storage.set(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
    await storage.set(STORAGE_KEYS.ACCOUNT_TRANSACTIONS, JSON.stringify(updatedTxs));
  }, [accounts, transactions]);

  const getAccountTransactions = useCallback((accountId: string) => {
    return transactions.filter((t) => t.accountId === accountId || t.toAccountId === accountId);
  }, [transactions]);

  const totalLiquidBalance = useMemo(() => {
    return accounts
      .filter((a) => !a.isArchived)
      .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  }, [accounts]);

  return {
    accounts,
    transactions,
    isLoaded,
    totalLiquidBalance,
    addAccount,
    editAccount,
    deleteAccount,
    addTransaction,
    editTransaction,
    deleteTransaction,
    getAccountTransactions,
    refresh: loadData,
  };
};
