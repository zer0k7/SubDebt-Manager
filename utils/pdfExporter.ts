import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { SpendingEntry } from '../hooks/useDailySpending';
import { formatCurrency } from './dateHelpers';
import { getCategoryColor } from '../constants/categories';

export interface PDFSubscriptionItem {
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextRenewalDate?: string;
  isActive: boolean;
}

export interface PDFDebtItem {
  personName: string;
  amount: number;
  currency: string;
  dueDate?: string;
  isPaid: boolean;
  remainingAmount: number;
}

export interface PDFCreditItem {
  personName: string;
  amount: number;
  currency: string;
  expectedReturnDate?: string;
  isReturned: boolean;
  remainingAmount: number;
}

export interface PDFExportData {
  entries: SpendingEntry[];
  timeRangeLabel: string;
  totalAmount: number;
  dailyAvg: number;
  currencyCode: string;
  categoryTotals: { category: string; total: number }[];
  highestDay: { date: string; total: number };
  pdfTheme?: 'light' | 'dark' | 'emerald';
  subscriptions?: PDFSubscriptionItem[];
  debts?: PDFDebtItem[];
  credits?: PDFCreditItem[];
  includeAllSections?: boolean;
}

export const exportSpendingToPDF = async (data: PDFExportData): Promise<string | null> => {
  const {
    entries,
    timeRangeLabel,
    totalAmount,
    dailyAvg,
    currencyCode,
    categoryTotals,
    highestDay,
    pdfTheme = 'light',
    subscriptions = [],
    debts = [],
    credits = [],
    includeAllSections = true,
  } = data;

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const reportId = `SBD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Financial aggregates
  const activeSubs = subscriptions.filter((s) => s.isActive);
  const monthlySubsTotal = activeSubs.reduce((sum, s) => {
    let monthly = s.amount;
    if (s.billingCycle === 'yearly') monthly = s.amount / 12;
    else if (s.billingCycle === 'weekly') monthly = s.amount * 4.33;
    return sum + monthly;
  }, 0);

  const openDebts = debts.filter((d) => !d.isPaid);
  const totalOpenDebts = openDebts.reduce((sum, d) => sum + (d.remainingAmount || d.amount || 0), 0);

  const openCredits = credits.filter((c) => !c.isReturned);
  const totalOpenCredits = openCredits.reduce((sum, c) => sum + (c.remainingAmount || c.amount || 0), 0);

  // Category breakdown calculation
  const maxCategoryTotal = categoryTotals.length > 0 ? categoryTotals[0].total : 1;

  const categoryRowsHTML = categoryTotals
    .map((cat) => {
      const percentage = totalAmount > 0 ? Math.round((cat.total / totalAmount) * 100) : 0;
      const barWidth = Math.max(3, Math.min(100, Math.round((cat.total / maxCategoryTotal) * 100)));
      const color = getCategoryColor(cat.category);

      return `
        <div class="category-row">
          <div class="category-info">
            <div class="category-name-wrap">
              <span class="category-dot" style="background-color: ${color};"></span>
              <span class="category-name">${cat.category}</span>
            </div>
            <div class="category-value-wrap">
              <span class="category-amount">${formatCurrency(cat.total, currencyCode)}</span>
              <span class="category-percent">${percentage}%</span>
            </div>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${barWidth}%; background: linear-gradient(90deg, ${color}cc, ${color});"></div>
          </div>
        </div>
      `;
    })
    .join('');

  // Transaction rows table generator
  const entryRowsHTML = entries
    .map((entry) => {
      const entryDate = new Date(entry.spentAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const catColor = getCategoryColor(entry.category);

      return `
        <tr>
          <td><div class="entry-date">${entryDate}</div></td>
          <td>
            <div class="entry-title">${entry.title}</div>
            ${entry.notes ? `<div class="entry-notes">${entry.notes}</div>` : ''}
          </td>
          <td>
            <span class="entry-category-badge" style="background: ${catColor}15; color: ${catColor}; border: 1px solid ${catColor}30;">
              ${entry.category}
            </span>
          </td>
          <td class="text-right font-semibold">
            ${formatCurrency(entry.amount, entry.currency || currencyCode)}
          </td>
        </tr>
      `;
    })
    .join('');

  // Subscriptions rows HTML
  const subsRowsHTML = activeSubs
    .map((sub) => {
      const renewalStr = sub.nextRenewalDate
        ? new Date(sub.nextRenewalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Active';

      return `
        <tr>
          <td><div class="entry-title">${sub.name}</div></td>
          <td><span class="cycle-badge">${sub.billingCycle.toUpperCase()}</span></td>
          <td><div class="entry-date">${renewalStr}</div></td>
          <td class="text-right font-semibold">${formatCurrency(sub.amount, sub.currency || currencyCode)}</td>
        </tr>
      `;
    })
    .join('');

  // Debts rows HTML
  const debtsRowsHTML = openDebts
    .map((debt) => {
      const dueStr = debt.dueDate
        ? new Date(debt.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'No due date';

      return `
        <tr>
          <td>
            <div class="entry-title">${debt.personName}</div>
            <div class="entry-notes">Liability to pay back</div>
          </td>
          <td><span class="status-badge-debt">PENDING DEBT</span></td>
          <td><div class="entry-date">${dueStr}</div></td>
          <td class="text-right font-semibold" style="color: var(--accent-debt);">
            ${formatCurrency(debt.remainingAmount || debt.amount, debt.currency || currencyCode)}
          </td>
        </tr>
      `;
    })
    .join('');

  // Theme-specific CSS variables
  let themeCss = '';
  if (pdfTheme === 'dark') {
    themeCss = `
      :root {
        --bg-primary: #0A0E1A;
        --bg-panel: #111827;
        --bg-stat: #182234;
        --text-primary: #F9FAFB;
        --text-secondary: #9CA3AF;
        --text-muted: #6B7280;
        --border-color: #2D3748;
        --accent-primary: #6366F1;
        --accent-primary-light: rgba(99, 102, 241, 0.15);
        --accent-debt: #F87171;
        --accent-credit: #34D399;
        --table-row-border: #1F2937;
        --table-row-alt: #131C2E;
        --table-header-bg: #1A2438;
      }
    `;
  } else if (pdfTheme === 'emerald') {
    themeCss = `
      :root {
        --bg-primary: #022C22;
        --bg-panel: #064E3B;
        --bg-stat: #042F2E;
        --text-primary: #F0FDF4;
        --text-secondary: #A7F3D0;
        --text-muted: #6EE7B7;
        --border-color: #065F46;
        --accent-primary: #10B981;
        --accent-primary-light: rgba(16, 185, 129, 0.15);
        --accent-debt: #F87171;
        --accent-credit: #34D399;
        --table-row-border: #065F46;
        --table-row-alt: #04382A;
        --table-header-bg: #03392B;
      }
    `;
  } else {
    // Light
    themeCss = `
      :root {
        --bg-primary: #F8FAFC;
        --bg-panel: #FFFFFF;
        --bg-stat: #F1F5F9;
        --text-primary: #0F172A;
        --text-secondary: #475569;
        --text-muted: #64748B;
        --border-color: #E2E8F0;
        --accent-primary: #7C3AED;
        --accent-primary-light: rgba(124, 58, 237, 0.08);
        --accent-debt: #DC2626;
        --accent-credit: #059669;
        --table-row-border: #E2E8F0;
        --table-row-alt: #F8FAFC;
        --table-header-bg: #F1F5F9;
      }
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SubDebt Financial Statement - ${timeRangeLabel}</title>
      <style>
        ${themeCss}

        @page {
          margin: 14mm 12mm 16mm 12mm;
          size: A4 portrait;
          @bottom-right {
            content: "Page " counter(page);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 8pt;
            font-weight: 600;
            color: #64748B;
          }
          @bottom-left {
            content: "SubDebt Ledger • 100% Offline Verified";
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 8pt;
            font-weight: 500;
            color: #64748B;
          }
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-size: 11pt;
          line-height: 1.45;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background-color: var(--bg-panel);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          margin-bottom: 16px;
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .app-logo {
          width: 44px;
          height: 44px;
        }

        .brand-text h1 {
          font-size: 18pt;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.4px;
          line-height: 1.1;
        }

        .brand-text p {
          font-size: 9pt;
          color: var(--text-secondary);
          font-weight: 600;
          margin-top: 2px;
        }

        .report-meta {
          text-align: right;
        }

        .meta-badge {
          display: inline-block;
          background: var(--accent-primary-light);
          color: var(--accent-primary);
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 8.5pt;
          font-weight: 800;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          border: 1px solid var(--accent-primary);
        }

        .meta-time {
          font-size: 8.5pt;
          color: var(--text-muted);
          font-weight: 500;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .stat-card {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px 14px;
          break-inside: avoid;
        }

        .stat-title {
          font-size: 8pt;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 14pt;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .stat-sub {
          font-size: 8pt;
          color: var(--text-secondary);
          margin-top: 3px;
          font-weight: 500;
        }

        .section-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .panel {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 14px 16px;
          break-inside: avoid;
        }

        .panel-title {
          font-size: 11pt;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 6px;
        }

        .category-row {
          margin-bottom: 10px;
        }

        .category-row:last-child {
          margin-bottom: 0;
        }

        .category-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3px;
          font-size: 9.5pt;
        }

        .category-name-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .category-dot {
          width: 8px;
          height: 8px;
          border-radius: 4px;
        }

        .category-name {
          font-weight: 700;
          color: var(--text-primary);
        }

        .category-value-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .category-amount {
          font-weight: 700;
          color: var(--text-primary);
        }

        .category-percent {
          color: var(--text-muted);
          font-size: 8pt;
          font-weight: 600;
          min-width: 26px;
          text-align: right;
        }

        .progress-bar-bg {
          height: 6px;
          background-color: var(--bg-stat);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 3px;
        }

        .insight-box {
          background-color: var(--bg-stat);
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 8px;
          border: 1px solid var(--border-color);
        }

        .insight-box:last-child {
          margin-bottom: 0;
        }

        .insight-title {
          font-size: 8.5pt;
          font-weight: 800;
          color: var(--accent-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .insight-body {
          font-size: 9pt;
          color: var(--text-secondary);
          line-height: 1.35;
        }

        .table-panel {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 16px;
          break-inside: avoid;
        }

        .ledger-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9pt;
        }

        .ledger-table th {
          background-color: var(--table-header-bg);
          color: var(--text-muted);
          font-weight: 700;
          font-size: 8pt;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 8px 10px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        .ledger-table td {
          padding: 8px 10px;
          border-bottom: 1px solid var(--table-row-border);
          vertical-align: middle;
        }

        .ledger-table tbody tr:nth-child(even) {
          background-color: var(--table-row-alt);
        }

        .ledger-table tbody tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .entry-date {
          font-weight: 600;
          color: var(--text-muted);
          font-size: 8.5pt;
        }

        .entry-title {
          font-weight: 700;
          color: var(--text-primary);
        }

        .entry-notes {
          font-size: 7.5pt;
          color: var(--text-muted);
          margin-top: 1px;
          font-style: italic;
        }

        .entry-category-badge {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 7.5pt;
          font-weight: 700;
        }

        .cycle-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(99, 102, 241, 0.15);
          color: var(--accent-primary);
          font-size: 7.5pt;
          font-weight: 800;
        }

        .status-badge-debt {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(239, 68, 68, 0.15);
          color: var(--accent-debt);
          font-size: 7.5pt;
          font-weight: 800;
        }

        .text-right {
          text-align: right;
        }

        .font-semibold {
          font-weight: 700;
        }

        .footer-watermark {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: var(--bg-panel);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          font-size: 8pt;
          color: var(--text-muted);
          margin-top: 8px;
          break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <!-- Header with Official Logo & Document Info -->
      <div class="header">
        <div class="brand-section">
          <svg class="app-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="22" fill="#7C3AED" />
            <path d="M25 35C25 29.4772 29.4772 25 35 25H65C70.5228 25 75 29.4772 75 35V65C75 70.5228 70.5228 75 65 75H35C29.4772 75 25 70.5228 25 65V35Z" fill="#1E1B4B" />
            <path d="M32 44C32 39.5817 35.5817 36 40 36H68C72.4183 36 76 39.5817 76 44V64C76 68.4183 72.4183 72 68 72H40C35.5817 72 32 68.4183 32 64V44Z" fill="url(#paint0_linear)" />
            <circle cx="62" cy="54" r="5" fill="#FFFFFF" />
            <defs>
              <linearGradient id="paint0_linear" x1="32" y1="36" x2="76" y2="72" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4FC3F7" />
                <stop offset="1" stop-color="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
          <div class="brand-text">
            <h1>SubDebt Manager</h1>
            <p>Financial Statement & Audit Ledger</p>
          </div>
        </div>

        <div class="report-meta">
          <div class="meta-badge">${timeRangeLabel.toUpperCase()}</div>
          <div class="meta-time">ID: ${reportId}</div>
          <div class="meta-time">${formattedDate}</div>
        </div>
      </div>

      <!-- Key Metric Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">Total Spending</div>
          <div class="stat-value">${formatCurrency(totalAmount, currencyCode)}</div>
          <div class="stat-sub">${entries.length} expenses logged</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Daily Average</div>
          <div class="stat-value">${formatCurrency(dailyAvg, currencyCode)}</div>
          <div class="stat-sub">Across active days</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Subs Run-Rate</div>
          <div class="stat-value">${formatCurrency(monthlySubsTotal, currencyCode)}</div>
          <div class="stat-sub">${activeSubs.length} active plans/mo</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Open Debts</div>
          <div class="stat-value" style="color: var(--accent-debt);">${formatCurrency(totalOpenDebts, currencyCode)}</div>
          <div class="stat-sub">${openDebts.length} pending to pay</div>
        </div>
      </div>

      <!-- Visual Breakdown & Insights -->
      <div class="section-grid">
        <div class="panel">
          <div class="panel-title">Spending by Category</div>
          ${categoryTotals.length > 0 ? categoryRowsHTML : '<p style="color: var(--text-muted); text-align: center; padding: 20px 0;">No spending records in this range.</p>'}
        </div>

        <div class="panel">
          <div class="panel-title">Ledger Audit & Insights</div>
          <div class="insight-box">
            <div class="insight-title">Principal Expense Category</div>
            <div class="insight-body">
              ${
                categoryTotals.length > 0
                  ? `Your primary spending category is <strong>${categoryTotals[0].category}</strong> (${formatCurrency(categoryTotals[0].total, currencyCode)}), making up <strong>${Math.round((categoryTotals[0].total / (totalAmount || 1)) * 100)}%</strong> of your total outflow.`
                  : 'Insufficient transaction data.'
              }
            </div>
          </div>
          <div class="insight-box">
            <div class="insight-title">Peak Outflow Day</div>
            <div class="insight-body">
              ${
                highestDay && highestDay.total > 0
                  ? `Highest single-day expenditure was <strong>${formatCurrency(highestDay.total, currencyCode)}</strong> on ${new Date(highestDay.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.`
                  : 'No peak single-day expense recorded.'
              }
            </div>
          </div>
          <div class="insight-box">
            <div class="insight-title">Privacy Verification</div>
            <div class="insight-body">
              This statement was generated 100% offline on-device with zero cloud telemetry.
            </div>
          </div>
        </div>
      </div>

      <!-- Active Subscriptions Overview (if enabled and present) -->
      ${
        includeAllSections && activeSubs.length > 0
          ? `
        <div class="table-panel">
          <div class="panel-title">Active Recurring Subscriptions (${activeSubs.length})</div>
          <table class="ledger-table">
            <thead>
              <tr>
                <th style="width: 40%;">Subscription</th>
                <th style="width: 20%;">Billing Cycle</th>
                <th style="width: 20%;">Next Renewal</th>
                <th style="width: 20%; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${subsRowsHTML}
            </tbody>
          </table>
        </div>
      `
          : ''
      }

      <!-- Open Debts Overview (if enabled and present) -->
      ${
        includeAllSections && openDebts.length > 0
          ? `
        <div class="table-panel">
          <div class="panel-title">Open Debts & Liabilities (${openDebts.length})</div>
          <table class="ledger-table">
            <thead>
              <tr>
                <th style="width: 40%;">Counterparty</th>
                <th style="width: 20%;">Status</th>
                <th style="width: 20%;">Due Date</th>
                <th style="width: 20%; text-align: right;">Balance Due</th>
              </tr>
            </thead>
            <tbody>
              ${debtsRowsHTML}
            </tbody>
          </table>
        </div>
      `
          : ''
      }

      <!-- Detailed Transaction Ledger -->
      <div class="table-panel">
        <div class="panel-title">Daily Expense Transactions (${entries.length})</div>
        <table class="ledger-table">
          <thead>
            <tr>
              <th style="width: 18%;">Date</th>
              <th style="width: 47%;">Description</th>
              <th style="width: 18%;">Category</th>
              <th style="width: 17%; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${entries.length > 0 ? entryRowsHTML : '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">No entries available.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Verification Footer -->
      <div class="footer-watermark">
        <div>SubDebt Manager • Encrypted On-Device Statement</div>
        <div>Report ID: ${reportId} • ${formattedDate}</div>
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const safeRangeLabel = timeRangeLabel.replace(/[^a-zA-Z0-9]/g, '_').replace(/__+/g, '_');
    const customFileName = `SubDebt_Statement_${safeRangeLabel}_${dateStr}_${timeStr}.pdf`;
    const customFilePath = `${FileSystem.cacheDirectory}${customFileName}`;

    await FileSystem.copyAsync({
      from: uri,
      to: customFilePath,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(customFilePath, {
        mimeType: 'application/pdf',
        dialogTitle: `SubDebt Financial Statement - ${timeRangeLabel}`,
        UTI: 'com.adobe.pdf',
      });
    }

    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (cleanupError) {
      console.warn('Temporary file cleanup failed:', cleanupError);
    }

    return customFilePath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
};
