import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { BankAccount, AccountTransaction } from '../hooks/useAccounts';
import { formatCurrency } from './dateHelpers';

export interface AccountStatementExportData {
  account: BankAccount;
  transactions: AccountTransaction[];
  pdfTheme?: 'light' | 'dark';
  startDate?: string;
  endDate?: string;
}

export const exportAccountStatementToPDF = async (
  data: AccountStatementExportData
): Promise<string | null> => {
  const { account, transactions, pdfTheme = 'dark', startDate, endDate } = data;

  const now = new Date();
  const generatedAt = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const periodLabel =
    startDate && endDate
      ? `${startDate} to ${endDate}`
      : `Complete Statement (${transactions.length} entries)`;

  const totalDeposits = transactions
    .filter((t) => t.type === 'deposit' || (t.type === 'transfer' && t.toAccountId === account.id))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === 'withdrawal' || (t.type === 'transfer' && t.accountId === account.id))
    .reduce((sum, t) => sum + t.amount, 0);

  const isDarkTheme = pdfTheme === 'dark';

  const rowsHtml = transactions
    .map((t) => {
      const isCredit = t.type === 'deposit';
      const isDebit = t.type === 'withdrawal' || (t.type === 'transfer' && t.accountId === account.id);
      const isTransferIn = t.type === 'transfer' && t.toAccountId === account.id;

      const dateStr = new Date(t.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const typeLabel = isCredit
        ? 'CREDIT'
        : isTransferIn
        ? 'TRANSFER IN'
        : t.type === 'transfer'
        ? 'TRANSFER OUT'
        : 'DEBIT';

      const typeClass = isCredit || isTransferIn ? 'badge-credit' : 'badge-debit';

      const rowBalance = isTransferIn
        ? (t.toAccountBalanceAfter ?? t.balanceAfter)
        : t.balanceAfter;

      return `
        <tr>
          <td><div class="date-text">${dateStr}</div></td>
          <td>
            <div class="category-name">${t.category}</div>
            ${t.reasonNotes ? `<div class="reason-notes">${t.reasonNotes}</div>` : ''}
          </td>
          <td><span class="${typeClass}">${typeLabel}</span></td>
          <td class="num-col debit-text">${isDebit ? formatCurrency(t.amount, account.currency) : '-'}</td>
          <td class="num-col credit-text">${isCredit || isTransferIn ? formatCurrency(t.amount, account.currency) : '-'}</td>
          <td class="num-col balance-text">${formatCurrency(rowBalance, account.currency)}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Account Passbook Statement</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 18mm 14mm 18mm 14mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: ${isDarkTheme ? '#000000' : '#FFFFFF'};
            color: ${isDarkTheme ? '#FFFFFF' : '#0F172A'};
            margin: 0;
            padding: 24px;
            font-size: 11px;
            line-height: 1.4;
          }
          .header-box {
            border-bottom: 2px solid ${isDarkTheme ? '#27272A' : '#E2E8F0'};
            padding-bottom: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .title-area h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .title-area p {
            margin: 4px 0 0 0;
            color: ${isDarkTheme ? '#94A3B8' : '#64748B'};
            font-size: 11px;
            font-weight: 500;
          }
          .meta-info {
            text-align: right;
            font-size: 10px;
            color: ${isDarkTheme ? '#94A3B8' : '#64748B'};
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .stat-card {
            background-color: ${isDarkTheme ? '#0D0D12' : '#F8FAFC'};
            border: 1px solid ${isDarkTheme ? '#27272A' : '#E2E8F0'};
            border-radius: 10px;
            padding: 12px;
          }
          .stat-label {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: ${isDarkTheme ? '#94A3B8' : '#64748B'};
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .stat-val {
            font-size: 15px;
            font-weight: 800;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
          }
          th {
            background-color: ${isDarkTheme ? '#14141B' : '#F1F5F9'};
            color: ${isDarkTheme ? '#94A3B8' : '#475569'};
            text-align: left;
            padding: 9px 10px;
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
            border-bottom: 1.5px solid ${isDarkTheme ? '#27272A' : '#CBD5E1'};
          }
          td {
            padding: 9px 10px;
            border-bottom: 1px solid ${isDarkTheme ? '#1E1E24' : '#F1F5F9'};
            vertical-align: top;
          }
          .date-text {
            font-weight: 600;
            color: ${isDarkTheme ? '#CBD5E1' : '#334155'};
          }
          .category-name {
            font-weight: 700;
            color: ${isDarkTheme ? '#FFFFFF' : '#0F172A'};
          }
          .reason-notes {
            font-size: 9.5px;
            color: ${isDarkTheme ? '#94A3B8' : '#64748B'};
            margin-top: 2px;
          }
          .num-col {
            text-align: right;
            font-variant-numeric: tabular-nums;
          }
          .debit-text {
            color: #F87171;
            font-weight: 700;
          }
          .credit-text {
            color: #34D399;
            font-weight: 700;
          }
          .balance-text {
            font-weight: 800;
            color: ${isDarkTheme ? '#FFFFFF' : '#0F172A'};
          }
          .badge-credit {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8.5px;
            font-weight: 800;
            background-color: rgba(52, 211, 153, 0.15);
            color: #34D399;
          }
          .badge-debit {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8.5px;
            font-weight: 800;
            background-color: rgba(248, 113, 113, 0.15);
            color: #F87171;
          }
          .footer-note {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: ${isDarkTheme ? '#64748B' : '#94A3B8'};
            border-top: 1px solid ${isDarkTheme ? '#1E1E24' : '#E2E8F0'};
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="title-area">
            <h1>ACCOUNT PASSBOOK STATEMENT</h1>
            <p>${account.name} ${account.accountNumberMasked ? `· ${account.accountNumberMasked}` : ''} · ${account.accountType.toUpperCase()}</p>
          </div>
          <div class="meta-info">
            <div><strong>Generated:</strong> ${generatedAt}</div>
            <div><strong>Scope:</strong> ${periodLabel}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Opening Balance</div>
            <div class="stat-val">${formatCurrency(account.initialBalance, account.currency)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Deposits In</div>
            <div class="stat-val credit-text">+${formatCurrency(totalDeposits, account.currency)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Withdrawals</div>
            <div class="stat-val debit-text">-${formatCurrency(totalWithdrawals, account.currency)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Current Net Balance</div>
            <div class="stat-val balance-text">${formatCurrency(account.currentBalance, account.currency)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 16%;">Date</th>
              <th style="width: 32%;">Description / Reason</th>
              <th style="width: 14%;">Type</th>
              <th style="width: 12%; text-align: right;">Withdrawal</th>
              <th style="width: 12%; text-align: right;">Deposit</th>
              <th style="width: 14%; text-align: right;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding: 24px; color: #94A3B8;">No transactions found for this account</td></tr>'}
          </tbody>
        </table>

        <div class="footer-note">
          Official Ledger Statement · SubDebt Manager Vault · Retain for financial verification records
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const safeName = account.name.replace(/[^a-zA-Z0-9]/g, '_');
    const customFileName = `Statement_${safeName}_${now.getTime()}.pdf`;
    const targetPath = `${FileSystem.cacheDirectory}${customFileName}`;

    await FileSystem.copyAsync({
      from: uri,
      to: targetPath,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(targetPath, {
        mimeType: 'application/pdf',
        dialogTitle: `${account.name} Passbook Statement`,
        UTI: 'com.adobe.pdf',
      });
    }

    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {}

    return targetPath;
  } catch (err) {
    console.error('Error generating account statement PDF:', err);
    return null;
  }
};
