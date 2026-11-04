# SubDebt Manager v2.19.0

### Release Metadata

| Attribute | Specification |
| :--- | :--- |
| Version | `2.19.0` |
| Build Code | `45` |
| Release Date | `04-Nov-2026` |
| Architecture | `arm64-v8a` |
| Package | `com.subdebt.app` |

### Key Additions

| Component | Scope | Function |
| :--- | :--- | :--- |
| Google Play In-App Updates | System Service | Native Play Core App-Update API integration triggering in-app Google update sheets directly |
| Centralized Update Mode Switch | Configuration | Centralized mode definition in `constants/updateConfig.ts` with support for flexible and immediate update flows |
| Background Download Banner | UI Component | Non-intrusive floating restart banner notifying users when background download completes |
| R8 Optimization Suite | CI/CD Pipeline | Comprehensive Proguard rules preserving Play Core, Reanimated, ViewShot, and Expo modules with mapping file generation |

### Technical Highlights

1. **Google Play Core App-Update API**: Integrated `sp-react-native-in-app-updates` connected to Google Play Core SDK. Automatically queries Google Play version metadata on launch without remote API servers.
2. **Centralized Update Switch**: Defined `constants/updateConfig.ts` as the single source of truth for update presentation modes. Set to `FLEXIBLE` by default for silent background downloads, switchable to `IMMEDIATE` for mandatory full-screen updates.
3. **Background Download Completion Handshake**: Built `components/UpdateDownloadedBanner.tsx` and `hooks/usePlayInAppUpdate.ts` listening for `DOWNLOADED` installation status events and providing a 1-tap restart trigger.
4. **Dual-Engine Fallback**: Updated manual version checking in settings to attempt Google Play Core first and gracefully fall back to direct GitHub Releases API for sideloaded installations.
5. **R8 Proguard Rules**: Configured keep rules for `com.google.android.play.core.**` and `in.mfl.inappupdates.**` in `.github/workflows/build.yml` to prevent reflection stripping during release minification.
