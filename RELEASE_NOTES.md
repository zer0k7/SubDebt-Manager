# v2.7.0 — Floating Top Header, Light Theme Contrast Overhaul, Multi-Line Notes Display & UI Modernization

**Release Date:** August 16, 2026

---

## Highlights

This release introduces a responsive Floating Top Capsule Header across all application screens, delivers a comprehensive light theme visual contrast overhaul, sets the default app theme for new installs to light mode, resolves note field multi-line truncation across all transaction cards, improves the multi-line input interaction model, refines the subscription tab architecture, and modernizes the borrowed liability color identity to a premium Rose Crimson palette.

---

## Key Improvements and Fixes

### 1. Responsive Floating Capsule Header
- Implemented a unified, floating glass capsule header (`FloatingTopHeader.tsx`) across Home, Spending, Subscriptions, Debts, Credits, and Owed screens.
- Utilizes dynamic window dimension scaling for consistent padding, margins, and pill height across compact and extra-large displays.
- Integrated dual-theme translucent glass styling with subtle borders and high-contrast action buttons.

### 2. Light Theme Contrast & Default App Theme
- Set default theme initialization for fresh installs to Light mode in `useTheme.tsx` while preserving local user preference persistence.
- Overhauled card containers, chips, switches, date pickers, and badges in `SubscriptionCard`, `DebtCard`, `CreditCard`, `add-subscription`, and `edit-subscription` for crisp readability on white backgrounds.
- Replaced low-contrast glass overlays in light mode with solid `#FFFFFF` cards, refined borders (`#E2E8F0` / `rgba(0, 0, 0, 0.08)`), and high-contrast typography (`#0F172A` / `#334155` / `#475569`).

### 3. Multi-Line Notes & Purpose Display
- Resolved truncation issues in `SubscriptionCard`, `DebtCard`, and `CreditCard`.
- Replaced single-line and two-line clamped containers with dedicated, unconstrained multi-line info cards displaying full user notes and transaction purposes.
- Fixed a conditional rendering bug in `DebtCard` where notes were suppressed whenever a purpose was present.

### 4. Multiline Input Container Expansion
- Upgraded `GlassInput.tsx` to automatically calculate flexible vertical container sizing when `multiline={true}` is specified.
- Added explicit `textAlignVertical: 'top'` and top-padding compensation for Android and iOS text inputs, preventing earlier lines from scrolling out of view.

### 5. Edit Modal Loading State Optimization
- Integrated an `isLoaded` hydration guard in `edit-subscription.tsx`.
- Displays a clean skeleton placeholder during asynchronous storage reads, eliminating the momentary "Subscription not found" screen flash on modal launch.

### 6. Subscriptions Architecture Simplification
- Removed the heavy 12-month outflow projection SVG chart from `subscriptions.tsx` to streamline the user interface and decrease render overhead.
- Retained the Monthly Bill Calendar and Burn Rate Summary cards with enhanced light/dark theme contrast.

### 7. Modernized Borrowed Section Accent Color
- Updated the default accent color for borrowed debts in `owed.tsx`, `debts.tsx`, and `DebtCard.tsx` from yellow/amber to a modern Rose Crimson palette (`#FB7185` in Dark Mode, `#E11D48` in Light Mode).
- Synchronized segmented tab controls, summary card borders, pending count badges, and hero gradients.

### 8. Spending 30-Day Heatmap Refinements
- Optimized the daily spending calendar grid in `spending.tsx` to reflect accurate month-based day distributions with refined cell sizing and spacing.

---

## File Changes Summary

| Module | Files Modified / Added |
|---|---|
| Navigation & Headers | `components/FloatingTopHeader.tsx`, `app/(tabs)/home.tsx`, `app/(tabs)/spending.tsx`, `app/(tabs)/subscriptions.tsx`, `app/(tabs)/debts.tsx`, `app/(tabs)/credits.tsx`, `app/(tabs)/owed.tsx` |
| Cards & Display | `components/SubscriptionCard.tsx`, `components/DebtCard.tsx`, `components/CreditCard.tsx` |
| Form Controls | `components/GlassInput.tsx` |
| Modals | `app/modals/add-subscription.tsx`, `app/modals/edit-subscription.tsx` |
| Theme & Storage | `hooks/useTheme.tsx` |
| Configuration & Web | `package.json`, `app.json`, `index.html`, `RELEASE_NOTES.md` |

---

## Verification & Build Integrity

- Fully verified with TypeScript compiler (`npx tsc --noEmit`): **0 errors**.
- 100% offline data safety preserved with zero schema breaking changes.
