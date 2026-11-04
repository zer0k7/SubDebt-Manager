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
    totalIncomeEntries: number;
    totalAccounts: number;
    totalAccountTransactions: number;
    totalReceiptImages?: number;
  };
  subscriptions: any[];
  debts: any[];
  credits: any[];
  dailySpending: any[];
  monthlyBudget: any;
  customCategories: any[];
  customizedCategories?: any[];
  incomeEntries: any[];
  accounts: any[];
  accountTransactions: any[];
  accountCustomCategories: string[];
  receiptImages?: Record<string, string>;
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
    notifDebtsEnabled?: boolean;
    notifSubscriptionsEnabled?: boolean;
    notifSpendingEnabled?: boolean;
    notifCreditsEnabled?: boolean;
    morningReminderTime?: string;
    middayReminderTime?: string;
    autoSnapshotEnabled?: boolean;
    biometricAuthEnabled?: boolean;
    hasSeenOnboarding?: boolean;
  };
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

const safeParseObject = <T>(raw: string | null | undefined): T | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
};

export const buildComprehensiveExportData = async (
  triggerType: string = 'manual'
): Promise<ComprehensiveExportData & { triggerType?: string }> => {
  const subscriptionsRaw = await storage.getString(STORAGE_KEYS.SUBSCRIPTIONS);
  const debtsRaw = await storage.getString(STORAGE_KEYS.DEBTS);
  const creditsRaw = await storage.getString(STORAGE_KEYS.CREDITS);
  const dailySpendingRaw = await storage.getString(STORAGE_KEYS.DAILY_SPENDING);
  const monthlyBudgetRaw = await storage.getString(STORAGE_KEYS.MONTHLY_BUDGET);
  const customCategoriesRaw = await storage.getString(STORAGE_KEYS.CUSTOM_CATEGORIES);
  const customizedCategoriesRaw = await storage.getString(STORAGE_KEYS.CATEGORIES_CUSTOMIZED);
  const incomeEntriesRaw = await storage.getString(STORAGE_KEYS.INCOME_ENTRIES);
  const accountsRaw = await storage.getString(STORAGE_KEYS.ACCOUNTS);
  const accountTxsRaw = await storage.getString(STORAGE_KEYS.ACCOUNT_TRANSACTIONS);
  const accountCustomCategoriesRaw = await storage.getString(STORAGE_KEYS.ACCOUNT_CUSTOM_CATEGORIES);

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
  const notifDebtsRaw = await storage.getString(STORAGE_KEYS.NOTIF_DEBTS_ENABLED);
  const notifSubsRaw = await storage.getString(STORAGE_KEYS.NOTIF_SUBSCRIPTIONS_ENABLED);
  const notifSpendingRaw = await storage.getString(STORAGE_KEYS.NOTIF_SPENDING_ENABLED);
  const notifCreditsRaw = await storage.getString(STORAGE_KEYS.NOTIF_CREDITS_ENABLED);
  const morningTime = await storage.getString('morning_reminder_time');
  const middayTime = await storage.getString('midday_reminder_time');
  const autoSnapshotRaw = await storage.getString(STORAGE_KEYS.AUTO_SNAPSHOT_ENABLED);
  const biometricRaw = await storage.getString(STORAGE_KEYS.IS_BIOMETRIC_AUTH_ENABLED);
  const hasSeenOnboardingRaw = await storage.getString(STORAGE_KEYS.HAS_SEEN_ONBOARDING);

  const subscriptions = safeParseArray<any>(subscriptionsRaw);
  const debts = safeParseArray<any>(debtsRaw);
  const credits = safeParseArray<any>(creditsRaw);
  const dailySpending = safeParseArray<any>(dailySpendingRaw);
  const monthlyBudget = safeParseObject<any>(monthlyBudgetRaw);
  const customCategories = safeParseArray<any>(customCategoriesRaw);
  const customizedCategories = safeParseArray<any>(customizedCategoriesRaw);
  const incomeEntries = safeParseArray<any>(incomeEntriesRaw);
  const accounts = safeParseArray<any>(accountsRaw);
  const accountTransactions = safeParseArray<any>(accountTxsRaw);
  const accountCustomCategories = safeParseArray<string>(accountCustomCategoriesRaw);

  const receiptImages: Record<string, string> = {};
  for (const item of dailySpending) {
    if (item && item.receiptImage && typeof item.receiptImage === 'string') {
      try {
        const fileInfo = await FileSystem.getInfoAsync(item.receiptImage);
        if (fileInfo.exists) {
          const fileName = item.receiptImage.split('/').pop();
          if (fileName) {
            const base64 = await FileSystem.readAsStringAsync(item.receiptImage, {
              encoding: FileSystem.EncodingType.Base64,
            });
            receiptImages[fileName] = base64;
          }
        }
      } catch {}
    }
  }

  const receiptImagesCount = Object.keys(receiptImages).length;

  return {
    version: '2.19.0',
    schemaVersion: 5,
    exportedAt: new Date().toISOString(),
    platform: Platform.OS,
    triggerType,
    metadata: {
      totalSubscriptions: subscriptions.length,
      totalDebts: debts.length,
      totalCredits: credits.length,
      totalDailySpending: dailySpending.length,
      totalCustomCategories: customCategories.length,
      totalIncomeEntries: incomeEntries.length,
      totalAccounts: accounts.length,
      totalAccountTransactions: accountTransactions.length,
      totalReceiptImages: receiptImagesCount,
    },
    subscriptions,
    debts,
    credits,
    dailySpending,
    monthlyBudget,
    customCategories,
    customizedCategories: customizedCategories.length > 0 ? customizedCategories : undefined,
    incomeEntries,
    accounts,
    accountTransactions,
    accountCustomCategories,
    receiptImages: receiptImagesCount > 0 ? receiptImages : undefined,
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
      notifDebtsEnabled: notifDebtsRaw ? notifDebtsRaw === 'true' : undefined,
      notifSubscriptionsEnabled: notifSubsRaw ? notifSubsRaw === 'true' : undefined,
      notifSpendingEnabled: notifSpendingRaw ? notifSpendingRaw === 'true' : undefined,
      notifCreditsEnabled: notifCreditsRaw ? notifCreditsRaw === 'true' : undefined,
      morningReminderTime: morningTime || undefined,
      middayReminderTime: middayTime || undefined,
      autoSnapshotEnabled: autoSnapshotRaw ? autoSnapshotRaw === 'true' : undefined,
      biometricAuthEnabled: biometricRaw ? biometricRaw === 'true' : undefined,
      hasSeenOnboarding: hasSeenOnboardingRaw ? hasSeenOnboardingRaw === 'true' : undefined,
    },
  };
};

export const exportAllData = async (): Promise<boolean> => {
  try {
    const exportData = await buildComprehensiveExportData('manual');

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
