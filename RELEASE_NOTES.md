# Release Notes — v2.10.0

## TL;DR

SubDebt v2.10.0 delivers **Dynamic Smart Notification Schedules with Granular Channel Controls**, **Data Vault Android Storage Access Framework (SAF) Public Folder Sync**, **Embedded Receipt Photo Integration in Digital Receipts**, and an **Executive Multi-Section PDF Financial Statement Generator** with official vector branding and dynamic page counters.

---

## Release Summary

| Module | Change Summary | Impact |
| :--- | :--- | :--- |
| **Notifications** | Dynamic debt, subscription, and spending alerts with individual channel toggles. | Real-time context-aware daily reminders |
| **Data Vault** | Android SAF folder selection and automatic missed-backup catch-up. | Backups directly visible in File Manager |
| **PDF Statements** | Multi-section statement (Spending, Subscriptions, Debts) with vector logo & page numbers. | Professional exportable financial records |
| **Digital Receipts** | Embedded attached receipt photos directly inside digital receipt cards. | Complete shareable receipt slips |
| **Heatmap UI** | Eliminated hardware layer elevation artifact on calendar cells. | High-contrast visual clarity across themes |

---

## Key Features & Improvements

### 1. Dynamic Smart Notification Schedule & Granular Controls
- **Individual Channel Switches**: Added granular toggles in Settings for Pending Debts, Subscription Renewals, Daily Spending & Budget Allowance, and Credit Returns.
- **Dynamic Debt Reminders**: Generates contextual debt reminders with counterparty name and exact remaining balance (e.g., *"You have to pay [Name] [Amount]"*).
- **Subscription Expiry Countdown**: Automated detection for subscriptions renewing today, tomorrow, or ending trial periods.
- **Auto-Sync Across Ledger Actions**: Modifying debts, subscriptions, or spending logs immediately reschedules pending notifications.

### 2. Data Vault Android File Manager Integration & Catch-Up
- **Storage Access Framework (SAF)**: Users can link a public device folder (such as `Documents` or `Downloads`) so backups are directly visible and accessible in Android File Manager apps.
- **Missed Snapshot Catch-Up**: If the device was powered off or the app was closed at 10:00 PM, the scheduler automatically runs the missed snapshot upon opening the app.
- **One-Tap Export**: Added individual snapshot "Save to Phone" and "Export All to Storage" buttons.

### 3. Executive Multi-Section PDF Financial Statement
- **Dynamic Page Numbering**: Resolved duplicate page numbering issues using standard CSS paged media rules (`@page` counters).
- **Official Vector Branding**: Embedded high-resolution SubDebt Manager vector logo, report ID, generation timestamp, and offline verification badges.
- **Multi-Section Ledger**: Captures Spending Category Share Bars, Active Subscriptions Schedule, and Open Debts & Liabilities matrix.
- **Theme Palette Calibration**: Available in Classic Light, Deep Slate Dark, and Luxury Emerald themes.

### 4. Digital Receipts & Visual Fixes
- **Embedded Receipt Photos**: Attached receipts now render directly inside the shareable `DigitalReceiptModal`.
- **Heatmap Cell Glitch Resolved**: Removed hardware elevation artifacts on Android calendar cells for seamless selected-day styling.

---

## Build & Validation

- **App Version**: `2.10.0`
- **Android Version Code**: `32`
- **TypeScript Validation**: 0 errors (`tsc --noEmit` exit code 0).
- **Target Platforms**: Android (APK / AAB) and iOS.
- **Schema Version**: 2.
