import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';

export interface ComprehensiveExportData {
  version: string;
  schemaVersion: number;
  exportedAt: string;
  platform: string;
  metadata: {
    totalSubscriptions: number;
    totalDebts: number;
    totalCredits: number;
    totalDailySpending: number;
    totalCustomCategories: number;
  };
  // Core Financial Data
  subscriptions: any[];
  debts: any[];
  credits: any[];
  dailySpending: any[];
  monthlyBudget: any;
  customCategories: any[];
  // App & User Settings
  settings: {
    currency?: string;
    weekStartDay?: string;
    numberFormat?: string;
    dateFormat?: string;
    cardDensityMode?: string;
    defaultPaymentMethod?: string;
    autoArchiveSettled?: boolean;
    themeMode?: string;
    accentColor?: string;
    defaultLaunchTab?: string;
    privacyModeEnabled?: boolean;
    dailyRemindersEnabled?: boolean;
    morningReminderTime?: string;
    middayReminderTime?: string;
    biometricAuthEnabled?: boolean;
    hasSeenOnboarding?: boolean;
  };
}

export const exportAllData = async (): Promise<boolean> => {
  try {
    // 1. Fetch core records
    const subscriptionsRaw = await storage.getString(STORAGE_KEYS.SUBSCRIPTIONS);
    const debtsRaw = await storage.getString(STORAGE_KEYS.DEBTS);
    const creditsRaw = await storage.getString(STORAGE_KEYS.CREDITS);
    const dailySpendingRaw = await storage.getString(STORAGE_KEYS.DAILY_SPENDING);
    const monthlyBudgetRaw = await storage.getString(STORAGE_KEYS.MONTHLY_BUDGET);
    const customCategoriesRaw = await storage.getString(STORAGE_KEYS.CUSTOM_CATEGORIES);

    // 2. Fetch all app settings & preferences
    const currency = await storage.getString(STORAGE_KEYS.CURRENCY);
    const weekStartDay = await storage.getString(STORAGE_KEYS.WEEK_START_DAY);
    const numberFormat = await storage.getString(STORAGE_KEYS.NUMBER_FORMAT);
    const dateFormat = await storage.getString(STORAGE_KEYS.DATE_FORMAT);
    const cardDensityMode = await storage.getString(STORAGE_KEYS.CARD_DENSITY_MODE);
    const defaultPaymentMethod = await storage.getString(STORAGE_KEYS.DEFAULT_PAYMENT_METHOD);
    const autoArchiveSettledRaw = await storage.getString(STORAGE_KEYS.AUTO_ARCHIVE_SETTLED);
    const themeMode = await storage.getString('app_theme');
    const accentColor = await storage.getString('app_accent_color');
    const defaultLaunchTab = await storage.getString('default_launch_tab');
    const privacyModeRaw = await storage.getString('privacy_mode_enabled');
    const dailyReminderRaw = await storage.getString('daily_reminder_enabled');
    const morningTime = await storage.getString('morning_reminder_time');
    const middayTime = await storage.getString('midday_reminder_time');
    const biometricRaw = await storage.getString(STORAGE_KEYS.IS_BIOMETRIC_AUTH_ENABLED);
    const hasSeenOnboardingRaw = await storage.getString(STORAGE_KEYS.HAS_SEEN_ONBOARDING);

    const subscriptions = subscriptionsRaw ? JSON.parse(subscriptionsRaw) : [];
    const debts = debtsRaw ? JSON.parse(debtsRaw) : [];
    const credits = creditsRaw ? JSON.parse(creditsRaw) : [];
    const dailySpending = dailySpendingRaw ? JSON.parse(dailySpendingRaw) : [];
    const monthlyBudget = monthlyBudgetRaw ? JSON.parse(monthlyBudgetRaw) : null;
    const customCategories = customCategoriesRaw ? JSON.parse(customCategoriesRaw) : [];

    const exportData: ComprehensiveExportData = {
      version: '2.8.0',
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      platform: Platform.OS,
      metadata: {
        totalSubscriptions: subscriptions.length,
        totalDebts: debts.length,
        totalCredits: credits.length,
        totalDailySpending: dailySpending.length,
        totalCustomCategories: customCategories.length,
      },
      subscriptions,
      debts,
      credits,
      dailySpending,
      monthlyBudget,
      customCategories,
      settings: {
        currency: currency || undefined,
        weekStartDay: weekStartDay || undefined,
        numberFormat: numberFormat || undefined,
        dateFormat: dateFormat || undefined,
        cardDensityMode: cardDensityMode || undefined,
        defaultPaymentMethod: defaultPaymentMethod || undefined,
        autoArchiveSettled: autoArchiveSettledRaw ? autoArchiveSettledRaw === 'true' : undefined,
        themeMode: themeMode || undefined,
        accentColor: accentColor || undefined,
        defaultLaunchTab: defaultLaunchTab || undefined,
        privacyModeEnabled: privacyModeRaw ? privacyModeRaw === 'true' : undefined,
        dailyRemindersEnabled: dailyReminderRaw ? dailyReminderRaw === 'true' : undefined,
        morningReminderTime: morningTime || undefined,
        middayReminderTime: middayTime || undefined,
        biometricAuthEnabled: biometricRaw ? biometricRaw === 'true' : undefined,
        hasSeenOnboarding: hasSeenOnboardingRaw ? hasSeenOnboardingRaw === 'true' : undefined,
      },
    };

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const fileName = `SubDebt_FullBackup_${dateStr}_${timeStr}.json`;

    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(exportData, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export SubDebt Complete Vault Backup',
        UTI: 'public.json',
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Full Backup Export failed:', error);
    return false;
  }
};
