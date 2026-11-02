# SubDebt Manager v2.18.0

### Release Metadata

| Attribute | Specification |
| :--- | :--- |
| Version | `2.18.0` |
| Build Code | `44` |
| Release Date | `02-Nov-2026` |
| Architecture | `arm64-v8a` |
| Package | `com.subdebt.app` |

### Key Additions

| Component | Scope | Function |
| :--- | :--- | :--- |
| Smart Notification Engine | System Service | Native Android notification architecture with 4 discrete notification channels and granular category toggles |
| Dynamic Schedule Variance | Notification Scheduler | Time variance algorithm with weekday timing variation and weekend schedule shift to prevent repetitive notification alerts |
| Context-Aware Notification Copy | Notification Templates | Dynamic message rotating engine that evaluates logged daily records, remaining allowance, and due dates before dispatch |
| In-App User Handbook & Wiki | Help & Reference Modal | Complete offline operational reference documentation covering all 9 application modules and financial mechanics |
| Real-Time Handbook Search | Wiki Search Engine | Instant keyword search across chapter topics, operational rules, calculation formulas, and storage policies |

### Technical Highlights

1. **Native Android Notification Channels**: Registered 4 dedicated Android system notification channels: Debts & Liabilities, Active Subscriptions, Daily Spending & Budget Caps, and Bank Accounts & Cash Flow. Users can manage or silence individual categories through app settings or native Android system notification settings.
2. **Granular Category Toggles with Instant Cancellation**: Updated settings toggles to trigger targeted cancellation sweeps for specific notification categories immediately upon toggling off. Prevents queued background triggers from firing after a category is disabled.
3. **Dynamic Slot Variance Engine**: Implemented a randomized schedule variance system that applies a plus or minus 15-minute time variation on weekdays and shifts morning reminders forward on weekends. Eliminates mechanical daily alerts.
4. **Context-Driven Notification Evaluation**: Rewrote background daily reminder jobs to evaluate real-time financial states. Morning slot calculates daily available spending allowance or reports zero-debt balance status. Midday slot checks upcoming debt due dates and subscription renewal dates, canceling the alert if no items are due. Evening slot inspects logged transactions and displays transaction counts for logged days or a reminder for unlogged days.
5. **App Lifecycle Notification Rescheduling**: Integrated notification recalculation routines into application cold start and foreground resume events. Notification triggers refresh automatically with updated financial balances whenever the application is opened.
6. **In-App User Handbook & Operational Wiki**: Built a 9-chapter offline documentation engine covering Multi-Bank Accounts, Daily Spending & Bill Splitting, Debts Ledger, Lent Credits Ledger, Subscriptions & Free Trial Tracking, Monthly Budget Caps, Data Vault & Scoped Storage, Smart Notification Engine, and Financial Tools & PDF Exporters.
7. **Offline Handbook Navigation and Search**: Implemented horizontal category selector pills, chapter jump buttons, collapsible chapter cards, structured operational steps, and real-time text query filtering across all handbook content.
8. **Minimalist Settlement Receipt Modernization**: Streamlined debt and credit settlement voucher modal. Removed decorative effects, glowing graphics, and artificial certificate labels, replacing them with standard typography, transaction identifiers, and high-contrast receipt layouts.
