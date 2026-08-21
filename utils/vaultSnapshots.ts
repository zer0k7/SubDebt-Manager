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
 * Allows the user on Android to pick a public folder in their phone's File Manager
 * (such as Documents or Downloads) where backups will be directly visible.
 */
export const pickPublicBackupFolder = async (): Promise<{
  granted: boolean;
  folderUri?: string;
  folderName?: string;
  error?: string;
}> => {
  try {
    if (Platform.OS !== 'android') {
      return { granted: false, error: 'Custom folder selection is supported on Android.' };
    }

    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted || !permissions.directoryUri) {
      return { granted: false, error: 'Folder selection was cancelled or permission was denied.' };
    }

    const folderUri = permissions.directoryUri;
    // Extract a human-readable folder name from decoded URI
    const decoded = decodeURIComponent(folderUri);
    const parts = decoded.split(':');
    const folderName = parts.length > 1 ? parts[parts.length - 1] : 'Selected Storage Folder';

    await storage.set(STORAGE_KEYS.CUSTOM_BACKUP_FOLDER_URI, folderUri);
    await storage.set(STORAGE_KEYS.CUSTOM_BACKUP_FOLDER_NAME, folderName);

    return {
      granted: true,
      folderUri,
      folderName,
    };
  } catch (err) {
    console.error('Error selecting public backup folder:', err);
    return {
      granted: false,
      error: err instanceof Error ? err.message : 'Failed to select folder.',
    };
  }
};

/**
 * Retrieves the currently configured public phone folder name, if any.
 */
export const getPublicBackupFolderInfo = async (): Promise<{ uri: string | null; name: string | null }> => {
  try {
    const uri = await storage.getString(STORAGE_KEYS.CUSTOM_BACKUP_FOLDER_URI);
    const name = await storage.getString(STORAGE_KEYS.CUSTOM_BACKUP_FOLDER_NAME);
    return { uri: uri || null, name: name || null };
  } catch {
    return { uri: null, name: null };
  }
};

/**
 * Clears the custom public backup folder configuration.
 */
export const clearPublicBackupFolder = async (): Promise<void> => {
  try {
    await storage.delete(STORAGE_KEYS.CUSTOM_BACKUP_FOLDER_URI);
    await storage.delete(STORAGE_KEYS.CUSTOM_BACKUP_FOLDER_NAME);
  } catch (err) {
    console.warn('Error clearing backup folder:', err);
  }
};

/**
 * Exports a specific snapshot to an Android public folder or native document location.
 */
export const exportSnapshotToPhoneFolder = async (
  filePath: string,
  fileName: string
): Promise<{ success: boolean; targetUri?: string; error?: string }> => {
  try {
    if (Platform.OS === 'android') {
      let folderUri = await storage.getString(STORAGE_KEYS.CUSTOM_BACKUP_FOLDER_URI);

      if (!folderUri) {
        const pickRes = await pickPublicBackupFolder();
        if (!pickRes.granted || !pickRes.folderUri) {
          return { success: false, error: 'No folder selected.' };
        }
        folderUri = pickRes.folderUri;
      }

      const fileContent = await FileSystem.readAsStringAsync(filePath);
      const cleanFileName = fileName.replace('.json', '');
      const createdFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        folderUri,
        cleanFileName,
        'application/json'
      );

      await FileSystem.writeAsStringAsync(createdFileUri, fileContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return { success: true, targetUri: createdFileUri };
    } else {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: `Save Snapshot: ${fileName}`,
          UTI: 'public.json',
        });
        return { success: true };
      }
      return { success: false, error: 'Sharing not available.' };
    }
  } catch (err) {
    console.error('Failed to export snapshot to phone folder:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Could not export file.',
    };
  }
};

/**
 * Creates an encrypted JSON snapshot backup of all local ledger records and user preferences.
 * Writes to app document sandbox AND to the user's chosen public folder (if configured on Android).
 */
export const createVaultSnapshot = async (
  triggerType: 'auto' | 'manual' = 'manual'
): Promise<{ success: boolean; filePath?: string; fileName?: string; publicSaved?: boolean; error?: string }> => {
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
      version: '2.10.0',
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
    const jsonString = JSON.stringify(exportData, null, 2);

    // 1. Write to internal app sandbox
    await FileSystem.writeAsStringAsync(filePath, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 2. Also write directly to user's selected public folder if configured on Android
    let publicSaved = false;
    if (Platform.OS === 'android') {
      try {
        const publicFolderUri = await storage.getString(STORAGE_KEYS.CUSTOM_BACKUP_FOLDER_URI);
        if (publicFolderUri) {
          const cleanName = fileName.replace('.json', '');
          const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(
            publicFolderUri,
            cleanName,
            'application/json'
          );
          await FileSystem.writeAsStringAsync(createdUri, jsonString, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          publicSaved = true;
        }
      } catch (pubErr) {
        console.warn('Could not write snapshot to public folder:', pubErr);
      }
    }

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
      publicSaved,
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
 * Checks if automated daily snapshot is due:
 * 1. If current time is 10:00 PM (22:00) or later, and today hasn't been backed up -> Run today's snapshot.
 * 2. If yesterday's 10:00 PM backup was missed (app was closed), run catch-up backup immediately upon launch/resume!
 */
export const checkAndRunScheduledSnapshot = async (): Promise<boolean> => {
  try {
    const enabledRaw = await storage.getString(STORAGE_KEYS.AUTO_SNAPSHOT_ENABLED);
    const isEnabled = enabledRaw === null ? true : enabledRaw === 'true';
    if (!isEnabled) return false;

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const lastDate = await storage.getString(STORAGE_KEYS.LAST_AUTO_SNAPSHOT_DATE);

    // Already backed up today
    if (lastDate === todayStr) {
      return false;
    }

    const currentHour = now.getHours();
    const isPastNightTime = currentHour >= 22; // 10:00 PM or later
    const isMissedPreviousDay = !lastDate || lastDate < todayStr;

    // Trigger if 10 PM arrived today, or if a previous day was missed
    if (isPastNightTime || isMissedPreviousDay) {
      const result = await createVaultSnapshot('auto');
      if (result.success) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Vault Snapshot Secured',
              body: `Your daily offline ledger backup was created. (${result.fileName})`,
              sound: false,
            },
            trigger: null, // send confirmation notification immediately
          });
        } catch (notifErr) {
          // Notifications should not prevent backup completion
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
