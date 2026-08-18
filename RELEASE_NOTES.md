# v2.8.0 — Spending Explorer, Receipt Photo Vault, Dual-Theme Calibration & Full-Ledger Backup Architecture

SubDebt v2.8.0 delivers an extensive capability upgrade featuring a dedicated Spending Explorer and Analytics console, native camera and gallery receipt photo attachments with an interactive full-screen Photo Vault, full dual-theme visual calibration, and a re-engineered backup engine that captures the complete state of the offline ledger and user preferences.

---

## Key Highlights & New Capabilities

### 1. Dedicated Spending Explorer & Advanced Analytics
- **Multi-Criteria Filtering Engine**: Filter expense records across preset date intervals (Today, Yesterday, This Week, This Month, Last Month, 90 Days, This Year) or custom date windows with intuitive date pickers.
- **Concurrent Category & Keyword Filtering**: Filter simultaneously across custom categories, merchants, descriptions, and notes.
- **Live Metric Aggregation**: Instant metric computation providing total filtered volume, average cost per transaction, and top spending category.
- **Interactive Distribution Visualizer**: Dynamic progress indicators demonstrating category-wise allocation and percentage shares.
- **Configurable Sorting Matrix**: Reorder transactions by newest, oldest, highest amount, lowest amount, or alphabetical title.
- **One-Tap Spreadsheet Export**: Export filtered transaction views directly to formatted CSV files with native sharing integration.

### 2. Receipt Attachment System & Interactive Photo Vault
- **Permanent Local Storage Pipeline**: Attach photos taken directly with the camera or selected from the device photo library. Receipt images are copied to persistent application storage to ensure longevity across system cache clear operations.
- **Full-Screen Photo Vault Inspector**: Dedicated high-resolution image viewer with backdrop blur, native share triggers, and transaction metadata overlays.
- **Expense Card Integration**: Transaction items with attached receipts automatically display interactive photo badges for rapid visual inspection.
- **Streamlined Modal Workflows**: Add and edit spending interfaces now feature dedicated receipt management cards supporting live previews, replacement, and removal.

### 3. Calendar Heatmap & Localization Calibration
- **Present-Day High-Visibility Indicator**: Today's calendar cell features a high-contrast accent ring border, glowing focal indicator, and distinct background highlight for immediate identification.
- **Dynamic Localization in Legend**: Legend values now dynamically reflect the user's active currency configuration (including Indian Rupees INR) rather than static fallback symbols.

### 4. Theme-Adaptive Launch & Visual Hierarchy
- **White Background Native Launch Calibration**: Updated native adaptive icon and splash configurations to pure white, eliminating dark border boxes during initial application boot.
- **Theme-Reactive Splash Experience**: Custom splash sequence automatically harmonizes with the user's active theme palette and accent selections, utilizing glassmorphic surfaces and hardware-accelerated transitions.
- **Dual-Theme Contrast Calibration**: Elevated cards, filter pills, search fields, and modal bottom sheets have been calibrated for crisp visibility and contrast in both Light and Dark themes.

### 5. Comprehensive Full-Ledger Backup & Restore Architecture
- **Complete State Export**: Backup JSON files now serialize all operational datasets, including Subscriptions, Debts, Credits, Daily Spending entries (with receipt associations), Monthly Budgets, Category Limits, and Custom Categories.
- **Preference & Setting Persistence**: Backups capture application settings including currency, number formatting (Indian vs Western), date formatting, week start day, card density mode, default payment methods, theme preferences, accent color selections, and reminder schedules.
- **Dual-Mode Restoration**: Full support for both non-destructive Smart Merge and Complete Vault Replacement modes with automatic notification rescheduling.

---

## Technical Specifications & Verification

- **TypeScript Type Safety**: 100% type coverage verified with strict zero-error compiler validation.
- **Storage Layer**: Asynchronous persistent storage integration with integrity guarantees across schema version 2.
- **Media Pipelines**: Native permissions and asset resolution handled via dedicated image picking and file sharing integrations.
