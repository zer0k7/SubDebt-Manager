# SubDebt Manager v2.20.0

### Release Metadata

| Attribute | Specification |
| :--- | :--- |
| Version | `2.20.0` |
| Build Code | `46` |
| Release Date | `05-Nov-2026` |
| Architecture | `arm64-v8a` |
| Package | `com.subdebt.app` |

### Key Additions

| Component | Scope | Function |
| :--- | :--- | :--- |
| Encrypted Cloud Vault | Data Security | Password protection with PBKDF2 key derivation and AES-256-GCM encryption |
| Google Drive Sync Flow | Data Storage | Direct storage linking via Storage Access Framework for automated cloud mirroring |
| Cloud Restore Engine | Data Migration | Direct restoration of encrypted and standard ledger backups from Google Drive |
| App Switcher Privacy Shield | System Privacy | Automatic balance and ledger obscuration during multitasking and task switching |
| Snapshot Notification Fix | Reliability | Corrected backup alerts to eliminate false positives when no storage folder is linked |

### Release Highlights

1. **AES-256 Cloud Vault Encryption**: Password-protect ledger exports and automated snapshots using PBKDF2 key derivation (100,000 rounds) and AES-256-GCM authenticated encryption.
2. **Google Drive and Cloud Sync**: Connect cloud storage folders using Android Storage Access Framework for automated off-device backup mirroring.
3. **One-Tap Cloud Restore**: Restore ledger databases and preferences directly from Google Drive or local storage on clean installations.
4. **Recent Apps Privacy Shield**: Automatically obscure account balances and ledger entries when switching applications or viewing Android multitasking cards.
5. **Accurate Backup Notifications**: Ensure backup completion alerts only fire when snapshots are successfully mirrored to external storage.
