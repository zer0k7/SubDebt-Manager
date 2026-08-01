# 🚀 SubDebt Manager v2.2.0 Release Notes

> **Privacy-First Offline Financial Ledger & Manager**  
> *Release Date: August 1, 2026*

---

## 🌟 Highlights & Major Features

### 💱 Real Offline FX Currency Converter
- Replaced 1:1 dummy conversion with an offline conversion engine.
- Benchmark exchange rates table covering **30 global currencies** (USD, INR, EUR, GBP, JPY, AED, CAD, AUD, etc.).
- 100% offline — zero network telemetry or API keys required.

### 🎨 30+ Expanded Spending Categories
- Expanded spending categories from 13 to **30+ categorized items** across 10 groups (Food & Dining, Transportation, Housing, Health & Fitness, Entertainment, Family, Financial, etc.).
- Added dynamic icon and color styling integrated into forms, breakdown charts, entry cards, and settings.

### 📅 High-Contrast Custom Calendar (`AppDatePicker`)
- Custom glassmorphic date & time picker replacing native OS popups.
- Solid surface backgrounds (`#FFFFFF` / `#141424`), bold slate typography (`#0F172A` / `#F8FAFC`), and crisp day cell tiles.
- Configurable **First Day of the Week** (`Monday`, `Sunday`, `Saturday`).

### ⚡ Top 1% Animated Custom Splash Screen
- Smooth animated splash screen (`CustomSplashScreen`) featuring glowing emblem, kinetic spring entrance, and instant native splash dismissal.

### ⚙️ Global Real-Time Settings Reactivity (`SettingsContext`)
- Added global `SettingsContext` for live, real-time preference updates without needing app restarts:
  - 🔢 **Number Format**: Standard (`1,234.56`), European (`1.234,56`), and Space (`1 234.56`).
  - 📅 **Date Format**: `DD/MM/YYYY`, `MM/DD/YYYY`, and `YYYY-MM-DD`.
  - 🗓️ **First Day of Week**: `Monday`, `Sunday`, `Saturday`.
  - 💳 **Default Payment Method**: Card, Cash, UPI, or Bank Transfer.
  - 🗃️ **Auto-Archive Settled Records**: Never, 30 Days, 90 Days, or 1 Year threshold.
  - 📱 **Card Layout Density**: Comfortable vs Compact card modes.

### 🧹 Header Cleanup & 60 FPS Performance
- Removed redundant top header `+` buttons across all tabs (Spending, Subscriptions, Owed, Debts, Credits) for clean, uncluttered navigation headers.
- Added list windowing optimizations (`initialNumToRender`, `maxToRenderPerBatch`, `removeClippedSubviews`) for 60 FPS smooth scrolling.
- Refactored PDF report exporter to use matching UI category colors.

---

## 🔒 Security & Privacy
- 100% offline MMKV local storage.
- Optional biometric authentication lock (Face ID / Fingerprint / PIN).
- Privacy Mode balance masking on Home screen.

---

*Built with ❤️ for privacy-conscious personal finance tracking.*
