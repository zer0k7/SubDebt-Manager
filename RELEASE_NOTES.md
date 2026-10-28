# SubDebt Manager v2.15.1

### Release Metadata

| Attribute | Specification |
| :--- | :--- |
| Version | `2.15.1` |
| Build Code | `41` |
| Architecture | `arm64-v8a` |
| Package | `com.subdebt.app` |

### Commits in This Release

| Hash | Type | Summary |
| :--- | :--- | :--- |
| `71c7a27` | fix | Fix tab switch header flash and raw title text layout shift |
| `7ec13c3` | feat | Overhaul theme with pure OLED AMOLED black palette |
| `5410638` | fix | Resolve number overflow and chart layout clipping across device widths |

### Technical Highlights

1. **Pure AMOLED Black Palette**: Canvas `background.primary` converted to `#000000` with deep dark surfaces (`#0A0A0F`), high-contrast slate text tokens, and dark PDF exports. Murky purple mesh haze removed.
2. **Synchronous Header Mounting**: `FloatingTopHeader` now mounts on initial frame across Daily Spending, Ledger, Debts, Credits, and Subscriptions. Eliminated raw unstyled text fallback and visual pop-in.
3. **Adaptive Card Layouts**: Enforced flex bounds, auto-scaling typography (`minimumFontScale=0.6`), and single-line constraints to prevent numbers and badges from overflowing on narrow viewports.
4. **Unified Insets**: Standardized `edges={['top']}` across all tab containers for consistent status bar alignment.
