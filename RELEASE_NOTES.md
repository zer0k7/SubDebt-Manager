# SubDebt Manager v2.1.1 Release Notes

SubDebt Manager v2.1.1 fixes splash screen graphics, updates theme accent color switching, implements default startup tab routing, and enables privacy mode balance masking.

---

## Technical Highlights & Features

### Dedicated Financial Tools Suite
- **Data Vault & Backup**: Create encrypted offline JSON backups, restore database dumps, and export daily spending spreadsheets directly on device.
- **Financial Health Audit**: Comprehensive liquidity diagnostic score evaluating debt-to-credit balance, monthly velocity, and subscription bleed.
- **Reminder Generator**: 1-tap WhatsApp and SMS payment reminder template generator for unreturned credits and due debts.
- **Debt Payoff Simulator**: Interactive Snowball vs. Avalanche strategy calculator for optimized debt clearance timelines.
- **Offline FX Currency Converter**: High-precision offline conversion between INR, USD, EUR, GBP, AED, and JPY.
- **PDF & Receipt Statements**: Export full ledger statements and transaction receipts formatted for printing or sharing.

### Customization & System Preferences
- **Theme Accent Palette**: Choose custom high-contrast accent colors (Sapphire Blue, Emerald Green, Violet Purple, Amber Gold, Crimson Red).
- **Default Startup Screen**: Customize which screen launches automatically on app startup (Home, Subscriptions, Owed/Debts, Spending).
- **Privacy Mode**: Toggle switch to obscure monetary balance totals on the Home screen when viewing in public.
- **Haptic Feedback Control**: Choose tactile vibration intensity (Heavy, Medium, Light, Off).
- **System Notification Sync**: Automatic state synchronization with Android system notification permissions and custom reminder scheduling.

---

## Installation & Architecture Guide

Choose the appropriate binary file for your device architecture:

| Binary File | Target Architecture | Recommended Devices |
| :--- | :--- | :--- |
| `SubDebt-arm64-v8a.apk` | ARM 64-bit (`arm64-v8a`) | **Recommended** for modern Android smartphones (Android 9.0+) |
| `SubDebt-universal.apk` | Universal (All ABIs) | Compatible with all Android devices and custom ROMs |
| `SubDebt-armeabi-v7a.apk` | ARM 32-bit (`armeabi-v7a`) | Legacy 32-bit Android smartphones and older hardware |
| `SubDebt-x86_64.apk` | x86 64-bit (`x86_64`) | Android emulators, Intel/AMD Chromebooks, and tablets |
| `SubDebt-app-release.aab` | Android App Bundle (AAB) | Target package for Google Play Store distribution |

---

## Verification & Integrity

All builds in this release are compiled with 100% offline local storage (MMKV) and contain zero third-party telemetry or network trackers.
