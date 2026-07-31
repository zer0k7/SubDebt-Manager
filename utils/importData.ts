import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';

interface ImportData {
  version: string;
  exportedAt: string;
  subscriptions: any[];
  debts: any[];
  credits?: any[];
  dailySpending?: any[];
  monthlyBudget?: any;
}

export interface ImportResult {
  success: boolean;
  subscriptionsCount: number;
  debtsCount: number;
  creditsCount: number;
  spendingCount: number;
  error?: string;
}

const mergeByIds = async (storageKey: string, incoming: any[]): Promise<number> => {
  const existingRaw = await storage.getString(storageKey);
  const existing = existingRaw ? JSON.parse(existingRaw) : [];
  const existingIds = new Set(existing.map((item: any) => item.id));
  const newItems = incoming.filter((item: any) => !existingIds.has(item.id));
  const merged = [...existing, ...newItems];
  await storage.set(storageKey, JSON.stringify(merged));
  return newItems.length;
};

export const pickAndImportData = async (mode: 'merge' | 'replace' = 'merge'): Promise<ImportResult> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return {
        success: false,
        subscriptionsCount: 0,
        debtsCount: 0,
        creditsCount: 0,
        spendingCount: 0,
        error: 'User cancelled',
      };
    }

    const file = result.assets[0];
    const fileContent = await FileSystem.readAsStringAsync(file.uri);
    const data: ImportData = JSON.parse(fileContent);

    // Validate data structure
    if (!data.version || !Array.isArray(data.subscriptions) || !Array.isArray(data.debts)) {
      return {
        success: false,
        subscriptionsCount: 0,
        debtsCount: 0,
        creditsCount: 0,
        spendingCount: 0,
        error: 'Invalid backup file format',
      };
    }

    return await importDataObj(data, mode);
  } catch (error) {
    return {
      success: false,
      subscriptionsCount: 0,
      debtsCount: 0,
      creditsCount: 0,
      spendingCount: 0,
      error: error instanceof Error ? error.message : 'Import failed',
    };
  }
};

export const importDataObj = async (data: ImportData, mode: 'merge' | 'replace' = 'merge'): Promise<ImportResult> => {
  try {
    if (!data.version || !Array.isArray(data.subscriptions) || !Array.isArray(data.debts)) {
      return {
        success: false,
        subscriptionsCount: 0,
        debtsCount: 0,
        creditsCount: 0,
        spendingCount: 0,
        error: 'Invalid backup file format',
      };
    }

    const credits = Array.isArray(data.credits) ? data.credits : [];
    const dailySpending = Array.isArray(data.dailySpending) ? data.dailySpending : [];

    if (mode === 'replace') {
      await storage.set(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(data.subscriptions));
      await storage.set(STORAGE_KEYS.DEBTS, JSON.stringify(data.debts));
      await storage.set(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
      await storage.set(STORAGE_KEYS.DAILY_SPENDING, JSON.stringify(dailySpending));
      if (data.monthlyBudget) {
        await storage.set(STORAGE_KEYS.MONTHLY_BUDGET, JSON.stringify(data.monthlyBudget));
      } else {
        await storage.delete(STORAGE_KEYS.MONTHLY_BUDGET);
      }
    } else {
      // Merge mode - skip duplicates by ID
      await mergeByIds(STORAGE_KEYS.SUBSCRIPTIONS, data.subscriptions);
      await mergeByIds(STORAGE_KEYS.DEBTS, data.debts);
      await mergeByIds(STORAGE_KEYS.CREDITS, credits);
      await mergeByIds(STORAGE_KEYS.DAILY_SPENDING, dailySpending);
      if (data.monthlyBudget) {
        const existingRaw = await storage.getString(STORAGE_KEYS.MONTHLY_BUDGET);
        const existing = existingRaw ? JSON.parse(existingRaw) : { amount: 0, categoryLimits: {} };
        const imported = data.monthlyBudget;
        
        const mergedBudget = {
          amount: Math.max(existing.amount || 0, imported.amount || 0),
          categoryLimits: {
            ...(imported.categoryLimits || {}),
            ...(existing.categoryLimits || {}),
          }
        };
        await storage.set(STORAGE_KEYS.MONTHLY_BUDGET, JSON.stringify(mergedBudget));
      }
    }

    return {
      success: true,
      subscriptionsCount: data.subscriptions.length,
      debtsCount: data.debts.length,
      creditsCount: credits.length,
      spendingCount: dailySpending.length,
    };
  } catch (error) {
    return {
      success: false,
      subscriptionsCount: 0,
      debtsCount: 0,
      creditsCount: 0,
      spendingCount: 0,
      error: error instanceof Error ? error.message : 'Import failed',
    };
  }
};

export const clearAllData = async (): Promise<boolean> => {
  try {
    await storage.delete(STORAGE_KEYS.SUBSCRIPTIONS);
    await storage.delete(STORAGE_KEYS.DEBTS);
    await storage.delete(STORAGE_KEYS.CREDITS);
    await storage.delete(STORAGE_KEYS.DAILY_SPENDING);
    await storage.delete(STORAGE_KEYS.MONTHLY_BUDGET);
    return true;
  } catch {
    return false;
  }
};
