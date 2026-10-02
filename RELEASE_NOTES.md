# SubDebt Manager 2.13.0

## Overview

Version 2.13.0 introduces an ergonomic radial satellite action menu, historical monthly financial statements with selectable card themes, subscription cancellation guidance, Google Play Store storage compliance, and dual package releases.

| Detail | Value |
| :--- | :--- |
| Version | 2.13.0 |
| Version Code | 36 |
| Target Platform | Android |
| Package Identifier | com.subdebt.app |

## Key Updates

### 1. Radial Satellite Action Menu

The bottom center action button opens a radial menu designed for natural single hand thumb reach.

1. Radial Motion: Four action buttons expand upward in an arc with tactile vibration.
2. Quick Navigation: Direct buttons for logging transactions, subscriptions, debts, and credits.
3. Fluid Physics: Interactive spring transitions with back press dismissal.

### 2. Financial Snapshot Historical Selector and Themes

The Financial Snapshot card generates statements for previous calendar months stored in the local database.

1. Historical Selector: Select any stored month to review historical revenue, expenses, and savings rates.
2. Six Visual Themes: Choose between Emerald Luxe, Obsidian Neon, Royal Amethyst, Sunset Crimson, Sapphire Azure, and Titanium Frost.
3. Privacy Mode: Hide financial numbers with a single tap before sharing.
4. Image Export: Generates high resolution statement images through the standard system share menu.

### 3. Subscription Cancellation Assistant

An integrated helper guides users through ending recurring paid subscriptions.

1. Official Cancellation Links: Direct links to official cancellation pages for services like Google Play, Apple, Netflix, Spotify, Amazon Prime, YouTube, Disney+, ChatGPT, GitHub, and Adobe.
2. Prefilled Notice Generator: Creates standard cancellation letters with account information ready to copy and send to support teams.
3. Status Tracking: Mark subscriptions as inactive to silence renewal reminders and update monthly expense totals.

### 4. Google Play Store Compliance

The application storage architecture follows current Google Play privacy requirements.

1. Scoped Storage: The app no longer requests READ_EXTERNAL_STORAGE or WRITE_EXTERNAL_STORAGE. All imports and exports use isolated application cache and the system document picker.
2. Android Photo Picker: Receipts are selected through the native Android system photo picker without broad file access.
3. Streamlined Permissions: Only the camera permission remains to allow users to take receipt photos.
4. Direct Store Links: The update verification system directs users to the Google Play Store entry.

### 5. Fast Launch Canvas

The startup sequence opens cleanly with no visual delay.

1. Unified Canvas: The startup background matches the dark theme canvas color to eliminate white screen flashes.
2. Quick Start: The app loads local databases and enters the dashboard immediately.

### 6. Dual Release Packaging

The automated build pipeline produces both package formats on release.

1. Android App Bundle: AAB package formatted for Google Play Store upload.
2. Release APK: Standalone package formatted for direct installation on Android devices.
