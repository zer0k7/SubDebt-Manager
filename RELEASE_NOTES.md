# v2.5.0 — Professional Settlement Cards, Heatmap Grid & Security Fixes

**Release Date:** August 11, 2026

---

## Highlights

This release introduces professional white settlement cards with purple brand logo accents, a completely redesigned 7-column 30-day spending heatmap, enhanced note formatting on transaction receipts, uniform settings controls, and improved CI release packaging for ARM64 Android devices.

---

## What's New & Fixed

### 🏷️ Professional Settlement Certificate Cards
- Redesigned debt and credit settlement cards (`SettlementCardModal.tsx`) from dark green to a crisp **Professional White** certificate card with **SubDebt Logo Purple (`#7C3AED`)** brand accents.
- High-contrast dark Slate typography for maximum legibility on exported share images.

### 📅 Redesigned 7-Column 30-Day Spending Heatmap
- Replaced the old layout with a structured 7-column calendar matrix featuring weekday headers (**Sun, Mon, Tue, Wed, Thu, Fri, Sat**).
- Day of the month numbers (`1`, `2`, ..., `31`) rendered clearly on every cell with dynamic contrast colors.
- Timezone-safe local date calculations to eliminate date offset shifts.
- Interactive transaction inspector card showing date, total spend, and itemized transaction pills for any selected day.

### 📜 Enhanced Receipt Note Formatting
- Upgraded transaction receipts (`DigitalReceiptModal.tsx`) to render notes inside a dedicated, full-width **Notes & Remarks** card container with document icons and multiline line wrapping.
- Prevents text clipping or horizontal squashing when viewing or sharing receipts.

### 🔒 Security Lock & PIN Removal Controls
- Fixed App Lock toggle state evaluation in `AuthLockContext.tsx` so turning off lock completely deactivates the overlay.
- Added a dedicated **Remove PIN** button in Settings (`settings.tsx`) allowing instant deletion and removal of security PIN codes.

### ⚙️ Standardized Display & Regional Settings
- Standardized all segmented toggle selectors (Theme Mode, Card Density, Number Formatting, Week Start Day) with uniform height (`36px`), button width (`48px`), and clean title-case labels.
- Fixed bottom padding cutoff on the Home tab so all dashboard cards scroll smoothly above the floating navigation bar.

### 🚀 Optimized Single ARM64 Build Workflow
- Updated GitHub Actions release workflow (`build.yml`) to produce a single optimized ARM64 APK (`SubDebt-arm64-v8a.apk`) for faster build times and smaller download footprints.

---

## Files Modified

| Area | Files |
|------|-------|
| Settlement Cards | `components/SettlementCardModal.tsx` |
| Heatmap | `components/SpendingHeatmap.tsx` |
| Receipts | `components/DigitalReceiptModal.tsx` |
| Security & Context | `context/AuthLockContext.tsx` |
| Settings & Home | `app/modals/settings.tsx`, `app/(tabs)/home.tsx` |
| App Config & CI | `package.json`, `app.json`, `.github/workflows/build.yml` |

---

## Technical Notes

- 100% offline functionality maintained.
- All code clean with 0 TypeScript compilation errors (`tsc --noEmit`).

---

**Full Changelog:** [`v2.4.0...v2.5.0`](https://github.com/zer0k7/SubDebt-Manager/compare/v2.4.0...v2.5.0)
