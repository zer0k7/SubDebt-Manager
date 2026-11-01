# SubDebt Manager v2.16.0

### Release Metadata

| Attribute | Specification |
| :--- | :--- |
| Version | `2.16.0` |
| Build Code | `42` |
| Architecture | `arm64-v8a` |
| Package | `com.subdebt.app` |

### Key Additions

| Component | Scope | Function |
| :--- | :--- | :--- |
| Bank Accounts Tab | Screen | Track multiple bank accounts, digital wallets, and cash reserves in a unified ledger |
| Passbook History | Modal | Complete transaction logs per account with date, reason, category, and running balance |
| Transaction Entry | Modal | Record deposits in, withdrawals out, and inter-bank transfers with instant balance updates |
| Bank Statement Exporter | Utility | Export clean bank statements to PDF with debit and credit ledgers |
| Floating Navigation Bar | Component | 5-tab symmetrical navigation bar with responsive bottom-right action trigger |

### Technical Highlights

1. **Multi-Bank Ledger Engine**: Added local MMKV persistent storage keys for bank accounts and transaction history. Balances recalculate on every deposit, withdrawal, or transfer.
2. **Double-Entry Account Transfers**: Transferring funds from Bank A to Bank B deducts from the origin account and credits the target account. Reversing or deleting a transaction restores balances accurately.
3. **Formal Passbook PDF Exporter**: Generates structured bank statements using sandboxed cache and Android FileProvider. Displays debit, credit, running balance columns, opening balance, and closing balance without third-party branding.
4. **Ergonomic Quick Action Menu**: Updated speed-dial action menu to bloom across five entries with direct shortcuts to Bank Passbook, Subscriptions, Debts, Credits, and Daily Spend.
5. **Full Data Vault & Backup Synchronization**: Integrated bank accounts and passbook transaction records into JSON backup export and merge/replace restoration workflows.
6. **Account Modification & Live Balance Tracking**: Added account editing support from passbook header, interactive transaction timeline navigation, and dynamic balance hints during transaction entry.
7. **Passbook Entry Editing & Custom Tag Manager**: Edit past bank transactions with automatic ledger balance adjustments. Create, select, and manage custom transaction tags and categories directly in the entry form.
8. **Indian Banking SVG Suite & Recognition Engine**: Added dedicated vector icons and alias matching for major Indian banks including J&K Bank, SBI, Slice, IPPB, Kotak Mahindra, HDFC, ICICI, Axis, PNB, Bank of Baroda, Paytm, Airtel, Canara, Union Bank, IndusInd, Yes Bank, Federal Bank, and IDFC FIRST Bank with dynamic recognition and quick selection chips.
9. **Unified Vault Snapshot & Complete Backup Engine**: Consolidated manual JSON export and automated daily background snapshot generators into a single canonical pipeline. Backs up subscriptions, debts, credits, daily spending, income entries, bank accounts, transaction logs, customized categories, and complete user preferences. Hardened merge and replace import engines with identifier resolution and safety parsing.
10. **Synchronized Native-to-JS Splash Screen Handshake**: Coordinated Android OS window splash display with React Native mounting lifecycle using synchronous readiness signals. Displays matching icon dimensions and background tokens on cold start, eliminating dual-logo transitions, black blinks, and layout shifts.
11. **Authentic Vector App Icon & Direct Storage PDF Exporter**: Embedded official SubDebt vector emblem into PDF header, replacing placeholder icons. Redesigned export flow with dual actions: direct file manager download with directory verification feedback, and external application sharing.
12. **Minimalist Settlement Voucher & Receipt Overhaul**: Replaced decorative neon gradients, background orbs, fake certificate stamps, and lightning bolt marks with a clean, executive financial voucher. Features real app branding, high-contrast typography, itemized transaction metadata, and structured reference codes.
