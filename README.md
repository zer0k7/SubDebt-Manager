<div align="center">

<img src="assets/icon.png" width="96" alt="SubDebt Manager">

# SubDebt Manager

**A private, offline-first personal finance platform for Android.**  
Track liquid bank reserves, recurring subscriptions, bilateral credit/debt ledgers, and day-to-day spending with zero server connections or third-party tracking.

<br>

[![Release](https://img.shields.io/github/v/release/zer0k7/SubDebt-Manager?style=for-the-badge&color=0D9488&label=Release)](https://github.com/zer0k7/SubDebt-Manager/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20ARM64-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/zer0k7/SubDebt-Manager/releases/latest)
[![Offline](https://img.shields.io/badge/Architecture-100%25%20Offline-059669?style=for-the-badge)](https://subdebt.zer0k7lab.tech)
[![License](https://img.shields.io/badge/License-MIT-3B82F6?style=for-the-badge)](LICENSE)
[![Telemetry](https://img.shields.io/badge/Telemetry-Zero%20Tracking-DC2626?style=for-the-badge)](#privacy-and-data-sovereignty)

<br>

<p align="center">
  <a href="https://apps.obtainium.imranr.dev/redirect.html?r=obtainium://add/https://github.com/zer0k7/SubDebt-Manager"><img src="https://raw.githubusercontent.com/ImranR98/Obtainium/main/assets/graphics/badge_obtainium.png" alt="Get it on Obtainium" height="52"></a>&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://github.com/zer0k7/SubDebt-Manager/releases/latest"><img src="https://raw.githubusercontent.com/zer0k7/SubDebt-Manager/main/assets/badge_github_apk.svg" alt="Get it on GitHub Releases" height="52"></a>
</p>

<sub>Official Portal: <a href="https://subdebt.zer0k7lab.tech">subdebt.zer0k7lab.tech</a></sub>

</div>

<br>

> [!IMPORTANT]
> **Data Sovereignty First:** SubDebt Manager requires no registration, assigns no user IDs, and makes zero outbound network requests. All databases, encrypted vaults, and receipt photos remain strictly on your local hardware.

---

## Core Pillars

<table>
<tr>
<td width="25%" align="center" valign="top">
<br>
<img src="https://img.shields.io/badge/-Reserve%20Banking-0D9488?style=flat-square" alt="Banking">
<br><br>
<b>Multi-Bank Passbook</b>
<br>
<sub>Liquid reserve tracking across checking, savings, wallets, and cash with double-entry transfers and PDF statements</sub>
<br><br>
</td>
<td width="25%" align="center" valign="top">
<br>
<img src="https://img.shields.io/badge/-Subscriptions-6366F1?style=flat-square" alt="Subscriptions">
<br><br>
<b>Recurring Manager</b>
<br>
<sub>Weekly, monthly, quarterly, and annual billing monitoring with renewal countdowns and burn rate projections</sub>
<br><br>
</td>
<td width="25%" align="center" valign="top">
<br>
<img src="https://img.shields.io/badge/-Debt%20Ledger-F59E0B?style=flat-square" alt="Debt">
<br><br>
<b>Dual-Entry Credit</b>
<br>
<sub>Bilateral debt and loan ledger with partial settlement workflows, due date tracking, and graphical receipt cards</sub>
<br><br>
</td>
<td width="25%" align="center" valign="top">
<br>
<img src="https://img.shields.io/badge/-Expense%20Vault-EC4899?style=flat-square" alt="Expenses">
<br><br>
<b>Daily Spending</b>
<br>
<sub>Categorized spending, budget threshold gauges, 30-day activity heatmap, and sandboxed receipt photo storage</sub>
<br><br>
</td>
</tr>
</table>

---

## Capabilities & Architecture

### Multi-Bank Accounts & Passbook Engine

1. **Liquid Reserve Management:** Consolidates balances across multiple checking accounts, high-yield savings, digital prepaid wallets, and physical cash reserves with instant net worth aggregation.
2. **Double-Entry Self-Transfers:** Transfer capital between accounts with atomic balance updates and comprehensive transaction audit records.
3. **Itemized Passbook with Live Search:** Per-account passbook with instant search across transaction values, tags, categories, counterparties, and notes.
4. **Monthly Cash Flow Analytics:** Real-time inflow versus outflow metrics, net surplus and deficit indicators, and segmented progress bars.
5. **Bank Passbook PDF Exporter:** Generate formatted PDF bank statements complete with account headers, balance summaries, and chronological transaction records directly to device storage.
6. **Native Vector Banking Suite:** Built-in vector branding for major Indian banking institutions and payment networks:
   - State Bank of India, HDFC Bank, ICICI Bank, Axis Bank, Kotak Mahindra Bank, Punjab National Bank, Bank of Baroda, Canara Bank, Union Bank of India, J&K Bank, IDFC FIRST Bank, Federal Bank, IndusInd Bank, and Yes Bank.
   - Small finance banks including AU Small Finance, Equitas, and Ujjivan.
   - Payments banks and digital services including India Post Payments Bank, Airtel Payments Bank, Paytm Payments Bank, Slice, Jupiter, and Fi.

### Subscription Lifecycle Management

1. **Flexible Billing Intervals:** Configure recurring commitments across weekly, monthly, quarterly, semi-annual, and yearly schedules.
2. **Renewal Projections & Burn Rate:** Real-time countdowns indicating days remaining until subsequent charges, alongside normalized monthly burn rate aggregations.
3. **On-Device Push Notifications:** Local scheduling alerts you prior to renewals without connecting to external messaging servers or cloud relay services.
4. **Subscription Catalog:** Fast presets for popular streaming platforms, productivity suites, developer tooling, and cloud subscriptions.

### Debt & Credit Ledger

1. **Bilateral Double-Entry Tracking:** Dedicated liability tracking for borrowed funds alongside asset tracking for lent receivables.
2. **Partial Settlement Workflows:** Record iterative settlements with dynamic remaining balance recalculations.
3. **Counterparty Metadata:** Store counterparty names, telephone contacts, settlement target dates, and reference notes.
4. **Receipt Snapshot Generator:** Export and share transaction vouchers rendered locally on-device as clean graphical cards.

### Daily Spending & Budget Controls

1. **Categorized Ledgers:** Built-in expense classifications spanning Food, Transport, Housing, Health, Education, Entertainment, Investments, and EMI obligations, complemented by custom category creation.
2. **Account Passbook Integration:** Link individual expenses directly to source bank accounts for automatic passbook debiting.
3. **Budget Threshold Gauges:** Visual indicators and progress bars tracking consumption against defined monthly ceilings.
4. **30-Day Activity Heatmap:** Daily transaction intensity matrix for visual expenditure pattern analysis.
5. **Bill Splitting:** Split shared expenses among associates with automatic generation of corresponding credit entries.
6. **Sandboxed Receipt Photo Vault:** Attach camera or gallery receipts to any transaction. Files are isolated in app storage, cataloged, and included in encrypted backups.

---

## Privacy & Security Hardening

| Feature | Technical Implementation |
| :--- | :--- |
| **Network Isolation** | Zero network calls. No telemetry SDKs, crash reporters, or behavioral monitors. |
| **AES-256 Cloud Vault** | Password-authenticated PBKDF2 key derivation (100,000 rounds) and AES-256-GCM encryption for exports and automated backups. |
| **Biometric Lock** | Hardware-backed access control via Android `BiometricPrompt` supporting fingerprint, Face Unlock, and device PIN. |
| **Recent Apps Privacy Shield** | Automatic window obscuration during application switching to protect financial figures from system screenshots. |
| **Scoped Storage Compliance** | Zero broad storage permissions (`READ/WRITE_EXTERNAL_STORAGE` omitted). Uses Android Storage Access Framework (SAF) and `FileProvider`. |
| **Automated Local Snapshots** | Scheduled background snapshots saved to local app storage or synced to user-selected SAF folders with 30-version retention. |

---

## Data Portability & Formats

| Format | Scope | Application |
| :--- | :--- | :--- |
| **JSON** | Full Database | Complete state serialization (accounts, ledgers, subscriptions, preferences, and receipt photos) for migration and recovery. |
| **CSV** | Spending & Passbook | Clean tabular data export compatible with spreadsheet software (Microsoft Excel, LibreOffice Calc, Google Sheets). |
| **PDF** | Formal Statements | Formatted financial reports and passbook statements ready for printing or archival. |
| **PNG** | Receipt Vouchers | High-resolution graphical transaction receipts generated on-device via native view capture. |

---

## Technology Stack

<p>

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?style=flat-square&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Reanimated](https://img.shields.io/badge/Reanimated-4-7C3AED?style=flat-square)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)

</p>

| Component | Specification |
| :--- | :--- |
| **Runtime & Core** | React Native 0.81 with Expo SDK 54 |
| **Language** | TypeScript 5.9 |
| **Routing Architecture** | Expo Router v6 (file-based navigation) |
| **Storage Engine** | High-performance MMKV local key-value persistence |
| **Cryptography** | Web Crypto API (`crypto.subtle`) with PBKDF2-SHA256 and AES-256-GCM |
| **Biometrics** | Expo Local Authentication (Android Keyguard / BiometricPrompt) |
| **Notifications** | Expo Notifications (offline local channel scheduling) |
| **Graphics & Vectors** | React Native SVG with custom vector path definitions |
| **Animations** | React Native Reanimated 4 |
| **Build Toolchain** | Automated GitHub Actions CI/CD (Ubuntu ARM64 Native Toolchain) |

---

## Installation & Distribution

### Option 1: Obtainium (Automated Release Tracking)

[Obtainium](https://github.com/ImranR98/Obtainium) monitors this GitHub repository directly and delivers seamless updates as soon as releases are published.

1. Install Obtainium on your device.
2. Tap the button below to add this repository:

<p align="left">
  <a href="https://apps.obtainium.imranr.dev/redirect.html?r=obtainium://add/https://github.com/zer0k7/SubDebt-Manager"><img src="https://raw.githubusercontent.com/ImranR98/Obtainium/main/assets/graphics/badge_obtainium.png" alt="Get it on Obtainium" height="48"></a>
</p>

*Manual Entry:* If the link does not open directly, navigate to Obtainium, select **Add App**, and input `https://github.com/zer0k7/SubDebt-Manager`.

### Option 2: Direct APK Installation

1. Navigate to [GitHub Releases](https://github.com/zer0k7/SubDebt-Manager/releases/latest).
2. Download `SubDebt-arm64-v8a.apk` from the Assets list.
3. Open the package on your Android device to install or update.

<p align="left">
  <a href="https://github.com/zer0k7/SubDebt-Manager/releases/latest"><img src="https://raw.githubusercontent.com/zer0k7/SubDebt-Manager/main/assets/badge_github_apk.svg" alt="Download on GitHub" height="48"></a>
</p>

---

## License

This project is licensed under the [MIT License](LICENSE).
