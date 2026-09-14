# Release Notes — v2.11.0

## TL;DR

SubDebt v2.11.0 is a milestone release introducing **5 Major Financial Superpowers**: **Split Bills with Friends** (with automated debt/credit logging), **Income Tracking & Real Net Cashflow Analytics** (with Savings Rate %), **30-Day Cashflow Runway Forecast & Subscription Price-Hike Detection**, **Pattern-Based Smart Receipt Scanner & Full Visual Gallery**, and **Complete Category Customization** with reordering, default category deletion/restoration, and a library of 120+ categorized icons.

---

## Release Summary

| Module | Change Summary | Impact |
| :--- | :--- | :--- |
| **Category Customization** | Reordering (up/down), remove/hide defaults, edit colors & names, restore defaults. | Complete personalization over spending taxonomy |
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
