import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { ComprehensiveExportData } from './exportData';
import { importDataObj, ImportResult } from './importData';

export const VAULT_BACKUPS_DIR = `${FileSystem.documentDirectory}vault_backups/`;
const MAX_SNAPSHOT_RETENTION = 30; // Keep up to 30 snapshots

export interface VaultSnapshotItem {
  id: string;
  fileName: string;
  filePath: string;
  createdAt: string;
  sizeBytes: number;
  sizeFormatted: string;
  metadata: {
    totalRecords: number;
    subscriptions: number;
    debts: number;
    credits: number;
    dailySpending: number;
    customCategories: number;
    triggerType: 'auto' | 'manual';
    schemaVersion: number;
  };
}

/**
 * Ensures the dedicated vault backups folder exists in the permanent document directory.
 */
export const ensureVaultDirectoryExists = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(VAULT_BACKUPS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(VAULT_BACKUPS_DIR, { intermediates: true });
    }
  } catch (err) {
    console.warn('Failed to create vault backups directory:', err);
  }
};

/**
 * Formats byte size into human readable string (KB / MB)
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Creates an encrypted JSON snapshot backup of all local ledger records and user preferences.
 */
export const createVaultSnapshot = async (
  triggerType: 'auto' | 'manual' = 'manual'
): Promise<{ success: boolean; filePath?: string; fileName?: string; error?: string }> => {
  try {
    await ensureVaultDirectoryExists();

    // 1. Fetch core records from MMKV
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

    const now = new Date();
    const exportData: ComprehensiveExportData & { triggerType: string } = {
      version: '2.9.0',
      schemaVersion: 2,
      exportedAt: now.toISOString(),
      platform: Platform.OS,
      triggerType,
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

    // Standardized file naming: SubDebt_Snapshot_YYYY-MM-DD_HHmmss.json
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    const fileName = `SubDebt_Snapshot_${yyyy}-${mm}-${dd}_${hh}${min}${ss}.json`;
    const filePath = `${VAULT_BACKUPS_DIR}${fileName}`;

    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(exportData, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    // Update MMKV tracking
    const todayStr = `${yyyy}-${mm}-${dd}`;
    if (triggerType === 'auto') {
      await storage.set(STORAGE_KEYS.LAST_AUTO_SNAPSHOT_DATE, todayStr);
    }
    await storage.set(STORAGE_KEYS.LAST_BACKUP, now.toISOString());

    // Clean up older snapshots beyond retention limit
    await enforceSnapshotRetention();

    return {
      success: true,
      filePath,
      fileName,
    };
  } catch (error) {
    console.error('Failed to create vault snapshot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown snapshot error',
    };
  }
};

/**
 * Lists all existing snapshots in the vault backups folder, sorted newest first.
 */
export const listVaultSnapshots = async (): Promise<VaultSnapshotItem[]> => {
  try {
    await ensureVaultDirectoryExists();
    const files = await FileSystem.readDirectoryAsync(VAULT_BACKUPS_DIR);
    const jsonFiles = files.filter((f) => f.startsWith('SubDebt_Snapshot_') && f.endsWith('.json'));

    const items: VaultSnapshotItem[] = [];

    for (const fileName of jsonFiles) {
      try {
        const filePath = `${VAULT_BACKUPS_DIR}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists && !fileInfo.isDirectory) {
          const content = await FileSystem.readAsStringAsync(filePath);
          const data = JSON.parse(content);

          const subs = Array.isArray(data.subscriptions) ? data.subscriptions.length : 0;
          const debts = Array.isArray(data.debts) ? data.debts.length : 0;
          const credits = Array.isArray(data.credits) ? data.credits.length : 0;
          const spending = Array.isArray(data.dailySpending) ? data.dailySpending.length : 0;
          const customCats = Array.isArray(data.customCategories) ? data.customCategories.length : 0;
          const totalRecords = subs + debts + credits + spending + customCats;

          const sizeBytes = fileInfo.size || content.length;

          items.push({
            id: fileName,
            fileName,
            filePath,
            createdAt: data.exportedAt || new Date(fileInfo.modificationTime ? fileInfo.modificationTime * 1000 : Date.now()).toISOString(),
            sizeBytes,
            sizeFormatted: formatBytes(sizeBytes),
            metadata: {
              totalRecords,
              subscriptions: subs,
              debts,
              credits,
              dailySpending: spending,
              customCategories: customCats,
              triggerType: data.triggerType || 'manual',
              schemaVersion: data.schemaVersion || 1,
            },
          });
        }
      } catch (e) {
        console.warn('Could not parse snapshot file:', fileName, e);
      }
    }

    // Sort descending by creation date
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Failed to list vault snapshots:', error);
    return [];
  }
};

/**
 * Restores a snapshot file from local vault backups.
 */
export const restoreVaultSnapshot = async (
  filePath: string,
  mode: 'merge' | 'replace' = 'merge'
): Promise<ImportResult> => {
  try {
    const content = await FileSystem.readAsStringAsync(filePath);
    const data = JSON.parse(content);
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
      error: error instanceof Error ? error.message : 'Restore failed',
    };
  }
};

/**
 * Deletes a snapshot from the vault directory.
 */
export const deleteVaultSnapshot = async (filePath: string): Promise<boolean> => {
  try {
    await FileSystem.deleteAsync(filePath, { idempotent: true });
    return true;
  } catch (error) {
    console.error('Failed to delete vault snapshot:', error);
    return false;
  }
};

/**
 * Shares a snapshot file using the native share sheet.
 */
export const shareVaultSnapshot = async (filePath: string, fileName: string): Promise<boolean> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: `Share Vault Snapshot: ${fileName}`,
        UTI: 'public.json',
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to share vault snapshot:', error);
    return false;
  }
};

/**
 * Enforces retention policy by keeping the most recent MAX_SNAPSHOT_RETENTION snapshots.
 */
const enforceSnapshotRetention = async (): Promise<void> => {
  try {
    const snapshots = await listVaultSnapshots();
    if (snapshots.length > MAX_SNAPSHOT_RETENTION) {
      const toDelete = snapshots.slice(MAX_SNAPSHOT_RETENTION);
      for (const item of toDelete) {
        await FileSystem.deleteAsync(item.filePath, { idempotent: true });
      }
    }
  } catch (err) {
    console.warn('Error enforcing snapshot retention:', err);
  }
};

/**
 * Checks if automated daily snapshot is due (at or after 10:00 PM IST / 22:00)
 * and generates it automatically without blocking the user.
 */
export const checkAndRunScheduledSnapshot = async (): Promise<boolean> => {
  try {
    const enabledRaw = await storage.getString(STORAGE_KEYS.AUTO_SNAPSHOT_ENABLED);
    // Default to true if not explicitly disabled
    const isEnabled = enabledRaw === null ? true : enabledRaw === 'true';
    if (!isEnabled) return false;

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const lastDate = await storage.getString(STORAGE_KEYS.LAST_AUTO_SNAPSHOT_DATE);

    // If already backed up today, skip
    if (lastDate === todayStr) {
      return false;
    }

    // Check if current hour is at or past 22 (10:00 PM)
    const currentHour = now.getHours();
    if (currentHour >= 22) {
      const result = await createVaultSnapshot('auto');
      if (result.success) {
        // Send a silent / local notification confirming snapshot
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🛡️ Vault Snapshot Secured',
              body: `Your daily offline ledger backup was created at 10:00 PM. (${result.fileName})`,
              sound: false,
            },
            trigger: null, // deliver immediately
          });
        } catch (notifErr) {
          // Notification errors should not fail backup
        }
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error during scheduled snapshot check:', error);
    return false;
  }
};
