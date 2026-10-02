# Release Notes — v2.12.0

## TL;DR

SubDebt v2.12.0 is a milestone visual and utility update introducing our **new brand identity & Play Store full-bleed icon**, the **1-Tap Unsubscribe Assistant** for terminating recurring charges across major services, the **Aesthetic Financial Snapshot Card** for sharing privacy-masked debt & subscription milestones, and the **v2.12 Celebratory Brand Reveal Modal**.

---

## What's New in v2.12.0

### 1. Brand Refresh & Google Play Store Icon Standards
- **Full-Bleed 512×512 Icon**: Redesigned master app icon featuring Deep Racing Pine Teal with porcelain leather folio, vibrant amber subscription card, and mathematically balanced geometric currency emblem (`$`).
- **Play Store Squircle Invariant**: 100% full-bleed square canvas (0 border-radius on outer canvas), preventing the awkward "dot in a squircle" double-padding bug on Google Play listings.
- **Android Status Bar Silhouette**: Created a pure monochrome `#FFFFFF` alpha punch-through icon (`notification-icon.png`), ensuring crystal-clear status-bar rendering on modern Android devices without solid white box artifacts.

### 2. 1-Tap "Cancel Subscription" Direct Assistant
- **Direct Portal Links**: Instant one-tap navigation to official subscription management pages for Google Play, Apple App Store, Netflix, Spotify, Amazon Prime, YouTube, Disney+, ChatGPT, GitHub, and Adobe.
- **Formal Cancellation Letter Generator**: Automatically drafts a polite, legally sound cancellation request with subscription cost, dates, and account placeholders. Includes 1-tap "Share / Copy" and "Email Support" (`mailto:`).
- **1-Tap Inactive State**: Instantly marks subscriptions inactive in SubDebt to pause renewal alerts and exclude them from monthly cashflow burn projections.

### 3. Aesthetic Financial Snapshot Card ("Share My Stats")
- **Shareable Visual Card**: High-resolution branded card featuring the new SubDebt logo, active subscriptions outlay, debt payoff progress %, and net savings rate.
- **Built-in Privacy Masking**: Toggle eye button to mask sensitive financial amounts (`$••••••`) while keeping progress percentages and service counts visible for safe social sharing.
- **Multi-Theme Engine**: Switch between Emerald Luxe, Obsidian Dark, and Sapphire Blue card themes with 1-tap native image sharing (`expo-sharing` + `react-native-view-shot`).

### 4. Interactive "What's New in v2.12" Brand Reveal
- **First-Launch Celebration**: Beautiful modal unveiling the new brand look upon updating to v2.12.
- **Settings Access**: Accessible anytime via Settings > About > "What's New in v2.12".

---

# Release Notes — v2.11.1

## TL;DR

SubDebt v2.11.1 is an essential polish and bugfix update resolving Home dashboard card spacing, edge margins, scroll bounds, and Android navigation bar button clipping in custom categories. It also eliminates false-positive subscription price-hike alerts and consolidates the cashflow insights into an executive view.

---

## What's New in v2.11.1

### 1. Home Dashboard Card Layout & Proper Spacing
- **Restored Gaps & Side Margins**: Re-introduced `contentContainerStyle` with 20px horizontal padding and 16px vertical card spacing to eliminate edge-to-edge crowding.
- **Scroll Clearance Fix**: Increased bottom padding to 140px so the entire dashboard (including the Financial Utilities Hub) scrolls cleanly above the floating bottom tab bar.
- **Unified Cashflow & Runway Card**: Combined the separate Monthly Cashflow and 30-Day Runway into a single cohesive executive card showing Inflows, Outflows, Net Savings, daily burn rate, and 30-day projection.

### 2. Custom Category Save Button Clearance
- **System Navigation Inset Defense**: Added `useSafeAreaInsets` and `edges={['top', 'bottom']}` in Manage Categories so the "Save Custom Category" button and full form never get cut off under the Android 3-button or gesture navigation bar.
- **Comfortable Touch Target**: Elevated Save button height to 52px with proper vertical margins.

### 3. Price-Hike False-Positive Elimination
- **Strict Matching Rules**: Prevented micro-recharges or unrelated small purchases from falsely triggering 600%+ price-hike alerts on active subscriptions.
- **Dismissible Alert**: Added one-tap dismiss button to the price-hike card.

---

