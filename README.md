# SubDebt Manager

SubDebt Manager is an offline-first, privacy-focused mobile application for tracking subscriptions, daily spending, and personal debt/credit ledgers. Built with React Native, Expo, and TypeScript, the application stores all financial records locally on-device without external cloud services or network tracking.

---

## Technical Features

### Subscription Lifecycle Management
- Tracks recurring billing cycles (weekly, monthly, quarterly, yearly).
- Automatic calculation of renewal dates and days remaining.
- Local notification scheduling for upcoming renewal alerts.

### Debt and Credit Ledger
- Dual ledger tracking for borrowed funds and lent capital.
- Settlement status workflows with payment recording and receipt image generation (`react-native-view-shot`).
- Detailed transaction meta including borrower/lender contact info, dates, and purpose notes.

### Daily Expense Tracking and Budgeting
- Categorized expense logging with custom budget limits.
- Category-level thresholds with automatic budget progress indicators.
- CSV export for daily expense data.

### Security and Data Sovereignty
- 100% offline architecture with local storage via MMKV.
- Optional biometric authentication (Fingerprint / Face ID / Passcode) via `expo-local-authentication`.
- Full backup and restore capability through JSON import/export.

---

## Technology Stack

- **Framework**: React Native 0.81 / Expo SDK 54
- **Language**: TypeScript 5.9
- **Routing**: Expo Router (File-based navigation)
- **Storage**: MMKV (`react-native-mmkv` / storage wrapper)
- **Styling & UI**: Custom CSS-in-JS design system, `expo-blur`, `expo-linear-gradient`
- **Animations**: React Native Reanimated 4
- **Notifications**: Expo Notifications (Local triggers)

---

## Directory Structure

```
SubDebt-Manager/
├── app/                        # Expo Router file-based pages & modals
│   ├── (tabs)/                 # Main tab screens (Home, Subs, Owed, Spending)
│   └── modals/                 # Screen modals (Add/Edit Debt, Settings, Export)
├── assets/                     # Application icons and static assets
├── components/                 # Reusable UI components
├── constants/                  # Currencies and static definitions
├── hooks/                      # Data management and state hooks
├── storage/                    # MMKV local storage adapters and keys
├── utils/                      # Helper modules (export, dates, notifications)
├── app.json                    # Expo configuration manifest
├── package.json                # Project dependencies and scripts
└── tsconfig.json               # TypeScript compiler configuration
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Expo CLI**: `npm install -g expo-cli` (optional, `npx expo` supported)
- **Android Studio / Xcode**: Required for local emulator builds.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/zer0k7/SubDebt-Manager.git
   cd SubDebt-Manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npx expo start
   ```

---

## Running on Devices

### Android Development
Run on a connected Android device or emulator:
```bash
npm run android
```

### iOS Development (macOS required)
Run on the iOS simulator:
```bash
npm run ios
```

---

## Building for Production

### Android APK / Bundle
Generate a native Android build locally:
```bash
npx expo run:android --variant release
```

Alternatively, use Expo Application Services (EAS):
```bash
eas build --platform android --profile production
```

---

## Data Privacy and Security

- **No Remote Telemetry**: SubDebt Manager makes zero network API requests during normal operation.
- **Local Storage**: Data is saved directly to device storage using high-performance key-value persistence.
- **Biometric Lock**: When enabled in Settings, application access is blocked until biometric credentials match.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
