import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share, Platform } from 'react-native';
import { SpendingEntry } from '../hooks/useDailySpending';
import { BankAccount, AccountTransaction } from '../hooks/useAccounts';

const escapeCsvField = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

export const exportDailySpendingToCSV = async (
  entries: SpendingEntry[],
  defaultCurrency: string = 'INR'
): Promise<boolean> => {
  try {
    if (!entries || entries.length === 0) return false;

    const headers = [
      'Date',
      'Title',
      'Category',
      'Amount',
      'Currency',
      'Payment Source',
      'Notes',
    ].join(',');

    const rows = entries.map((e) => {
      const dateStr = e.spentAt ? e.spentAt.split('T')[0] : '';
      const paymentSource = e.paidFromAccountName || 'Cash / Unlinked';
      return [
        escapeCsvField(dateStr),
        escapeCsvField(e.title),
        escapeCsvField(e.category),
        escapeCsvField(e.amount),
        escapeCsvField(e.currency || defaultCurrency),
        escapeCsvField(paymentSource),
        escapeCsvField(e.notes || ''),
      ].join(',');
    });

    const csvContent = `${headers}\n${rows.join('\n')}`;
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `Daily_Spending_Report_${timestamp}.csv`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Daily Spending (CSV / Excel)',
        UTI: 'public.comma-separated-values-text',
      });
      return true;
    }

    await Share.share({
      message: csvContent,
      title: fileName,
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const exportAccountPassbookToCSV = async (
  account: BankAccount,
  transactions: AccountTransaction[],
  allAccounts: BankAccount[] = []
): Promise<boolean> => {
  try {
    if (!account || !transactions || transactions.length === 0) return false;

    const headers = [
      'Date',
      'Account Name',
      'Transaction Type',
      'Category',
      'Amount',
      'Currency',
      'Balance After',
      'Description / Counterparty',
      'Notes',
    ].join(',');

    const rows = transactions.map((t) => {
      const dateStr = t.date ? t.date.split('T')[0] : '';
      const isDeposit = t.type === 'deposit';
      const isTransferIn = t.type === 'transfer' && t.toAccountId === account.id;

      let counterparty = '';
      if (t.type === 'transfer') {
        if (isTransferIn) {
          const fromAcc = allAccounts.find((a) => a.id === t.accountId);
          counterparty = `Transfer from ${fromAcc?.name || 'Account'}`;
        } else {
          const toAcc = allAccounts.find((a) => a.id === t.toAccountId);
          counterparty = `Transfer to ${toAcc?.name || 'Account'}`;
        }
      }

      const runningBalance = isTransferIn
        ? (t.toAccountBalanceAfter ?? t.balanceAfter)
        : t.balanceAfter;

      const typeLabel = isDeposit ? 'Credit (Deposit)' : isTransferIn ? 'Transfer In' : t.type === 'transfer' ? 'Transfer Out' : 'Debit (Withdrawal)';
      const signedAmount = (isDeposit || isTransferIn ? '+' : '-') + t.amount.toString();

      return [
        escapeCsvField(dateStr),
        escapeCsvField(account.name),
        escapeCsvField(typeLabel),
        escapeCsvField(t.category),
        escapeCsvField(signedAmount),
        escapeCsvField(account.currency),
        escapeCsvField(runningBalance),
        escapeCsvField(counterparty),
        escapeCsvField(t.reasonNotes || ''),
      ].join(',');
    });

    const csvContent = `${headers}\n${rows.join('\n')}`;
    const cleanAccountName = account.name.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${cleanAccountName}_Passbook_${timestamp}.csv`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: `Export ${account.name} Passbook (CSV / Excel)`,
        UTI: 'public.comma-separated-values-text',
      });
      return true;
    }

    await Share.share({
      message: csvContent,
      title: fileName,
    });
    return true;
  } catch (error) {
    return false;
  }
};
