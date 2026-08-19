# Release Notes — v2.9.0

## TL;DR

SubDebt v2.9.0 introduces **Automated 10:00 PM Daily Vault Snapshots**, full **Unified Themed Dialog System (AppPopup)** replacing legacy native OS alerts, **Debt-to-Daily Spending Auto-Settlement Logging**, and **Dual-Theme High-Contrast Heatmap & Explorer Calibration**.

---

## Release Summary

| Module | Change Summary | Impact |
| :--- | :--- | :--- |
| **Data Vault** | Automated nightly snapshots at 10:00 PM IST with full local retention (30 backups). | Automated data security & one-tap restore |
| **Design System** | Complete migration from native `Alert.alert` to themed glass `AppPopup`. | 100% visual and interactive consistency |
| **Debt & Settle** | Auto-prompt to record settled debt payments directly into Daily Spending. | Zero manual duplicate entry |
| **Spending Heatmap** | High-contrast present-day cell rendering and blue focal status indicators. | Legibility in light & dark modes |
| **Spending Explorer** | Solid category filter badges with 24px right scroll clearance. | Clean horizontal navigation |
| **Security & Privacy** | Security PIN & App Lock tagged with Beta indicator and safety guards. | Transparent feature readiness |

---

## Key Features & Improvements

### 1. Automated Vault Snapshots & Scheduled Backups
- **Nightly Automated Execution**: Automated background trigger creates daily offline backups at 10:00 PM IST (`22:00`).
- **Standardized File Structure**: Timestamped schema files named `SubDebt_Snapshot_YYYY-MM-DD_HHmmss.json`.
- **Full-State Preservation**: Captures Subscriptions, Debts, Credits, Daily Spending entries, Custom Categories, Monthly Budgets, Category Limits, and all user settings.
- **Snapshot Management Console**: Dedicated management view in Data Vault with one-tap Restore (Merge / Replace), Share, Delete, and manual "Snapshot Now" actions.
- **Retention Control**: Automatically manages the latest 30 snapshots in local sandbox storage (`SubDebt_Vault_Backups/`).

### 2. Full Themed Glass Popups Migration
- Replaced all legacy OS native dialogs across modals (`settings.tsx`, `edit-debt.tsx`, `edit-credit.tsx`, `manage-categories.tsx`, `spending-explorer.tsx`, `import-csv.tsx`, `tool-reminder-generator.tsx`, `tool-data-vault.tsx`).
- Standardized on glassmorphic `AppPopup` component with custom icons, haptics, and destructive action protections.

### 3. Debt Settlement to Daily Spending Pipeline
- Marking any debt as paid now prompts to automatically log the transaction into Daily Spending under category `Debt & EMI`.
- Sequential modal flow ensures receipt sharing card (`SettlementCardModal`) captures clean images without overlay interference.

### 4. Heatmap & Category Filter Visual Calibration
- **Calendar Heatmap**: Fixed light mode text contrast on current day (19th) zero-spend cells and status indicators.
- **Category Filter Chips**: Standardized active badges to solid backgrounds with white typography and generous 24px right padding to prevent clipping.

---

## Build & Validation

- **TypeScript Validation**: 0 errors (`tsc --noEmit` exit code 0).
- **Target Platforms**: Android (APK / AAB) and iOS.
- **Schema Version**: 2.
