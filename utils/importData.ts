import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
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
  settingsRestored: boolean;
  error?: string;
}

const mergeByIds = async (storageKey: string, incoming: any[]): Promise<number> => {
  if (!incoming || incoming.length === 0) return 0;
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

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        subscriptionsCount: 0,
        debtsCount: 0,
        creditsCount: 0,
        spendingCount: 0,
        categoriesCount: 0,
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
        settingsRestored: false,
        error: 'Invalid backup file format',
      };
    }

    const subscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];
    const debts = Array.isArray(data.debts) ? data.debts : [];
    const credits = Array.isArray(data.credits) ? data.credits : [];
    const dailySpending = Array.isArray(data.dailySpending) ? data.dailySpending : [];
    const customCategories = Array.isArray(data.customCategories) ? data.customCategories : [];
    const monthlyBudget = data.monthlyBudget;
    const settings = data.settings || {};

    let subCount = 0;
    let debtCount = 0;
    let credCount = 0;
    let spendCount = 0;
    let catCount = 0;
    let settingsRestored = false;

    if (mode === 'replace') {
      // Direct replacement of all financial ledger tables
      await storage.set(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
      await storage.set(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
      await storage.set(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
      await storage.set(STORAGE_KEYS.DAILY_SPENDING, JSON.stringify(dailySpending));
      await storage.set(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(customCategories));

      subCount = subscriptions.length;
      debtCount = debts.length;
      credCount = credits.length;
      spendCount = dailySpending.length;
      catCount = customCategories.length;

      if (monthlyBudget) {
        await storage.set(STORAGE_KEYS.MONTHLY_BUDGET, JSON.stringify(monthlyBudget));
      }
    } else {
      // Smart Merge mode: insert non-duplicate items
      subCount = await mergeByIds(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
      debtCount = await mergeByIds(STORAGE_KEYS.DEBTS, debts);
      credCount = await mergeByIds(STORAGE_KEYS.CREDITS, credits);
      spendCount = await mergeByIds(STORAGE_KEYS.DAILY_SPENDING, dailySpending);
      catCount = await mergeByIds(STORAGE_KEYS.CUSTOM_CATEGORIES, customCategories);

      if (monthlyBudget) {
        const existingBudgetRaw = await storage.getString(STORAGE_KEYS.MONTHLY_BUDGET);
        if (!existingBudgetRaw) {
          await storage.set(STORAGE_KEYS.MONTHLY_BUDGET, JSON.stringify(monthlyBudget));
        }
      }
    }

    // Restore Settings (applicable in replace mode or when keys are absent)
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
      if (settings.morningReminderTime) await storage.set('morning_reminder_time', settings.morningReminderTime);
      if (settings.middayReminderTime) await storage.set('midday_reminder_time', settings.middayReminderTime);
      if (settings.biometricAuthEnabled !== undefined) await storage.set(STORAGE_KEYS.IS_BIOMETRIC_AUTH_ENABLED, String(settings.biometricAuthEnabled));
      if (settings.hasSeenOnboarding !== undefined) await storage.set(STORAGE_KEYS.HAS_SEEN_ONBOARDING, String(settings.hasSeenOnboarding));
      settingsRestored = true;
    }

    // Trigger notification rescheduling and budget health recalculation
    await rescheduleDailyReminder().catch(() => {});
    await checkAndTriggerBudgetAlerts().catch(() => {});

    return {
      success: true,
      subscriptionsCount: subCount,
      debtsCount: debtCount,
      creditsCount: credCount,
      spendingCount: spendCount,
      categoriesCount: catCount,
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
      settingsRestored: false,
      error: error instanceof Error ? error.message : 'Import failed',
    };
  }
};
