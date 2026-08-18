<div align="center">

# SubDebt Manager

**A privacy-first, offline personal finance manager for tracking recurring subscriptions, personal debt/credit ledgers, and daily expenses on Android.**

[![Latest Release](https://img.shields.io/github/v/release/zer0k7/SubDebt-Manager?style=flat-square&color=3B82F6)](https://github.com/zer0k7/SubDebt-Manager/releases/latest)
[![Build Status](https://img.shields.io/github/actions/workflow/status/zer0k7/SubDebt-Manager/build.yml?branch=main&style=flat-square)](https://github.com/zer0k7/SubDebt-Manager/actions)
[![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=flat-square&logo=android&logoColor=white)](https://github.com/zer0k7/SubDebt-Manager/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Privacy](https://img.shields.io/badge/Telemetry-Zero%20%2F%20100%25%20Offline-059669?style=flat-square)](#privacy--data-sovereignty)

<br/>

<a href="obtainium://add/https://github.com/zer0k7/SubDebt-Manager">
  <img src="https://github.com/ImranR98/Obtainium/raw/main/assets/graphics/badge_obtainium.png" alt="Get it on Obtainium" height="48">
</a>
&nbsp;&nbsp;
<a href="https://github.com/zer0k7/SubDebt-Manager/releases/latest">
  <img src="https://img.shields.io/badge/Download-Latest%20APK-1E293B?style=for-the-badge&logo=android&logoColor=white" height="48">
</a>

<br/>
<br/>

</div>

---

## Overview

SubDebt Manager is an open-source, offline-first personal financial utility designed for users who demand absolute data sovereignty. It unifies recurring subscription tracking, bilateral debt/credit ledgers, and day-to-day spending logs into a single high-performance interface.

All records are stored locally on your device. The application requires no user accounts, connects to zero remote servers, and includes no analytics or telemetry trackers.

---

## Key Features

### Subscription Management
* **Recurring Billing Schedules:** Track services across weekly, monthly, quarterly, and yearly billing cycles.
* **Renewal Projections:** Real-time countdowns, renewal date calculation, and monthly burn rate aggregation.
* **On-Device Notifications:** Local alerts for upcoming subscription renewals without third-party push services.

### Debt and Credit Ledger
* **Dual-Entry Ledger:** Separate tracking for funds owed to others (borrowed liabilities) and funds owed to you (lent assets).
* **Payment Workflows:** Record partial or full settlements with dynamic remaining balance calculations.
* **Transaction Metadata:** Store counterparty contact details, settlement due dates, and itemized transaction notes.
* **Receipt Snapshot Generation:** Export and share clean graphical transaction summaries via on-device rendering.

### Daily Expense Tracking and Budgeting
* **Categorized Spending:** Group transactions by custom budget categories with dedicated color identifiers.
* **Budget Thresholds:** Visual progress indicators reflecting spending against defined monthly limits.
* **Activity Heatmap:** 30-day visual intensity matrix of daily transaction frequency.

### Privacy, Security, and Portability
* **100% Offline Persistence:** High-performance local storage with zero cloud dependencies.
* **Biometric Lock:** Secure application access using hardware-backed Fingerprint, Face ID, or system PIN.
* **Complete Backup & Restore:** Export and import full database state via JSON files for device migration.
* **Data Export:** Export spending and ledger data directly to CSV.

---

## Installation & Updates

### Option 1: Obtainium (Recommended)

[Obtainium](https://github.com/ImranR98/Obtainium) allows you to install and receive automatic release updates directly from this GitHub repository.

1. Install **Obtainium** on your Android device.
2. Click the button below or manually add `https://github.com/zer0k7/SubDebt-Manager` inside Obtainium:

<div align="left">
  <a href="obtainium://add/https://github.com/zer0k7/SubDebt-Manager">
    <img src="https://github.com/ImranR98/Obtainium/raw/main/assets/graphics/badge_obtainium.png" alt="Get it on Obtainium" height="44">
  </a>
</div>

### Option 2: Direct APK Download

Download the signed release package directly from GitHub Releases:

1. Navigate to [Latest Releases](https://github.com/zer0k7/SubDebt-Manager/releases/latest).
2. Download `SubDebt-arm64-v8a.apk` under the Assets section.
3. Open the downloaded APK on your Android device to install.

---

## Privacy & Data Sovereignty

| Principle | Implementation |
|---|---|
| **Network Requests** | None. The application operates entirely offline. |
| **User Tracking** | Zero analytics, crash reporting SDKs, or advertising identifiers. |
| **Local Storage** | Encrypted/local key-value persistence on device hardware. |
| **Authentication** | Handled strictly by Android Keyguard / BiometricPrompt APIs. |
| **Data Ownership** | Unrestricted JSON and CSV import/export capabilities at any time. |

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Core Framework** | React Native 0.81, Expo SDK 54 |
| **Language** | TypeScript 5.9 |
| **Routing** | Expo Router v6 (File-based navigation) |
| **Persistence** | MMKV / Local Storage Key-Value Engine |
| **UI & Styling** | Custom Design System, Expo Blur, Linear Gradient |
| **Animations** | React Native Reanimated 4 |
| **Biometrics** | Expo Local Authentication (`BiometricPrompt` API) |
| **CI / CD** | GitHub Actions (Automated Linux ARM64 Native Toolchain) |

---

## Project Structure

```
SubDebt-Manager/
├── app/                        # Expo Router application routes and modals
│   ├── (tabs)/                 # Main screen controllers (Home, Subs, Owed, Spending)
│   └── modals/                 # Modal dialogs (Add/Edit Records, Settings, Export)
├── assets/                     # Application icons, splash screens, and fonts
├── components/                 # Reusable UI component library
├── constants/                  # Currency tables, themes, and configuration
├── hooks/                      # Custom React state and lifecycle hooks
├── storage/                    # Local storage persistence adapters
├── utils/                      # Date utilities, notification managers, export helpers
├── app.json                    # Expo project configuration manifest
├── package.json                # Project dependencies and script declarations
└── tsconfig.json               # TypeScript compiler options
```

---

## Building from Source

### Prerequisites

* **Node.js**: `v20.x` or higher
* **npm**: `v9.x` or higher
* **Java Development Kit (JDK)**: OpenJDK 17
* **Android SDK**: Build-Tools, Platform-Tools, API Level 34+

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/zer0k7/SubDebt-Manager.git
   cd SubDebt-Manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local Expo development server:**
   ```bash
   npm run start
   ```

### Compile Release APK (ARM64)

To generate a standalone release APK locally using the Android toolchain:

```bash
# Generate native Android project files
npx expo prebuild --platform android --clean

# Compile release APK
cd android
./gradlew assembleRelease
```

The compiled APK will be located in:
`android/app/build/outputs/apk/release/`

---

## Contributing

Contributions, bug reports, and feature proposals are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Open a Pull Request.

---

## License

This project is licensed under the [MIT License](LICENSE).
