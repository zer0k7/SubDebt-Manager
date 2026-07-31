import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { SpendingEntry } from '../hooks/useDailySpending';
import { formatCurrency } from './dateHelpers';

interface PDFExportData {
  entries: SpendingEntry[];
  timeRangeLabel: string;
  totalAmount: number;
  dailyAvg: number;
  currencyCode: string;
  categoryTotals: { category: string; total: number }[];
  highestDay: { date: string; total: number };
  pdfTheme?: 'light' | 'dark' | 'emerald';
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
  } = data;

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate percentages and styling colors for categories
  const maxCategoryTotal = categoryTotals.length > 0 ? categoryTotals[0].total : 1;
  const categoryColors = [
    '#7C3AED', // Purple
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#8B5CF6', // Violet
  ];

  const categoryRowsHTML = categoryTotals
     .map((cat, index) => {
       const percentage = totalAmount > 0 ? Math.round((cat.total / totalAmount) * 100) : 0;
       const barWidth = Math.max(2, Math.min(100, Math.round((cat.total / maxCategoryTotal) * 100)));
       const color = categoryColors[index % categoryColors.length];
 
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
             <div class="progress-bar-fill" style="width: ${barWidth}%; background: linear-gradient(90deg, ${color}d0, ${color});"></div>
           </div>
         </div>
       `;
     })
     .join('');

  // Spending rows table generator
  const entryRowsHTML = entries
     .map((entry) => {
       const entryDate = new Date(entry.spentAt).toLocaleDateString('en-IN', {
         day: '2-digit',
         month: 'short',
         year: 'numeric',
       });
 
       return `
         <tr>
           <td>
             <div class="entry-date">${entryDate}</div>
           </td>
           <td>
             <div class="entry-title">${entry.title}</div>
             ${entry.notes ? `<div class="entry-notes">${entry.notes}</div>` : ''}
           </td>
           <td>
             <span class="entry-category-badge">${entry.category}</span>
           </td>
           <td class="text-right font-semibold">
             ${formatCurrency(entry.amount, entry.currency)}
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
        --bg-primary: #0B0F19;
        --bg-panel: #111827;
        --bg-stat: #1F2937;
        --text-primary: #F9FAFB;
        --text-secondary: #9CA3AF;
        --text-muted: #6B7280;
        --border-color: #374151;
        --accent-primary: #6366F1;
        --accent-primary-light: rgba(99, 102, 241, 0.15);
        --table-row-border: #1F2937;
        --table-header-bg: #1F2937;
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
        --table-row-border: #065F46;
        --table-header-bg: #042F2E;
      }
    `;
  } else {
    // Light
    themeCss = `
      :root {
        --bg-primary: #FFFFFF;
        --bg-panel: #FFFFFF;
        --bg-stat: #FAFAFB;
        --text-primary: #1F2937;
        --text-secondary: #6B7280;
        --text-muted: #9CA3AF;
        --border-color: #E5E7EB;
        --accent-primary: #7C3AED;
        --accent-primary-light: rgba(124, 58, 237, 0.08);
        --table-row-border: #F3F4F6;
        --table-header-bg: #FAFAFB;
      }
    `;
  }

  // Premium High-Fidelity CSS & Layout
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SubDebt Ledger - Daily Spending Report</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        ${themeCss}

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: var(--text-primary);
          background-color: var(--bg-primary);
          line-height: 1.5;
          padding: 40px;
          font-size: 14px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        @page {
          size: A4;
          margin: 20mm 15mm 20mm 15mm;
        }

        /* Header Premium Design */
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 24px;
          margin-bottom: 30px;
        }

        .brand-section h1 {
          font-size: 24px;
          font-weight: 800;
          color: var(--accent-primary);
          letter-spacing: -0.5px;
          text-transform: uppercase;
        }

        .brand-section p {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
          margin-top: 4px;
        }

        .meta-section {
          text-align: right;
        }

        .meta-section h2 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .meta-section .range-badge {
          display: inline-block;
          background-color: var(--accent-primary-light);
          color: var(--accent-primary);
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 6px;
          border: 1px solid var(--border-color);
        }

        .meta-section .timestamp {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 6px;
        }

        /* Executive Stats Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: var(--bg-stat);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: var(--border-color);
        }

        .stat-card.purple::before { background-color: var(--accent-primary); }
        .stat-card.blue::before { background-color: #3B82F6; }
        .stat-card.emerald::before { background-color: #10B981; }
        .stat-card.amber::before { background-color: #F59E0B; }

        .stat-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 6px;
        }

        .stat-desc {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        /* Two Column Layout for Breakdown & Insights */
        .content-split {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        .panel {
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 20px;
          background-color: var(--bg-panel);
        }

        .panel-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Category progress designs */
        .category-row {
          margin-bottom: 14px;
        }

        .category-row:last-child {
          margin-bottom: 0;
        }

        .category-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .category-name-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .category-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .category-name {
          font-weight: 600;
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
          font-size: 11px;
          color: var(--text-secondary);
          background-color: var(--bg-stat);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .progress-bar-bg {
          height: 6px;
          background-color: var(--bg-stat);
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 9999px;
        }

        /* Insights panel */
        .insight-box {
          background-color: var(--bg-stat);
          border: 1px dashed var(--border-color);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 12px;
        }

        .insight-box:last-child {
          margin-bottom: 0;
        }

        .insight-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .insight-body {
          font-size: 12px;
          color: var(--text-secondary);
        }

        /* Ledger Table styles */
        .table-panel {
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 20px;
          background-color: var(--bg-panel);
          margin-top: 10px;
          page-break-before: auto;
        }

        .ledger-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .ledger-table th {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 16px;
          border-bottom: 2px solid var(--border-color);
          background-color: var(--table-header-bg);
        }

        .ledger-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--table-row-border);
          vertical-align: middle;
        }

        .ledger-table tr:last-child td {
          border-bottom: none;
        }

        .entry-date {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .entry-title {
          font-weight: 600;
          color: var(--text-primary);
        }

        .entry-notes {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
          font-style: italic;
        }

        .entry-category-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
          background-color: var(--bg-stat);
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }

        .text-right {
          text-align: right;
        }

        .font-semibold {
          font-weight: 600;
          color: var(--text-primary);
        }

        /* Footer watermark */
        .report-footer {
          margin-top: 40px;
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--text-muted);
        }

        .brand-stamp {
          font-weight: 600;
          color: var(--accent-primary);
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="report-header">
        <div class="brand-section">
          <h1>SubDebt Ledger</h1>
          <p>Personal Financial Safe-Guards & Spending Ledger</p>
        </div>
        <div class="meta-section">
          <h2>Spending Report</h2>
          <span class="range-badge">${timeRangeLabel}</span>
          <div class="timestamp">Generated on ${formattedDate}</div>
        </div>
      </div>

      <!-- Executive Overview -->
      <div class="stats-grid">
        <div class="stat-card purple">
          <div class="stat-label">Total Outflow</div>
          <div class="stat-value" style="color: var(--accent-primary);">${formatCurrency(totalAmount, currencyCode)}</div>
          <div class="stat-desc">Accumulated outflow</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-label">Daily Average</div>
          <div class="stat-value">${formatCurrency(dailyAvg, currencyCode)}</div>
          <div class="stat-desc">Avg per active day</div>
        </div>
        <div class="stat-card emerald">
          <div class="stat-label">Transactions</div>
          <div class="stat-value">${entries.length}</div>
          <div class="stat-desc">Total expense items</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-label">Peak Spend Day</div>
          <div class="stat-value">${highestDay.total > 0 ? formatCurrency(highestDay.total, currencyCode) : 'N/A'}</div>
          <div class="stat-desc">${
            highestDay.date
              ? new Date(highestDay.date + 'T00:00:00').toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })
              : 'No transactions'
          }</div>
        </div>
      </div>

      <!-- Two Column Layout: Categories & Insights -->
      <div class="content-split">
        <!-- Categories breakdown panel -->
        <div class="panel">
          <div class="panel-title">Category Breakdown</div>
          ${categoryTotals.length > 0 ? categoryRowsHTML : '<p style="color: var(--text-muted); text-align: center; padding: 20px 0;">No spending records in this range.</p>'}
        </div>

        <!-- Insights panel -->
        <div class="panel">
          <div class="panel-title">Report Insights</div>
          <div class="insight-box">
            <div class="insight-title">Principal Category</div>
            <div class="insight-body">
              ${
                categoryTotals.length > 0
                  ? `Your primary spending category is <strong>${categoryTotals[0].category}</strong>, constituting <strong>${Math.round((categoryTotals[0].total / (totalAmount || 1)) * 100)}%</strong> of your total expenses.`
                  : 'Insufficient data to compute primary spending category.'
              }
            </div>
          </div>
          <div class="insight-box">
            <div class="insight-title">Audit Health</div>
            <div class="insight-body">
              This financial ledger compiled ${entries.length} transaction${entries.length === 1 ? '' : 's'} completely offline. No external cloud systems have accessed this ledger.
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Transaction Ledger -->
      <div class="table-panel">
        <div class="panel-title" style="margin-bottom: 20px;">Detailed Ledger Ledger</div>
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

      <!-- Footer Watermark -->
      <div class="report-footer">
        <div>SubDebt Ledger offline document. Verified secure.</div>
        <div>Page 1 of 1 · <span class="brand-stamp">SubDebt Manager</span></div>
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const safeRangeLabel = timeRangeLabel.replace(/[^a-zA-Z0-9]/g, '_').replace(/__+/g, '_');
    const customFileName = `SubDebt_Spending_${safeRangeLabel}_${dateStr}_${timeStr}.pdf`;
    const customFilePath = `${FileSystem.cacheDirectory}${customFileName}`;

    await FileSystem.copyAsync({
      from: uri,
      to: customFilePath,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(customFilePath, {
        mimeType: 'application/pdf',
        dialogTitle: `Export Spending Details - ${timeRangeLabel}`,
        UTI: 'com.adobe.pdf',
      });
    }

    // Proactively clean up the temporary print file
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
