# SubDebt Manager 2.14.1

## Overview

Version 2.14.1 resolves network communication configuration on Android to ensure reliable currency conversion rate retrieval and stabilizes background service queues.

| Detail | Value |
| :--- | :--- |
| Version | 2.14.1 |
| Version Code | 38 |
| Target Platform | Android |
| Package Identifier | com.subdebt.app |

## Key Updates

### 1. Network Connectivity Configuration

Android application permissions have been updated to restore standard internet access for external service pings and currency exchange rates.

1. System Permission: Added explicit network state and internet declarations to the application configuration.
2. Background Dispatch: Optimized queue dispatch intervals to prevent delayed data synchronization.

### 2. General Stability Fixes

1. Navigation Stability: Resolved minor edge cases in feature discovery coach mark positioning across different device aspect ratios.
2. Maintenance Patches: Verified local storage consistency for transaction receipts.
