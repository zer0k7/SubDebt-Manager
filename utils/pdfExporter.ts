import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { SpendingEntry } from '../hooks/useDailySpending';
import { formatCurrency } from './dateHelpers';
import { getCategoryColor } from '../constants/categories';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { pickPublicBackupFolder } from './vaultSnapshots';

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

export interface PDFExportResult {
  success: boolean;
  filePath: string;
  fileName: string;
}

const OFFICIAL_APP_ICON_SVG = `
<svg class="app-logo" viewBox="0 0 512 512" width="46" height="46" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#044E43"/>
      <stop offset="50%" stop-color="#023028"/>
      <stop offset="100%" stop-color="#011814"/>
    </linearGradient>
    <radialGradient id="centerGlow" cx="50%" cy="46%" r="48%">
      <stop offset="0%" stop-color="#2DD4BF" stop-opacity="0.32"/>
      <stop offset="65%" stop-color="#14B8A6" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#023028" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="55%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#EF4444"/>
    </linearGradient>
    <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF3C7"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="receiptGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>
    <linearGradient id="walletGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="65%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>
    <linearGradient id="walletRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.15"/>
    </linearGradient>
    <linearGradient id="strapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D9488"/>
      <stop offset="50%" stop-color="#0F766E"/>
      <stop offset="100%" stop-color="#115E59"/>
    </linearGradient>
    <radialGradient id="buttonGrad" cx="38%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="55%" stop-color="#E2E8F0"/>
      <stop offset="85%" stop-color="#94A3B8"/>
      <stop offset="100%" stop-color="#64748B"/>
    </radialGradient>
    <linearGradient id="dollarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F766E"/>
      <stop offset="100%" stop-color="#042F2E"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect width="512" height="512" rx="112" fill="url(#centerGlow)"/>
  <g transform="translate(138, 134) rotate(-14)">
    <rect width="144" height="94" rx="14" fill="url(#cardGrad)"/>
    <rect x="2" y="2" width="140" height="90" rx="12" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1.5"/>
    <rect x="16" y="24" width="28" height="20" rx="4" fill="url(#chipGrad)"/>
    <line x1="16" y1="34" x2="44" y2="34" stroke="#78350F" stroke-width="1" stroke-opacity="0.6"/>
    <line x1="30" y1="24" x2="30" y2="44" stroke="#78350F" stroke-width="1" stroke-opacity="0.6"/>
    <line x1="16" y1="62" x2="82" y2="62" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M 110,24 A 12 12 0 0 1 110,40 M 116,20 A 18 18 0 0 1 116,44" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.8"/>
  </g>
  <g transform="translate(258, 130) rotate(10)">
    <path d="M0,20 L12,8 L24,20 L36,8 L48,20 L60,8 L72,20 L84,8 L96,20 L108,8 L116,18 L116,105 L0,105 Z" fill="url(#receiptGrad)"/>
    <line x1="20" y1="38" x2="94" y2="38" stroke="#64748B" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="20" y1="54" x2="80" y2="54" stroke="#94A3B8" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="20" y1="70" x2="60" y2="70" stroke="#0D9488" stroke-width="4.5" stroke-linecap="round"/>
  </g>
  <g>
    <rect x="92" y="210" width="328" height="202" rx="38" fill="url(#walletGrad)"/>
    <rect x="94" y="212" width="324" height="198" rx="36" fill="none" stroke="url(#walletRimGrad)" stroke-width="2"/>
    <rect x="104" y="222" width="304" height="178" rx="28" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="6,5" stroke-opacity="0.6"/>
  </g>
  <g>
    <path d="M 315,268 L 388,268 A 34,34 0 0,1 422,302 L 422,320 A 34,34 0 0,1 388,354 L 315,354 Z" fill="url(#strapGrad)"/>
    <circle cx="380" cy="311" r="15" fill="#042F2E" fill-opacity="0.35"/>
    <circle cx="380" cy="311" r="12" fill="url(#buttonGrad)"/>
    <circle cx="380" cy="311" r="6" fill="#0D9488"/>
    <circle cx="378" cy="309" r="1.8" fill="#FFFFFF" fill-opacity="0.9"/>
  </g>
  <g transform="translate(220, 312)">
    <line x1="0" y1="-48" x2="0" y2="48" stroke="url(#dollarGrad)" stroke-width="14" stroke-linecap="round"/>
    <text x="0" y="4" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="104" fill="url(#dollarGrad)" text-anchor="middle" dominant-baseline="central">$</text>
  </g>
</svg>
`;

