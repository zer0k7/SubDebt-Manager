export interface ManualSection {
  title: string;
  subtitle?: string;
  steps?: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
  notes?: string[];
}

export interface ManualChapter {
  id: string;
  chapterNumber: number;
  title: string;
  category: string;
  icon: string;
  accentColor: string;
  summary: string;
  sections: ManualSection[];
}

export const USER_MANUAL_CHAPTERS: ManualChapter[] = [
  {
    id: 'bank-accounts',
    chapterNumber: 1,
    title: 'Multi-Bank Accounts & Passbook Ledger',
    category: 'Liquidity & Banking',
    icon: 'business-outline',
    accentColor: '#0284C7',
    summary: 'Manage liquid cash reserves across commercial banks, physical cash in hand, and digital wallets with a double-entry transaction passbook.',
    sections: [
      {
        title: 'Account Architecture and Types',
        subtitle: 'SubDebt supports four distinct liquidity account structures:',
        tableHeaders: ['Account Classification', 'Operational Role', 'Typical Examples'],
        tableRows: [
          ['Commercial Bank', 'Primary checking and current accounts with account masking', 'HDFC, SBI, J&K Bank, Kotak, ICICI'],
          ['Digital Wallet', 'Prepaid balances and mobile payments interfaces', 'Paytm Wallet, Amazon Pay, Slice'],
          ['Cash in Hand', 'Physical paper currency and coin reserves kept on person', 'Physical Wallet, Cash Box, Drawer'],
          ['Savings & Reserves', 'Emergency deposits and locked liquidity funds', 'Fixed Deposit, Sweep Accounts, Emergency Fund'],
        ],
      },
      {
        title: 'Transaction Types and Balance Mechanics',
        subtitle: 'Every transaction atomically updates account balances based on strict double-entry mathematics:',
        tableHeaders: ['Transaction Entry', 'Mathematical Impact', 'Passbook Ledger Representation'],
        tableRows: [
          ['Money In (Deposit)', 'Balance = Current Balance + Amount', 'Represented with emerald green badge and (+) sign'],
          ['Money Out (Withdrawal)', 'Balance = Current Balance - Amount', 'Represented with coral red badge and (-) sign'],
          ['Account Transfer', 'Source = Source - Amount; Target = Target + Amount', 'Atomically debits source bank and credits destination bank'],
        ],
      },
      {
        title: 'Monthly Cash Flow Ratio Analytics',
        subtitle: 'Passbook and Bank overview screens compute real-time monthly financial flow:',
        steps: [
          'Monthly Inflow: Total sum of deposits plus incoming transfers received within the active calendar month.',
          'Monthly Outflow: Total sum of withdrawals plus outgoing transfers sent within the active calendar month.',
          'Net Cash Flow: Computed as Inflow minus Outflow. Displays as positive surplus or negative deficit.',
          'Segmented Progress Visualizer: Displays volume proportion of inflow versus outflow with dual-tone progress bars.',
        ],
      },
      {
        title: 'Passbook Querying and Reversals',
        subtitle: 'Procedures for querying and managing historical transaction records:',
        steps: [
          'Live Query Search: Enter keywords in the passbook search bar to filter entries by category, payee note, counterparty name, or numeric amount.',
          'Type Filter Tabs: Switch between All History, Deposits In, Withdrawals Out, and Transfers.',
          'Transaction Modification: Tap the pencil icon on any entry to modify amount, category, date, or transfer destination. The engine automatically recalculates and restores balances.',
          'Transaction Deletion: Deleting an entry reverses its balance impact on all involved accounts immediately.',
        ],
        notes: [
          'Deleting an account will prompt for confirmation and remove all historical transactions linked to that account.',
        ],
      },
    ],
  },
  {
    id: 'daily-spending',
    chapterNumber: 2,
    title: 'Daily Spending, Payment Sources & Bill Splitting',
    category: 'Expense Tracking',
    icon: 'receipt-outline',
    accentColor: '#10B981',
    summary: 'Log day-to-day purchases, link payments directly to bank accounts, organize custom categories, attach photo receipts, and split bills with friends.',
    sections: [
      {
        title: 'Recording Expenses and Payment Source Deduction',
        subtitle: 'Step-by-step workflow for logging daily discretionary expenditures:',
        steps: [
          'Open the Add Spending modal from the bottom navigation or the radial speed-dial action menu.',
          'Enter the expenditure title (e.g. Groceries, Fuel, Coffee) and the exact numeric cost.',
          'Select the Category. The smart categorizer automatically predicts category assignment based on title keywords.',
          'Select Payment Source: Choose Cash or tap an active Bank Account chip. When a bank account is selected, the application automatically deducts the amount from your live balance and logs an outward withdrawal in your passbook.',
          'Attach Receipt: Capture a camera photograph or select an image from the native photo picker. Receipts are stored in sandboxed storage.',
          'Tap Add Expense to finalize the entry.',
        ],
      },
      {
        title: 'Bill Splitting with Automatic Credit Generation',
        subtitle: 'How SubDebt eliminates debt tracking friction when paying group bills:',
        steps: [
          'Enable the Split Bill With Friends switch inside the Add Spending form.',
          'Add participant names (e.g. Rahul, Sameer, Priya).',
          'The application calculates equal shares or allows manual adjustments per person.',
          'Your personal share is logged as your actual discretionary expense for budget calculations.',
          'For each friend added, the system automatically creates a lent Credit entry in the Owed tab under their name, referencing the expense title and timestamp.',
          'If a bank account was selected as payment source, the full total bill is deducted from the bank, while personal and owed shares are compartmentalized accurately.',
        ],
      },
      {
        title: 'Receipt Storage and Vault Privacy',
        subtitle: 'Physical receipt preservation architecture:',
        steps: [
          'Receipt images are renamed with cryptographically generated UUID strings.',
          'Files are stored inside the sandboxed document directory accessible only to SubDebt.',
          'Receipt images are completely excluded from public device galleries to prevent accidental deletion and preserve financial privacy.',
          'Tap any receipt thumbnail to inspect high-resolution details in the full-screen receipt viewer.',
        ],
      },
      {
        title: 'Custom Categories Management',
        subtitle: 'Customizing categorization taxonomy:',
        steps: [
          'Navigate to Settings > Manage Custom Categories.',
          'Tap Add Custom Category to create new tracking buckets.',
          'Select from over 30 geometric vector icons and a curated palette of theme colors.',
          'Custom categories integrate across expense filtering, budget caps, and PDF statement generation.',
        ],
      },
    ],
  },
  {
    id: 'debts-liabilities',
    chapterNumber: 3,
    title: 'Debts & Borrowed Liabilities Ledger',
    category: 'Liabilities',
    icon: 'card-outline',
    accentColor: '#EF4444',
    summary: 'Track interest-free personal debts, borrow obligations, installment repayments, due date schedules, and generate formal settlement vouchers.',
    sections: [
      {
        title: 'Recording a Borrowed Debt',
        subtitle: 'Logging liabilities owed to friends, family, or lenders:',
        steps: [
          'Navigate to the Debts tab and tap + Add Debt.',
          'Specify the creditor name, borrowed amount, and currency.',
          'Provide a clear purpose (e.g. Laptop repair, College semester fee, Rent advance).',
          'Select the expected repayment due date.',
          'Tap Save Debt to register the liability in your active ledger.',
        ],
      },
      {
        title: 'Partial Repayments and Balance Reductions',
        subtitle: 'Managing multi-stage installment repayments:',
        steps: [
          'Tap on any active debt card to open its detail view.',
          'Select Record Partial Payment.',
          'Enter the installment amount paid and the payment date.',
          'SubDebt subtracts the payment from total liabilities and displays the remaining balance.',
          'Complete audit logs of every payment timestamp and note are maintained inside the debt record.',
        ],
      },
      {
        title: 'Debt Settlement and Executive Voucher Export',
        subtitle: 'Clearing liabilities and generating proof of settlement:',
        steps: [
          'When a liability is cleared, tap Mark as Settled.',
          'Optionally log the settlement into your Daily Spending tracker under Debt & EMI.',
          'The application renders a formal Settlement Voucher containing reference identifiers, timestamps, settlement amounts, and creditor metadata.',
          'Tap Share as Image to export the high-contrast receipt for messaging or record-keeping.',
        ],
      },
    ],
  },
  {
    id: 'credits-receivables',
    chapterNumber: 4,
    title: 'Lent Credits & Asset Receivables Ledger',
    category: 'Assets & Owed',
    icon: 'people-outline',
    accentColor: '#3B82F6',
    summary: 'Record money or items lent to others, schedule expected return dates, track partial settlements, and monitor incoming cash receivables.',
    sections: [
      {
        title: 'Logging a Lent Credit',
        subtitle: 'Tracking funds owed to you by counterparties:',
        steps: [
          'Navigate to the Owed tab and tap + Add Credit.',
          'Enter the counterparty name, lent amount, and currency.',
          'Enter the loan purpose and set an expected return date.',
          'Tap Save Credit. The total pending amount is reflected in your active assets total.',
        ],
      },
      {
        title: 'Recording Returned Funds and Partial Paybacks',
        subtitle: 'Tracking inbound return installments:',
        steps: [
          'Tap on any active credit card.',
          'Select Record Partial Return.',
          'Enter the amount received from the debtor and the receipt date.',
          'The remaining receivable balance updates dynamically across ledger totals.',
          'When fully returned, mark the credit as Complete to archive the entry.',
        ],
      },
    ],
  },
  {
    id: 'subscriptions',
    chapterNumber: 5,
    title: 'Subscriptions & Guided Cancellation',
    category: 'Recurring Bills',
    icon: 'timer-outline',
    accentColor: '#7C3AED',
    summary: 'Monitor recurring service commitments, billing frequencies, trial expiration dates, burn rates, and execute step-by-step subscription cancellations.',
    sections: [
      {
        title: 'Subscription Commitment Profiles',
        subtitle: 'Supported recurrence cycles and automated projections:',
        tableHeaders: ['Billing Frequency', 'Cycle Calculation', 'Monthly Normalized Burn Rate'],
        tableRows: [
          ['Weekly', 'Renews every 7 days from reference date', 'Amount multiplied by 52 divided by 12'],
          ['Monthly', 'Renews on same day each subsequent month', 'Full face amount'],
          ['Quarterly', 'Renews every 3 months from reference date', 'Amount divided by 3'],
          ['Yearly', 'Renews on same calendar date each year', 'Amount divided by 12'],
        ],
      },
      {
        title: 'Free Trial Safeguards',
        subtitle: 'Preventing unintentional recurring billing after trial periods:',
        steps: [
          'When adding a subscription, enable the Free Trial switch if currently in an evaluation period.',
          'Specify the exact trial expiration timestamp.',
          'SubDebt schedules priority notifications 1 day prior and on the day of expiration.',
          'Free trial cards display a prominent warning badge and distinct countdown timer.',
        ],
      },
      {
        title: 'Guided 1-Tap Cancellation Assistant',
        subtitle: 'Terminating unwanted subscriptions effortlessly:',
        steps: [
          'Tap any subscription card and select Cancel Subscription.',
          'SubDebt provides service-specific cancellation guides (Google Play Subscriptions, Apple App Store, Amazon, Netflix, Spotify, and Web Portals).',
          'Tap the direct shortcut button to launch Google Play Subscriptions screen or official cancellation portal immediately.',
          'Confirm cancellation in SubDebt to stop future renewal alerts while keeping historical logs intact.',
        ],
      },
    ],
  },
  {
    id: 'budgeting-caps',
    chapterNumber: 6,
    title: 'Monthly Budget Caps & Discretionary Limits',
    category: 'Budget Control',
    icon: 'pie-chart-outline',
    accentColor: '#D97706',
    summary: 'Establish monthly overall spending ceilings and category-specific budget limits with real-time percentage consumption alerts.',
    sections: [
      {
        title: 'Global Monthly Budget Ceiling',
        subtitle: 'Setting up total expenditure caps:',
        steps: [
          'Navigate to Settings > Budget Caps & Categories.',
          'Enter your total planned discretionary allowance for the calendar month.',
          'Tap the checkmark to save. The ceiling takes effect across the entire app immediately.',
          'The home dashboard and daily spending screens render live progress bars displaying used percentage, remaining funds, and calculated daily allowance.',
        ],
      },
      {
        title: 'Automated Threshold Notifications',
        subtitle: 'Proactive budget consumption alerts:',
        tableHeaders: ['Consumption Percentage', 'Notification Channel', 'Engine Action'],
        tableRows: [
          ['70% Budget Reached', 'Spending & Budget Channel', 'Gentle advisory alert informing user that 70% of allowance has been spent'],
          ['90% Budget Reached', 'Spending & Budget Channel', 'High-priority critical alert warning of imminent cap breach'],
          ['100% Limit Exceeded', 'Spending & Budget Channel', 'Warning alert indicating that all discretionary funds are exhausted'],
        ],
      },
      {
        title: 'Category-Level Spending Limits',
        subtitle: 'Restricting specific high-spend categories:',
        steps: [
          'Under Budget Caps in Settings, expand Category Limits.',
          'Assign maximum monthly spend caps for specific categories (e.g. Food: 5000, Dining: 3000, Shopping: 4000).',
          'When logging expenses, the categorizer checks cumulative month spend against the category cap and triggers instant warning badges upon breach.',
        ],
      },
    ],
  },
  {
    id: 'vault-security-saf',
    chapterNumber: 7,
    title: 'Data Vault, Security & Scoped Storage',
    category: 'Security & Backup',
    icon: 'shield-checkmark-outline',
    accentColor: '#059669',
    summary: 'Hardware-backed biometric authentication, 100% offline persistence, Storage Access Framework directory syncing, and collision-safe database restore.',
    sections: [
      {
        title: 'Offline-First Security Architecture',
        subtitle: 'Zero data leakage guarantee:',
        steps: [
          'SubDebt Manager operates with 100% local persistence powered by high-speed MMKV storage.',
          'Zero user accounts, zero passwords, and zero remote database synchronizations.',
          'Financial records, transactions, passbooks, and images never leave the physical device.',
          'Complies fully with Android Scoped Storage policy with permissions restricted to CAMERA and INTERNET.',
        ],
      },
      {
        title: 'Biometric and PIN App Lock',
        subtitle: 'Hardware security authentication:',
        steps: [
          'Enable App Lock in Settings > Security & Privacy.',
          'Supports hardware-backed Fingerprint recognition, Face ID, and fallback 4-digit master PIN.',
          'Authentication triggers on cold launch and whenever the app resumes from the background.',
          'PIN codes are cryptographically secured in sandboxed storage.',
        ],
      },
      {
        title: 'Storage Access Framework (SAF) Vault Backups',
        subtitle: 'Automated on-device backup synchronization:',
        steps: [
          'Open Data Vault from Settings or Tools menu.',
          'Tap Link Custom Backup Folder to open Android native Storage Access Framework folder picker.',
          'Select your preferred device folder (e.g. Documents/SubDebtBackups or Google Drive local folder).',
          'SubDebt saves daily background snapshots and on-demand JSON exports directly into this folder without broad storage permissions.',
        ],
      },
      {
        title: 'Database Restoration Workflows',
        subtitle: 'Safe data migration and recovery:',
        steps: [
          'Merge Restore: Imports records from backup and merges them with existing items. Identifiers are preserved, duplicates are resolved, and unique records are combined.',
          'Replace Restore: Wipes the local database and reconstructs state precisely from the selected JSON backup file.',
          'Always verify backup integrity before initiating a Replace Restore.',
        ],
      },
    ],
  },
  {
    id: 'notification-engine',
    chapterNumber: 8,
    title: 'Smart Notification Engine & System Channels',
    category: 'Notifications',
    icon: 'notifications-outline',
    accentColor: '#F59E0B',
    summary: 'Four native Android notification channels, natural dynamic schedule variance, context-aware financial copy, and instant alarm cancellation.',
    sections: [
      {
        title: 'Native Android Notification Channels',
        subtitle: 'Dedicated system channels in Android Settings:',
        tableHeaders: ['System Channel Name', 'Channel Identifier', 'Importance & Priority'],
        tableRows: [
          ['Debts & Borrowed Liabilities', 'subdebt_debts', 'High Priority with red LED and vibration alerts'],
          ['Subscriptions & Renewals', 'subdebt_subscriptions', 'High Priority for timely bill renewal reminders'],
          ['Daily Spending & Budget Caps', 'subdebt_spending', 'Default Priority for allowances and daily check-ins'],
          ['Bank Accounts & Cash Flow', 'subdebt_accounts', 'Default Priority for liquid reserve balance pulses'],
        ],
      },
      {
        title: 'Dynamic Non-Repetitive Copywriting',
        subtitle: 'Contextual intelligence without artificial buzzwords:',
        steps: [
          'Morning Financial Kickoff: Dynamically computes remaining monthly budget, daily target allowance, and days remaining. Rotates across 3 distinct template structures.',
          'Midday Actionable Pulse: Completely skipped if you have no open debts and no expiring subscriptions. Zero useless spam notifications.',
          'Evening Check-in: Checks if you already logged expenses today. If logged, congratulates and summarizes your day total; if unlogged, gently prompts to record transactions.',
        ],
      },
      {
        title: 'Natural Smart Timing Schedule Variance',
        subtitle: 'Eliminating mechanical robotic alarms:',
        steps: [
          'Smart Timing applies subtle natural variance (+/- 15 minutes) to notification times based on day-of-month math.',
          'Weekend schedules automatically shift morning alerts 45 minutes later (around 9:45 AM - 10:00 AM) to respect rest periods.',
          'Toggle Natural Smart Timing in Settings to choose between dynamic scheduling and exact fixed hours.',
        ],
      },
      {
        title: 'Granular Channel Controls',
        subtitle: 'Independent category toggles:',
        steps: [
          'Navigate to Settings > Smart Notification Schedule.',
          'Toggle individual categories (Debts, Subscriptions, Daily Spending, Bank Accounts, Smart Timing).',
          'Turning off any channel immediately cancels all active alarms and scheduled notifications for that category from the Android AlarmManager.',
        ],
      },
    ],
  },
  {
    id: 'tools-and-exporters',
    chapterNumber: 9,
    title: 'Financial Tools, Statements & PDF Exporters',
    category: 'Utilities',
    icon: 'construct-outline',
    accentColor: '#6366F1',
    summary: 'Executive PDF statement downloads, EMI loan calculators, CSV data portability, financial calendar audits, and settlement voucher generators.',
    sections: [
      {
        title: 'Formal PDF Financial Statements',
        subtitle: 'Generating structured PDF ledgers:',
        steps: [
          'Spending Statements: Open Export PDF from Spending screen. Select date range (7 days, 30 days, 90 days, 1 year, or All time). Includes official SubDebt vector emblem, category breakdowns, daily summaries, and itemized debit logs.',
          'Bank Passbook Statements: Open any bank account passbook and tap the Document export button. Generates structured statement with opening balance, deposits, withdrawals, transfers, and closing balance.',
          'Direct Storage Download: Tap Save Statement to Phone to write the PDF directly into your linked SAF folder with instant file manager verification.',
          'External Sharing: Tap Share via Apps to send through email, WhatsApp, or cloud storage via Android FileProvider.',
        ],
      },
      {
        title: 'Equated Monthly Installment (EMI) Calculator',
        subtitle: 'Simulating loan schedules and interest amortization:',
        steps: [
          'Access EMI Calculator from the home header tools menu.',
          'Enter principal loan amount, annual interest rate percentage, and loan tenure in months or years.',
          'The calculator computes monthly installment obligations, total interest payable, and total loan payment.',
          'Visual pie charts display the exact ratio between principal capital and cumulative interest.',
        ],
      },
      {
        title: 'Financial Calendar Timeline',
        subtitle: 'Aggregated view of scheduled commitments:',
        steps: [
          'Access Financial Calendar to inspect all upcoming bills, debt settlements, and recurring payments on an interactive calendar matrix.',
          'Dates with pending obligations display high-contrast color indicators.',
          'Tap any calendar date to inspect exact payable items due on that specific day.',
        ],
      },
    ],
  },
];
