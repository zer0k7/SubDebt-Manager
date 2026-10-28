# SubDebt Manager 2.15.1

## Overview

Version 2.15.1 fixes header flickering and raw title layout clipping during tab navigation by rendering the floating top header synchronously on screen mount across all tab screens.

| Detail | Value |
| :--- | :--- |
| Version | 2.15.1 |
| Version Code | 41 |
| Target Platform | Android |
| Package Identifier | com.subdebt.app |

## Key Updates

### 1. Tab Header Stability

1. Immediate Header Mounting: Moved the floating top header to mount synchronously on initial frame across Daily Spending, Ledger, Debts, Credits, and Subscriptions screens.
2. Removal of Raw Text Fallbacks: Eliminated unstyled early-return header views that caused text to clip beyond screen bounds before content finished loading.
3. In-Place Loading States: Replaced full-screen conditional returns with inline skeleton loaders placed beneath the permanently mounted floating top header.
4. Top Edge Inset Alignment: Configured uniform safe area top edge insets across all tabs to eliminate vertical header displacement during tab switches.
