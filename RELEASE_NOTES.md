# SubDebt Manager 2.14.2

## Overview

Version 2.14.2 resolves layout overflow, badge clipping, and text wrapping across the Home Dashboard, Daily Spending screen, and summary cards on various Android screen sizes and font scales.

| Detail | Value |
| :--- | :--- |
| Version | 2.14.2 |
| Version Code | 39 |
| Target Platform | Android |
| Package Identifier | com.subdebt.app |

## Key Updates

### 1. Home Dashboard Layout and Cashflow

1. Cashflow Card Header: Compacted action buttons and enforced flex bounds so snapshot and income actions stay within the card boundary on compact screens.
2. Cashflow Statistics: Added single-line auto-scale typography across income inflow, total outflow, and net savings to avoid multi-line number breaks.
3. Daily Burn Projection: Rounded burn rate calculations and applied auto-scale constraints to prevent decimal overflow.
4. Financial Pulse Cards: Restricted metric values and daily average pill badges within card limits with auto-scaling font sizes.
5. Alerts and Limits: Applied flex boundaries to upcoming payment alerts and category spending limits.

### 2. Spending Trend Chart Layout

1. Header Restructuring: Separated the period title and trend percentage badge into a dedicated top row to prevent horizontal badge clipping.
2. Responsive Typography: Added automatic font scaling and single-line constraints to total and daily average metrics to accommodate large figures without clipping.
3. Chart Dimension Alignment: Recalculated bar widths and offsets to stay within card margins on narrower displays.

### 3. Daily Spending Dashboard Responsiveness

1. Quick Stat Cards: Added auto-scaling text constraints to today, weekly, monthly, and yearly overview cards to avoid multi-line number breaks.
2. Budget and Insight Containers: Enforced flex boundary constraints on category limits and highest spending day insights to prevent overflow outside container cards.
3. Category Breakdown: Enforced flex bounds on category name labels and amount values to preserve proper spacing on all viewport widths.
4. Heatmap Margin Alignment: Restored uniform horizontal margin to the spending calendar heatmap to align with surrounding cards.
5. Smart Insights Alignment: Enforced flex constraints and text scaling across top expenses and projected totals.

### 4. Cross-Tab Hero Cards

1. Debts and Credits: Applied single-line auto-scaling and flex constraints to borrowed and pending summary cards.
2. Subscriptions: Enforced flex constraints and overflow containment on burn rate and billing cards.
