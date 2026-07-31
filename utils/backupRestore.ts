import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { exportAllData } from './exportData';
import { pickAndImportData, ImportResult } from './importData';

/**
 * Initiates sharing of the entire local MMKV ledger database as a structured JSON file.
 */
export const exportDatabaseBackup = async (): Promise<boolean> => {
  return await exportAllData();
};

/**
 * Launches the native document picker to select a backup JSON file,
 * then validates and restores it to local storage.
 */
export const importDatabaseBackup = async (mode: 'merge' | 'replace' = 'merge'): Promise<ImportResult> => {
  return await pickAndImportData(mode);
};

/**
 * Exports daily spending entries into a highly formatted, Excel-compatible CSV file.
 * Automatically escapes commas, newlines, and double-quotes to ensure perfect spreadsheet layout.
 */
export const exportSpendingCSV = async (entries: any[], currencyCode: string): Promise<boolean> => {
  try {
    const headers = ['Date', 'Title', 'Category', 'Notes', 'Amount', 'Currency'];
    const rows = entries.map((e) => {
      const entryDate = new Date(e.spentAt).toISOString().split('T')[0];
      
      // Escape strings containing double quotes by doubling them and wrapping the string in quotes
      const cleanTitle = `"${e.title.replace(/"/g, '""')}"`;
      const cleanCategory = `"${e.category.replace(/"/g, '""')}"`;
      const cleanNotes = e.notes ? `"${e.notes.replace(/"/g, '""')}"` : '""';
      const amount = e.amount;
      const currency = e.currency || currencyCode;
      
      return [entryDate, cleanTitle, cleanCategory, cleanNotes, amount, currency].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const fileName = `SubDebt_Spending_${dateStr}_${timeStr}.csv`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Spending spreadsheet (CSV)',
        UTI: 'public.comma-separated-values-text',
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('CSV Export failed:', error);
    return false;
  }
};
