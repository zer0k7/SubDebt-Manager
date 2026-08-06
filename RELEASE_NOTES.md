# v2.4.0 — Security Vault & Executive UI

**Release Date:** August 6, 2026

---

## Highlights

This release introduces app-wide biometric and PIN security, a 30-day spending activity heatmap, and a complete redesign of the Settings and Home screens into clean, executive-grade interfaces.

---

## New Features

### Biometric & PIN Security Lock
- Full-screen lock overlay with Face ID / Fingerprint hardware authentication.
- 4-digit keypad PIN fallback with haptic feedback and error shake animation.
- Automatic lock on app launch and background-to-foreground transitions.
- Managed via `AuthLockContext` wrapping the entire app tree.

### 30-Day Spending Activity Heatmap
- Visual activity grid rendered on the Spending tab.
- Color-coded day blocks: green (low), yellow (moderate), red (high), muted (zero).
- Tap any block to reveal exact date and amount.

### Custom Category Manager
- Create unlimited custom spending categories.
- 35-icon palette and 12-color palette picker.
- Categories persist via MMKV and override system defaults.

### Full Financial Calendar Matrix
- Interactive monthly calendar grid with event markers.
- Subscription renewals, debt due dates, credit returns, and daily spending totals.
- Tap any day to view the full agenda.

---

## Redesigns

### Executive Home Dashboard
- Net Position hero card with `NET POSITIVE` / `NET LIABILITY` indicator.
- Privacy mode toggle to mask all financial figures.
- 4-metric Financial Pulse Matrix (budget usage, debt load, active subs, credit pending).
- 1-tap quick action row and 10-tool Financial Utilities Hub.

### Executive Settings Modal
- Organized into 5 section cards: Display & Regional, Security & Privacy, Notifications, Budget & Categories, Data Vault & System.
- Segmented controls for theme, density, number format, and week start day.
- Inline PIN configuration form.
- Direct navigation to Data Vault and Category Manager.

---

## Files Changed

| Area | Files |
|------|-------|
| New Components | `SecurityLockOverlay.tsx`, `SpendingHeatmap.tsx` |
| New Context | `AuthLockContext.tsx` |
| New Hooks | `useCategoryManager.ts` |
| New Modals | `manage-categories.tsx`, `tool-financial-calendar.tsx` |
| Redesigned | `home.tsx`, `settings.tsx` |
| Modified | `_layout.tsx`, `spending.tsx`, `categories.ts`, `keys.ts` |

---

## Technical Notes

- All features are 100% offline. No network dependency.
- Security PIN stored locally via MMKV. Biometric auth via `expo-local-authentication`.
- Custom categories dynamically override system defaults at runtime.
- Zero TypeScript compilation errors (`tsc --noEmit` clean).

---

**Full Changelog:** [`v2.3.0...v2.4.0`](https://github.com/zer0k7/SubDebt-Manager/compare/v2.3.0...v2.4.0)
