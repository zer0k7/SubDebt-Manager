# SubDebt Manager v2.17.0

### Release Metadata

| Attribute | Specification |
| :--- | :--- |
| Version | `2.17.0` |
| Build Code | `43` |
| Release Date | `01-Nov-2026` |
| Architecture | `arm64-v8a` |
| Package | `com.subdebt.app` |

### Key Additions

| Component | Scope | Function |
| :--- | :--- | :--- |
| Multi-Bank Accounts & Passbook Ledger | Tab & Modals | Complete bank account tracking with live balance cards, deposits, withdrawals, and account-to-account transfers |
| Cross-Tab Payment Source Integration | Spending Modal | Link daily expenses directly to bank accounts with one-tap balance deduction and automatic passbook record generation |
| Monthly Cash Flow Analytics | Passbook & Accounts Tab | Visual Inflow versus Outflow comparison bar with net surplus or deficit badge and segmented progress tracking |
| Passbook Search Engine | Passbook Modal | Real-time live query search across notes, categories, amounts, and transfer counterparties with query clear action |
| Indian Banking Vector Suite | Component | High-fidelity vector branding for major Indian banking institutions with dynamic recognition and quick selection chips |
| Native Splash Handshake | Engine | Frame-synchronized cold launch sequence matching native window background and vector icon dimensions |
| Executive PDF & Voucher Suite | Export Engine | Official vector emblem branding in PDF statements with direct file storage saving and clean settlement receipts |

### Technical Highlights

1. **Multi-Bank Double-Entry Ledger**: Built local MMKV persistence models for bank accounts and transactional passbooks. Tracks live balances across deposits, withdrawals, and inter-bank transfers with automatic reversal on record modifications.
2. **Cross-Module Bank Payment Source Selector**: Added payment source chips in the daily expense logger. Selecting a registered bank account logs an outward withdrawal in the account passbook, deducts the live balance, and records cross-referenced account metadata.
3. **Monthly Inflow and Outflow Analytics Bar**: Integrated dynamic monthly cash flow calculation engines in both individual passbooks and the consolidated bank tab. Computes monthly deposits against withdrawals, calculates net surplus or deficit, and renders a segmented ratio indicator.
4. **Passbook Search and Multi-Criteria Filtering**: Added a real-time search engine in the passbook modal. Filters entries dynamically by category, transaction notes, numeric amounts, and transfer counterparty names, coupled with interactive type pills and dynamic entry count indicators.
5. **Passbook Modification and Custom Categories**: Edit past bank transactions with automatic ledger balance adjustments. Create, select, and manage custom transaction tags and categories directly within the transaction form.
6. **Indian Banking SVG Suite and Alias Matcher**: Integrated vector icons and alias recognition for J&K Bank, State Bank of India, Slice, India Post Payments Bank, Kotak Mahindra Bank, HDFC Bank, ICICI Bank, Axis Bank, Punjab National Bank, Bank of Baroda, Paytm Payments Bank, Airtel Payments Bank, Canara Bank, Union Bank of India, IndusInd Bank, Yes Bank, Federal Bank, and IDFC FIRST Bank.
7. **Synchronized Native-to-JS Splash Screen Handshake**: Coordinated Android OS window splash display with React Native mounting lifecycle using synchronous readiness signals. Displays matching icon dimensions and background tokens on cold start, eliminating dual-logo transitions, black blinks, and layout shifts.
8. **Formal Passbook and Expense PDF Exporters**: Embedded official SubDebt vector emblem into PDF headers. Implemented dual-action export workflows allowing direct device saving with directory verification feedback and external application sharing via Android FileProvider.
9. **Minimalist Settlement Voucher Overhaul**: Replaced decorative neon gradients, background orbs, fake certificate stamps, and lightning bolt marks with a clean, executive financial voucher. Features real app branding, high-contrast typography, itemized transaction metadata, and structured reference codes.
10. **Unified Vault Snapshot and Complete Backup Engine**: Consolidated manual JSON export and automated daily background snapshot generators into a single canonical pipeline. Backs up subscriptions, debts, credits, daily spending, income entries, bank accounts, transaction logs, customized categories, and complete user preferences with collision-safe restore routines.
