import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { rescheduleDailyReminder, checkAndTriggerBudgetAlerts } from './notificationHelpers';

export interface ImportResult {
  success: boolean;
  subscriptionsCount: number;
  debtsCount: number;
  creditsCount: number;
  spendingCount: number;
  categoriesCount: number;
  incomeCount?: number;
  accountsCount?: number;
  accountTransactionsCount?: number;
  settingsRestored: boolean;
  error?: string;
}

const safeParseArray = <T>(raw: string | null | undefined): T[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getItemIdentifier = (item: any): string => {
  if (!item || typeof item !== 'object') return '';
  return String(item.id || item._id || item.uuid || item.name || '');
};

const mergeByIds = async (storageKey: string, incoming: any[]): Promise<number> => {
  if (!incoming || incoming.length === 0) return 0;
  const existingRaw = await storage.getString(storageKey);
  const existing = safeParseArray<any>(existingRaw);
  const existingIds = new Set(existing.map(getItemIdentifier).filter(Boolean));

  const validNewItems: any[] = [];
  for (const item of incoming) {
    if (!item || typeof item !== 'object') continue;
    const identifier = getItemIdentifier(item);
    if (identifier && existingIds.has(identifier)) {
      continue;
    }
    const sanitizedItem = { ...item };
    if (!sanitizedItem.id && !sanitizedItem.name) {
      sanitizedItem.id = Crypto.randomUUID();
    }
    existingIds.add(getItemIdentifier(sanitizedItem));
    validNewItems.push(sanitizedItem);
  }

  const merged = [...existing, ...validNewItems];
  await storage.set(storageKey, JSON.stringify(merged));
  return validNewItems.length;
};

export const pickAndImportData = async (mode: 'merge' | 'replace' = 'merge'): Promise<ImportResult> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        subscriptionsCount: 0,
        debtsCount: 0,
        creditsCount: 0,
        spendingCount: 0,
        categoriesCount: 0,
        incomeCount: 0,
        accountsCount: 0,
        accountTransactionsCount: 0,
        settingsRestored: false,
        error: 'User cancelled file selection',
      };
    }

    const file = result.assets[0];
    const fileContent = await FileSystem.readAsStringAsync(file.uri);
    const data = JSON.parse(fileContent);

    return await importDataObj(data, mode);
  } catch (error) {
    return {
      success: false,
      subscriptionsCount: 0,
      debtsCount: 0,
      creditsCount: 0,
      spendingCount: 0,
      categoriesCount: 0,
      incomeCount: 0,
      accountsCount: 0,
      accountTransactionsCount: 0,
      settingsRestored: false,
      error: error instanceof Error ? error.message : 'Import failed',
    };
  }
};

