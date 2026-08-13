# v2.6.0 — Full App-Wide Accent Color System, In-App Updater Integration & Indian Rupee (INR) Fixes

**Release Date:** August 13, 2026

---

## Highlights

This release restores complete **Accent Color customization** across the entire application, integrates the native **In-App Updater** directly into the redesigned Settings About footer, fixes parameter fallbacks to standardize **Indian Rupee (INR - ₹)** formatting globally, and ensures 100% type-safe compilation.

---

## What's New & Fixed

### 🎨 App-Wide Accent Color System
- Added back the **Accent Color Picker** in Settings under *Display & Regional Preferences* featuring 5 interactive color swatches: **Blue**, **Green**, **Purple**, **Amber**, and **Red**.
- Updated `useTheme.tsx` so that changing the accent color dynamically overwrites `purple`, `blue`, `purpleGlow`, and orb gradient tokens.
- Replaced 60+ hardcoded `rgba(124, 58, 237, ...)` color strings across 15+ screens, modals, and component files with dynamic `colors.accent.alpha(opacity)` calls.
- Selection changes now instantly propagate across all buttons, active chips, chart badges, toggle switches, and focus borders everywhere in the app.

### 🚀 Redesigned Settings Footer & In-App Updater
- Added an **About Footer** centered at the bottom of Settings displaying:
  - App Logo icon (`56x56px`) with smooth rounded corners.
  - App Name (`SubDebt Manager`) & Version badge (`v2.6.0`).
  - Core app status pills: **100% Offline**, **On-Device Vault**, **Open Source**, **Zero Ads**.
  - Direct **Check for Updates** action button.
- Tapping **Check for Updates** fetches the latest single-APK release from GitHub and seamlessly opens the native `UpdatePrompt` in-app installation modal (showing version comparison, changelog bullet points, download progress bar, and direct package installer launch).

### 🇮🇳 Indian Rupee (INR - ₹) Currency Standard
- Fixed parameter fallbacks in `useCurrency.ts` and `currencies.ts` where unassigned item currencies defaulted to `USD`, previously causing an unintended `86.5x` conversion multiplier on INR values.
- Updated `useCurrency.ts` to automatically store `'INR'` into MMKV storage on initial app launch.
- Updated scheduled push notifications in `notificationHelpers.ts` to default currency calculations and alert messages to **INR (₹)** instead of `$`.
- Updated default tool states (e.g. `tool-currency-converter.tsx`) to start with `INR`.

### 🛡️ Type Safety & Build Hardening
- Updated `ThemeColors` interface in `constants/colors.ts` so `alpha`, `primary`, `primaryDark`, `gradient`, and `glow` tokens are required properties with default initializers.
- Confirmed zero TypeScript compilation errors (`npx tsc --noEmit` code 0).

---

## Files Modified

| Area | Files |
|------|-------|
| Settings & Footer | `app/modals/settings.tsx` |
| Theme System & Colors | `hooks/useTheme.tsx`, `constants/colors.ts` |
| Currency & Notifications | `hooks/useCurrency.ts`, `constants/currencies.ts`, `utils/notificationHelpers.ts`, `app/modals/tool-currency-converter.tsx` |
| Main Tabs | `app/(tabs)/home.tsx`, `app/(tabs)/spending.tsx`, `app/(tabs)/subscriptions.tsx` |
| Modals & Tools | `app/modals/add-subscription.tsx`, `app/modals/edit-subscription.tsx`, `app/modals/export-pdf.tsx`, `app/modals/import-csv.tsx`, `app/modals/manage-categories.tsx`, `app/modals/tool-debt-payoff.tsx`, `app/modals/tool-emi-calculator.tsx`, `app/modals/tool-financial-calendar.tsx` |
| Components | `components/CategoryBreakdown.tsx`, `components/InsightsPanel.tsx`, `components/SecurityLockOverlay.tsx`, `components/SpendingEntryCard.tsx`, `components/UpdatePrompt.tsx`, `components/WeeklySpendingChart.tsx` |
| Version Configuration | `package.json`, `app.json`, `RELEASE_NOTES.md` |

---

## Technical Notes

- 100% offline functionality & local vault security maintained.
- All code clean with 0 TypeScript compilation errors (`tsc --noEmit`).
