---
description: Invariants for Android and Google Play app store visual assets
globs: assets/**/*, app.json, **/*.svg
---

# Mobile Asset & Play Store Icon Standards

1. **Google Play Store Listing Icon**:
   - Must be strictly **512 × 512 px**, 32-bit PNG (or master SVG).
   - Must be **100% full-bleed square** (`rx="0"`, `ry="0"` on outer background canvas).
   - Never supply pre-rounded squircles or outer margins on store icons; Google Play dynamically applies its own 20% squircle mask. Pre-rounded icons result in double-margins and look like a tiny "dot" in Play Store listings.

2. **Android Status Bar Notification Icons**:
   - Files: `assets/notification-icon.png` / `assets/notification-icon.svg`.
   - Must be **pure white (`#FFFFFF`) on a 100% transparent background**.
   - Use alpha punch-through masks for interior cutouts (seams, symbols, buttons).
   - Never use full colors in notification status bar assets to prevent solid white box rendering on modern Android versions.

3. **Currency & Monogram Symbols in App Vector Graphics**:
   - Ensure mathematical balance and symmetrical spine alignment for currency emblems (`$`, `€`, `₹`, `£`).
   - Prefer standard high-legibility geometric typography or exact vector paths over manual bezier estimation.