export const importDataObj = async (data: any, mode: 'merge' | 'replace' = 'merge'): Promise<ImportResult> => {
  try {
    if (!data || typeof data !== 'object') {
      return {
        success: false,
        subscriptionsCount: 0,
        debtsCount: 0,
        creditsCount: 0,
        spendingCount: 0,
        categoriesCount: 0,
        incomeCount: 0,
        accountsCount: 0,
        accountTransactionsCount: 0,
        settingsRestored: false,
        error: 'Invalid backup file format',
      };
    }

    const subscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];
    const debts = Array.isArray(data.debts) ? data.debts : [];
    const credits = Array.isArray(data.credits) ? data.credits : [];
    const dailySpending = Array.isArray(data.dailySpending) ? data.dailySpending : [];
    const customCategories = Array.isArray(data.customCategories) ? data.customCategories : [];
    const incomeEntries = Array.isArray(data.incomeEntries) ? data.incomeEntries : [];
    const accounts = Array.isArray(data.accounts) ? data.accounts : [];
    const accountTransactions = Array.isArray(data.accountTransactions) ? data.accountTransactions : [];
    const monthlyBudget = data.monthlyBudget;
    const settings = data.settings || {};

    let subCount = 0;
    let debtCount = 0;
    let credCount = 0;
    let spendCount = 0;
    let catCount = 0;
    let incomeCount = 0;
    let accCount = 0;
    let accTxCount = 0;
    let settingsRestored = false;

    if (mode === 'replace') {
      await storage.set(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
      await storage.set(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
      await storage.set(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
      await storage.set(STORAGE_KEYS.DAILY_SPENDING, JSON.stringify(dailySpending));
      await storage.set(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(customCategories));
      await storage.set(STORAGE_KEYS.INCOME_ENTRIES, JSON.stringify(incomeEntries));
      await storage.set(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      await storage.set(STORAGE_KEYS.ACCOUNT_TRANSACTIONS, JSON.stringify(accountTransactions));

      if (Array.isArray(data.accountCustomCategories)) {
        await storage.set(STORAGE_KEYS.ACCOUNT_CUSTOM_CATEGORIES, JSON.stringify(data.accountCustomCategories));
      }

      if (Array.isArray(data.customizedCategories) && data.customizedCategories.length > 0) {
        await storage.set(STORAGE_KEYS.CATEGORIES_CUSTOMIZED, JSON.stringify(data.customizedCategories));
      }

      if (monthlyBudget) {
        await storage.set(STORAGE_KEYS.MONTHLY_BUDGET, JSON.stringify(monthlyBudget));
      }

      subCount = subscriptions.length;
      debtCount = debts.length;
      credCount = credits.length;
      spendCount = dailySpending.length;
      catCount = customCategories.length;
      incomeCount = incomeEntries.length;
      accCount = accounts.length;
      accTxCount = accountTransactions.length;
    } else {
      subCount = await mergeByIds(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
      debtCount = await mergeByIds(STORAGE_KEYS.DEBTS, debts);
      credCount = await mergeByIds(STORAGE_KEYS.CREDITS, credits);
      spendCount = await mergeByIds(STORAGE_KEYS.DAILY_SPENDING, dailySpending);
      catCount = await mergeByIds(STORAGE_KEYS.CUSTOM_CATEGORIES, customCategories);
      incomeCount = await mergeByIds(STORAGE_KEYS.INCOME_ENTRIES, incomeEntries);
      accCount = await mergeByIds(STORAGE_KEYS.ACCOUNTS, accounts);
      accTxCount = await mergeByIds(STORAGE_KEYS.ACCOUNT_TRANSACTIONS, accountTransactions);

      if (Array.isArray(data.accountCustomCategories) && data.accountCustomCategories.length > 0) {
        const existingRaw = await storage.getString(STORAGE_KEYS.ACCOUNT_CUSTOM_CATEGORIES);
        const existingCats = safeParseArray<string>(existingRaw);
        const mergedCats = Array.from(new Set([...existingCats, ...data.accountCustomCategories]));
        await storage.set(STORAGE_KEYS.ACCOUNT_CUSTOM_CATEGORIES, JSON.stringify(mergedCats));
      }

      if (Array.isArray(data.customizedCategories) && data.customizedCategories.length > 0) {
        const existingCustomizedRaw = await storage.getString(STORAGE_KEYS.CATEGORIES_CUSTOMIZED);
        const existingCustomized = safeParseArray<any>(existingCustomizedRaw);
        const existingMap = new Map(existingCustomized.map((c: any) => [c.id || c.name, c]));
        for (const item of data.customizedCategories) {
          const key = item.id || item.name;
          if (key && !existingMap.has(key)) {
            existingCustomized.push(item);
          }
        }
        await storage.set(STORAGE_KEYS.CATEGORIES_CUSTOMIZED, JSON.stringify(existingCustomized));
      }

      if (monthlyBudget) {
        const existingBudgetRaw = await storage.getString(STORAGE_KEYS.MONTHLY_BUDGET);
        if (!existingBudgetRaw) {
          await storage.set(STORAGE_KEYS.MONTHLY_BUDGET, JSON.stringify(monthlyBudget));
        }
      }
    }

    if (settings && typeof settings === 'object') {
      if (settings.currency) await storage.set(STORAGE_KEYS.CURRENCY, settings.currency);
      if (settings.weekStartDay) await storage.set(STORAGE_KEYS.WEEK_START_DAY, settings.weekStartDay);
      if (settings.numberFormat) await storage.set(STORAGE_KEYS.NUMBER_FORMAT, settings.numberFormat);
      if (settings.dateFormat) await storage.set(STORAGE_KEYS.DATE_FORMAT, settings.dateFormat);
      if (settings.cardDensityMode) await storage.set(STORAGE_KEYS.CARD_DENSITY_MODE, settings.cardDensityMode);
      if (settings.defaultPaymentMethod) await storage.set(STORAGE_KEYS.DEFAULT_PAYMENT_METHOD, settings.defaultPaymentMethod);
      if (settings.autoArchiveSettled !== undefined) await storage.set(STORAGE_KEYS.AUTO_ARCHIVE_SETTLED, String(settings.autoArchiveSettled));
      if (settings.themeMode) await storage.set('app_theme', settings.themeMode);
      if (settings.accentColor) await storage.set('app_accent_color', settings.accentColor);
      if (settings.defaultLaunchTab) await storage.set('default_launch_tab', settings.defaultLaunchTab);
      if (settings.privacyModeEnabled !== undefined) await storage.set('privacy_mode_enabled', String(settings.privacyModeEnabled));
      if (settings.dailyRemindersEnabled !== undefined) await storage.set('daily_reminder_enabled', String(settings.dailyRemindersEnabled));
      if (settings.notifDebtsEnabled !== undefined) await storage.set(STORAGE_KEYS.NOTIF_DEBTS_ENABLED, String(settings.notifDebtsEnabled));
      if (settings.notifSubscriptionsEnabled !== undefined) await storage.set(STORAGE_KEYS.NOTIF_SUBSCRIPTIONS_ENABLED, String(settings.notifSubscriptionsEnabled));
      if (settings.notifSpendingEnabled !== undefined) await storage.set(STORAGE_KEYS.NOTIF_SPENDING_ENABLED, String(settings.notifSpendingEnabled));
      if (settings.notifCreditsEnabled !== undefined) await storage.set(STORAGE_KEYS.NOTIF_CREDITS_ENABLED, String(settings.notifCreditsEnabled));
      if (settings.morningReminderTime) await storage.set('morning_reminder_time', settings.morningReminderTime);
      if (settings.middayReminderTime) await storage.set('midday_reminder_time', settings.middayReminderTime);
      if (settings.autoSnapshotEnabled !== undefined) await storage.set(STORAGE_KEYS.AUTO_SNAPSHOT_ENABLED, String(settings.autoSnapshotEnabled));
      if (settings.biometricAuthEnabled !== undefined) await storage.set(STORAGE_KEYS.IS_BIOMETRIC_AUTH_ENABLED, String(settings.biometricAuthEnabled));
      if (settings.hasSeenOnboarding !== undefined) await storage.set(STORAGE_KEYS.HAS_SEEN_ONBOARDING, String(settings.hasSeenOnboarding));
      settingsRestored = true;
    }

    await rescheduleDailyReminder().catch(() => {});
    await checkAndTriggerBudgetAlerts().catch(() => {});

    return {
      success: true,
      subscriptionsCount: subCount,
      debtsCount: debtCount,
      creditsCount: credCount,
      spendingCount: spendCount,
      categoriesCount: catCount,
      incomeCount,
      accountsCount: accCount,
      accountTransactionsCount: accTxCount,
      settingsRestored,
    };
  } catch (error) {
    return {
      success: false,
      subscriptionsCount: 0,
      debtsCount: 0,
      creditsCount: 0,
      spendingCount: 0,
      categoriesCount: 0,
      incomeCount: 0,
      accountsCount: 0,
      accountTransactionsCount: 0,
      settingsRestored: false,
      error: error instanceof Error ? error.message : 'Import failed',
    };
  }
};