## Release Summary

| Module | Change Summary | Impact |
| :--- | :--- | :--- |
| **Home Dashboard** | 20px edge margins, 16px card gap, 140px bottom scroll clearance. | Perfect alignment & full scrollability |
| **Category Manager** | Dynamic safe-area padding for Save button in Custom Categories. | No overlap under Android navigation bar |
| **Price Hike Engine** | Strict category and magnitude matching with dismiss button. | Zero false alarms |
| **Icon & Color Library** | 120+ searchable categorized vector icons and 24 curated palette swatches. | Rich visual cues for any lifestyle spending |
| **Smart Auto-Categorizer** | Keyword & merchant dictionary with self-learning prediction on expense entry. | Instant zero-effort categorization while typing |
| **Category Budget Alerts** | Automated push notification triggers at 80% and 100% of per-category monthly limits. | Prevents accidental overspending in specific silos |
| **Receipt Scanner & Gallery** | Pattern-based receipt data extraction and full-screen visual grid gallery modal. | Digitize receipts and browse past purchase proofs |
| **Split Bills with Friends** | Equal and custom split calculator with instant 1-tap Credit entry creation. | Eliminates manual double-entry when paying for groups |
| **Income Tracking & Cashflow** | Income ledger (salary, freelance, investments) with Monthly Net Cashflow and Savings Rate %. | Complete view of net monthly liquidity & wealth generation |
| **30-Day Cashflow Runway** | Average daily burn rate, projected fixed outflows, and subscription price-hike detection. | Proactive financial forecasting and runaway inflation defense |

---

## Key Features & Superpowers

### 1. Full Category Customization & 120+ Icon Library
- **Order & Hierarchy Control**: Reorder categories up and down to match your spending frequency.
- **Default Category Removal & Restoration**: Hide or remove default categories you don't need, with a 1-tap "Restore Removed Defaults" safeguard.
- **120+ Searchable Icons**: Broad coverage across Food, Transit, Housing, Shopping, Tech, Wellness, Entertainment, Office, Pets, and Travel.
- **Zero-Latency Performance**: Backed by a synchronous in-memory category cache to eliminate rendering delay or badge flickers.

### 2. Smart Auto-Categorization & Category Budget Warnings
- **Merchant Matcher**: Typing "Uber", "Starbucks", "Netflix", or "Pharmacy" instantly switches to the appropriate category.
- **Per-Category Threshold Alerts**: When reaching 80% or 100% of a specific category's allocated budget, high-priority alerts notify you proactively.

### 3. Split Bills with Friends
- **Integrated in Add Expense**: Toggle "Split this expense with friends?" during spending logging.
- **Flexible Splitting**: Split equally across $N$ people or assign precise custom amounts.
- **Automated Ledger Generation**: Your share is added to Daily Spending, and individual Credit items ("Owed to You") are automatically generated for each friend with counterparty names and notes.

### 4. Smart Receipt Scanner & Visual Photo Gallery
- **Pattern-Based Extractor**: Analyzes receipt text patterns to automatically fill merchant name, total price, and transaction date.
- **Visual Receipt Gallery**: A dedicated high-performance image grid allowing you to browse all captured receipts with full-screen zoom and metadata inspect.

### 5. Income Tracking & Real Net Cashflow Dashboard
- **Comprehensive Income Logging**: Track Salary, Freelance, Dividends, Reimbursements, and Gifts with recurring toggles.
- **Net Cashflow Hero Card**: Real-time calculation of Monthly Net Cashflow (Income - Spending - Subscriptions).
- **Savings Rate %**: Live percentage of income saved each month with dynamic color grading.

### 6. 30-Day Cashflow Runway & Subscription Price-Hike Detection
- **Cash Runway Forecast**: Computes your daily burn rate over the trailing 30 days and projects fixed recurring outflows (debts + subscriptions).
- **Price-Hike Detection Engine**: Flags subscriptions whose renewal price exceeds previous charges, guarding against silent fee increases.

---

## Build & Validation

- **App Version**: `2.11.0`
- **Android Version Code**: `33`
- **iOS Build Number**: `2.11.0`
- **TypeScript Verification**: 0 errors (`tsc --noEmit` exit code 0).
- **Target Platforms**: Android (APK / AAB) and iOS.
- **Schema & Persistence**: Fully backwards-compatible with automatic migration for customized categories.