export const exportSpendingToPDF = async (data: PDFExportData): Promise<PDFExportResult | null> => {
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

  let themeCss = '';
  if (pdfTheme === 'dark') {
    themeCss = `
      :root {
        --bg-primary: #000000;
        --bg-panel: #0D0D12;
        --bg-stat: #14141B;
        --text-primary: #FFFFFF;
        --text-secondary: #94A3B8;
        --text-muted: #64748B;
        --border-color: #27272A;
        --accent-primary: #818CF8;
        --accent-primary-light: rgba(129, 140, 248, 0.15);
        --accent-green: #34D399;
        --accent-debt: #F87171;
        --table-row-alt: #08080C;
        --table-row-border: #18181B;
      }
    `;
  } else if (pdfTheme === 'emerald') {
    themeCss = `
      :root {
        --bg-primary: #04120F;
        --bg-panel: #07201B;
        --bg-stat: #0C2E27;
        --text-primary: #ECFDF5;
        --text-secondary: #A7F3D0;
        --text-muted: #6EE7B7;
        --border-color: #065F46;
        --accent-primary: #10B981;
        --accent-primary-light: rgba(16, 185, 129, 0.15);
        --accent-green: #34D399;
        --accent-debt: #FB7185;
        --table-row-alt: #051A15;
        --table-row-border: #044E43;
      }
    `;
  } else {
    themeCss = `
      :root {
        --bg-primary: #F8FAFC;
        --bg-panel: #FFFFFF;
        --bg-stat: #F1F5F9;
        --text-primary: #0F172A;
        --text-secondary: #475569;
        --text-muted: #64748B;
        --border-color: #E2E8F0;
        --accent-primary: #0D9488;
        --accent-primary-light: rgba(13, 148, 136, 0.1);
        --accent-green: #059669;
        --accent-debt: #DC2626;
        --table-row-alt: #F8FAFC;
        --table-row-border: #EDF2F7;
      }
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>SubDebt Financial Statement</title>
      <style>
        ${themeCss}

        @page {
          size: A4 portrait;
          margin: 16mm 14mm 16mm 14mm;
          @bottom-right {
            content: "Page " counter(page) " of " counter(pages);
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
          width: 46px;
          height: 46px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
          font-size: 15pt;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .stat-sub {
          font-size: 8pt;
          color: var(--text-muted);
          margin-top: 2px;
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
        }

        .category-row {
          margin-bottom: 8px;
        }

        .category-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9pt;
          margin-bottom: 3px;
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
          display: inline-block;
        }

        .category-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .category-value-wrap {
          display: flex;
          gap: 8px;
        }

        .category-amount {
          font-weight: 700;
          color: var(--text-primary);
        }

        .category-percent {
          color: var(--text-muted);
          font-size: 8.5pt;
          width: 32px;
          text-align: right;
        }

        .progress-bar-bg {
          height: 5px;
          background: var(--bg-stat);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
        }

        .insight-box {
          background: var(--bg-stat);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 8px;
        }

        .insight-title {
          font-size: 8pt;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .insight-body {
          font-size: 9pt;
          color: var(--text-secondary);
          line-height: 1.35;
        }

        .ledger-table-panel {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 14px;
        }

        .ledger-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9pt;
        }

        .ledger-table th {
          text-align: left;
          font-size: 8pt;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 6px 10px;
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
      <div class="header">
        <div class="brand-section">
          ${OFFICIAL_APP_ICON_SVG}
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
                highestDay.date
                  ? `Highest single-day expenditure occurred on <strong>${new Date(highestDay.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong> totaling <strong>${formatCurrency(highestDay.total, currencyCode)}</strong>.`
                  : 'No single peak expenditure identified.'
              }
            </div>
          </div>
          <div class="insight-box">
            <div class="insight-title">Average Ticket Size</div>
            <div class="insight-body">
              Average spent per transaction is <strong>${formatCurrency(entries.length > 0 ? totalAmount / entries.length : 0, currencyCode)}</strong> across ${entries.length} records.
            </div>
          </div>
        </div>
      </div>

      <div class="ledger-table-panel">
        <div class="panel-title">Itemized Expense Log (${entries.length} items)</div>
        <table class="ledger-table">
          <thead>
            <tr>
              <th style="width: 15%;">Date</th>
              <th style="width: 45%;">Description</th>
              <th style="width: 20%;">Category</th>
              <th style="width: 20%;" class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${entries.length > 0 ? entryRowsHTML : '<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-muted);">No transactions found in this time range.</td></tr>'}
          </tbody>
        </table>
      </div>

      ${
        includeAllSections && activeSubs.length > 0
          ? `
        <div class="ledger-table-panel" style="page-break-before: auto;">
          <div class="panel-title">Active Recurring Subscriptions (${activeSubs.length} services)</div>
          <table class="ledger-table">
            <thead>
              <tr>
                <th style="width: 40%;">Service / Subscription</th>
                <th style="width: 20%;">Billing Cycle</th>
                <th style="width: 20%;">Next Renewal</th>
                <th style="width: 20%;" class="text-right">Amount</th>
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

      ${
        includeAllSections && openDebts.length > 0
          ? `
        <div class="ledger-table-panel">
          <div class="panel-title">Outstanding Debts / Liabilities (${openDebts.length} pending)</div>
          <table class="ledger-table">
            <thead>
              <tr>
                <th style="width: 40%;">Counterparty / Creditor</th>
                <th style="width: 20%;">Status</th>
                <th style="width: 20%;">Due Date</th>
                <th style="width: 20%;" class="text-right">Outstanding</th>
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

      <div class="footer-watermark">
        <span>Generated offline by SubDebt Manager • Zero Cloud Transmission</span>
        <span>${formattedDate}</span>
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

    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {}

    return {
      success: true,
      filePath: customFilePath,
      fileName: customFileName,
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
};

export const savePDFToPhoneFolder = async (
  filePath: string,
  fileName: string
): Promise<{ success: boolean; folderName?: string; targetUri?: string; error?: string }> => {
  try {
    if (Platform.OS === 'android') {
      let folderUri = await storage.getString(STORAGE_KEYS.CUSTOM_BACKUP_FOLDER_URI);
      let folderName = await storage.getString(STORAGE_KEYS.CUSTOM_BACKUP_FOLDER_NAME);

      if (!folderUri) {
        const pickRes = await pickPublicBackupFolder();
        if (!pickRes.granted || !pickRes.folderUri) {
          return { success: false, error: 'No folder selected.' };
        }
        folderUri = pickRes.folderUri;
        folderName = pickRes.folderName || 'Selected Storage Folder';
      }

      const base64Data = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const cleanFileName = fileName.replace('.pdf', '');
      const createdFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        folderUri,
        cleanFileName,
        'application/pdf'
      );

      await FileSystem.writeAsStringAsync(createdFileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return {
        success: true,
        folderName: folderName || 'Storage Folder',
        targetUri: createdFileUri,
      };
    } else {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/pdf',
          dialogTitle: `Save Statement: ${fileName}`,
          UTI: 'com.adobe.pdf',
        });
        return { success: true, folderName: 'Files' };
      }
      return { success: false, error: 'Sharing not available on this device.' };
    }
  } catch (err) {
    console.error('Failed to save PDF to phone folder:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Could not save file to device.',
    };
  }
};

export const sharePDFFile = async (filePath: string, fileName: string): Promise<boolean> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Statement: ${fileName}`,
        UTI: 'com.adobe.pdf',
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to share PDF:', error);
    return false;
  }
};
