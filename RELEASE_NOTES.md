# 🚀 SubDebt Manager v2.3.0 Release Notes

> **Privacy-First Offline Financial Ledger & Manager**  
> *Release Date: August 2, 2026*  
> *Codename: "Pro Suite & Receipt Vault"*

---

## 🌟 Highlights & Major Features

### 🧮 Offline Loan & EMI Amortization Calculator
- **Real-Time EMI Math Engine**: Compute Monthly EMI, Total Interest Payable, and Total Amount for any loan amount, tenure (years or months), and interest rate.
- **0% Interest Support**: Gracefully handles 0% zero-interest EMI financing plans without division errors.
- **Interactive Amortization Table**: Year-by-year and month-by-month breakdown of Principal, Interest, and Remaining Balance.
- **1-Tap Ledger Integration**: Instantly transfers loan details into your Debt tracker with pre-filled lender name, principal amount, and EMI breakdown notes.

### 🧾 1-Tap Branded Digital Receipt Generator & Share Sheet
- **Digital Receipt Cards**: Generate high-contrast, verification-badged digital receipt certificates for expenses, debt settlements, and credit returns.
- **Image Sharing**: Capture 1-tap high-resolution PNG receipt images using `react-native-view-shot` and share directly to WhatsApp, Email, or Telegram via `expo-sharing`.

### 🗓️ 12-Month Subscription Cash Outflow Forecast
- **Rolling 12-Month Projections**: Forecasts recurring subscription renewal expenses for the next 12 months across monthly, yearly, weekly, and quarterly billing cycles.
- **Interactive Timeline**: Touch-selectable monthly bar chart with itemized subscription charge breakdowns per month.

### 📁 CSV Bank Statement & Spreadsheet Importer
- **Universal Importer**: Pick CSV files from Excel, Google Sheets, or Bank statements via `expo-document-picker`.
- **Auto Column Detection**: Auto-detects Date, Description, Amount, and Category columns with interactive transaction previews before importing to your ledger.

### 🔔 Fixed Android Status Bar Notification Icon
- **Clean Vector Silhouette**: Replaced colored icon asset with a 192x192 monochrome white vector silhouette PNG on a 100% transparent background.
- **No More White Box**: Eliminates the Android status bar and ambient notification dot solid white square box issue.

### ⏰ Custom Multi-Time Notification Scheduler
- **3 Distinct Notification Slots**: Custom time scheduling for Morning Allowance Kickoff (9:00 AM), Midday Financial Pulse (2:00 PM), and Evening Ledger Wrap-up (8:00 PM).

### 📊 Category Budget Caps & Progress Status Indicators
- **Per-Category Budget Caps**: Track monthly spending against category limits set in `useBudget`.
- **Status Indicator Colors**:
  - 🟢 **Under 70%**: Normal Category Color
  - 🟡 **70% to 90%**: Amber Warning (`#F59E0B`) with percentage used
  - 🔴 **Over 90% / Over Budget**: Red Danger (`#EF4444`) with exact overage amount

---

## 🔒 Security & Privacy
- 100% offline local MMKV storage.
- Optional biometric authentication lock (Face ID / Fingerprint / PIN).
- Zero external tracking, zero cloud accounts required.

---

*Built with ❤️ for privacy-conscious personal finance tracking.*
