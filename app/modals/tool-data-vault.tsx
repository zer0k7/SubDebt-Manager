import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { AmbientBackground } from '../../components/AmbientBackground';
import { exportDatabaseBackup, importDatabaseBackup, importEncryptedPayload, exportSpendingCSV } from '../../utils/backupRestore';
import { ImportResult } from '../../utils/importData';
import { MasterPasswordModal } from '../../components/MasterPasswordModal';
import {
  createVaultSnapshot,
  listVaultSnapshots,
  restoreVaultSnapshot,
  deleteVaultSnapshot,
  shareVaultSnapshot,
  pickPublicBackupFolder,
  getPublicBackupFolderInfo,
  clearPublicBackupFolder,
  exportSnapshotToPhoneFolder,
  VaultSnapshotItem,
} from '../../utils/vaultSnapshots';
import { storage } from '../../storage/mmkv';
import { STORAGE_KEYS } from '../../storage/keys';
import { AppPopup } from '../../components/AppPopup';

export default function DataVaultToolScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [autoSnapshotEnabled, setAutoSnapshotEnabled] = useState(true);
  const [snapshots, setSnapshots] = useState<VaultSnapshotItem[]>([]);
  const [publicFolder, setPublicFolder] = useState<{ uri: string | null; name: string | null }>({ uri: null, name: null });

  const [encryptedBackupsEnabled, setEncryptedBackupsEnabled] = useState(false);
  const [hasMasterPassword, setHasMasterPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalMode, setPasswordModalMode] = useState<'setup' | 'decrypt'>('setup');
  const [passwordModalError, setPasswordModalError] = useState('');
  const [pendingDecryptTarget, setPendingDecryptTarget] = useState<{
    type: 'snapshot' | 'external';
    pathOrContent: string;
    mode: 'merge' | 'replace';
  } | null>(null);

  const [popupConfig, setPopupConfig] = useState<any>(null);
  const showPopup = (config: any) => setPopupConfig(config);
  const closePopup = () => setPopupConfig(null);

  const loadVaultData = useCallback(async () => {
    try {
      const enabledRaw = await storage.getString(STORAGE_KEYS.AUTO_SNAPSHOT_ENABLED);
      setAutoSnapshotEnabled(enabledRaw === null ? true : enabledRaw === 'true');

      const folderInfo = await getPublicBackupFolderInfo();
      setPublicFolder(folderInfo);

      const encRaw = await storage.getString(STORAGE_KEYS.ENCRYPTED_BACKUPS_ENABLED);
      setEncryptedBackupsEnabled(encRaw === 'true');
      const pass = await storage.getString(STORAGE_KEYS.BACKUP_MASTER_PASSWORD);
      setHasMasterPassword(Boolean(pass && pass.length >= 6));

      const list = await listVaultSnapshots();
      setSnapshots(list);
    } catch (err) {
      console.warn('Error loading vault data:', err);
    }
  }, []);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  const handleToggleAutoSnapshot = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAutoSnapshotEnabled(value);
    await storage.set(STORAGE_KEYS.AUTO_SNAPSHOT_ENABLED, value ? 'true' : 'false');
  };

  const handlePickFolder = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS !== 'android') {
      showPopup({
        title: 'File Manager Storage',
        message: 'On iOS, backup files can be saved directly via the Share button into the Files app or iCloud.',
        icon: 'information-circle-outline',
        iconColor: colors.accent.blue,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
      return;
    }

    const result = await pickPublicBackupFolder();
    if (result.granted && result.folderName) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadVaultData();
      showPopup({
        title: 'Backup Folder Linked',
        message: `Linked folder: "${result.folderName}". All future snapshots will be saved directly into this folder so they appear in your phone's File Manager.`,
        icon: 'folder-outline',
        iconColor: colors.accent.green,
        confirmText: 'Done',
        onConfirm: closePopup,
      });
    } else if (result.error && result.error !== 'Folder selection was cancelled or permission was denied.') {
      showPopup({
        title: 'Folder Selection Failed',
        message: result.error,
        icon: 'alert-circle-outline',
        iconColor: colors.accent.red,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
    }
  };

  const handleClearFolder = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await clearPublicBackupFolder();
    await loadVaultData();
  };

  const handleCreateSnapshotNow = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const result = await createVaultSnapshot('manual');
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadVaultData();
      const folderNote = result.publicSaved
        ? `\n\nAlso saved directly to your phone's linked folder: ${publicFolder.name || 'File Manager'}.`
        : `\n\nSaved to offline vault. (Tip: Link a File Manager folder below to save public copies automatically).`;

      showPopup({
        title: 'Snapshot Created',
        message: `Your ledger snapshot was safely encrypted and saved.\n\nFile: ${result.fileName}${folderNote}`,
        icon: 'checkmark-circle-outline',
        iconColor: colors.accent.green,
        confirmText: 'Great',
        onConfirm: closePopup,
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showPopup({
        title: 'Snapshot Failed',
        message: result.error || 'Could not create vault snapshot file.',
        icon: 'alert-circle-outline',
        iconColor: colors.accent.red,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
    }
  };

  const handleSaveSnapshotToPhone = async (snapshot: VaultSnapshotItem) => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await exportSnapshotToPhoneFolder(snapshot.filePath, snapshot.fileName);
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadVaultData();
      showPopup({
        title: 'Saved to Phone Storage',
        message: `Snapshot "${snapshot.fileName}" is now available in your phone's File Manager.`,
        icon: 'checkmark-circle-outline',
        iconColor: colors.accent.green,
        confirmText: 'Done',
        onConfirm: closePopup,
      });
    } else if (result.error && result.error !== 'No folder selected.') {
      showPopup({
        title: 'Export Failed',
        message: result.error,
        icon: 'alert-circle-outline',
        iconColor: colors.accent.red,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
    }
  };

  const handleSaveAllToPhone = async () => {
    if (snapshots.length === 0) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let savedCount = 0;
    for (const snap of snapshots) {
      const res = await exportSnapshotToPhoneFolder(snap.filePath, snap.fileName);
      if (res.success) savedCount++;
    }
    setLoading(false);

    if (savedCount > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showPopup({
        title: 'Export Complete',
        message: `Successfully copied ${savedCount} snapshot(s) to your phone's storage folder.`,
        icon: 'checkmark-circle-outline',
        iconColor: colors.accent.green,
        confirmText: 'Great',
        onConfirm: closePopup,
      });
    }
  };

  const handleToggleEncryption = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (value && !hasMasterPassword) {
      setPasswordModalMode('setup');
      setPasswordModalError('');
      setShowPasswordModal(true);
      return;
    }
    setEncryptedBackupsEnabled(value);
    await storage.set(STORAGE_KEYS.ENCRYPTED_BACKUPS_ENABLED, value ? 'true' : 'false');
  };

  const handleSaveMasterPassword = async (pass: string) => {
    await storage.set(STORAGE_KEYS.BACKUP_MASTER_PASSWORD, pass);
    await storage.set(STORAGE_KEYS.ENCRYPTED_BACKUPS_ENABLED, 'true');
    setHasMasterPassword(true);
    setEncryptedBackupsEnabled(true);
    setShowPasswordModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showPopup({
      title: 'Master Password Active',
      message: 'AES-256-GCM encryption is now enabled. All new vault snapshots and shared backups will be encrypted with your password.',
      icon: 'shield-checkmark-outline',
      iconColor: colors.accent.green,
      confirmText: 'Done',
      onConfirm: closePopup,
    });
  };

  const handleDisableMasterPassword = async () => {
    await storage.set(STORAGE_KEYS.ENCRYPTED_BACKUPS_ENABLED, 'false');
    await storage.delete(STORAGE_KEYS.BACKUP_MASTER_PASSWORD);
    setHasMasterPassword(false);
    setEncryptedBackupsEnabled(false);
    setShowPasswordModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (passwordModalMode === 'setup') {
      await handleSaveMasterPassword(password);
      return;
    }

    if (!pendingDecryptTarget) return;
    setLoading(true);
    let result: ImportResult;
    if (pendingDecryptTarget.type === 'snapshot') {
      result = await restoreVaultSnapshot(pendingDecryptTarget.pathOrContent, pendingDecryptTarget.mode, password);
    } else {
      result = await importEncryptedPayload(pendingDecryptTarget.pathOrContent, password, pendingDecryptTarget.mode);
    }
    setLoading(false);

    if (result.success) {
      setShowPasswordModal(false);
      setPendingDecryptTarget(null);
      setPasswordModalError('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const total =
        result.subscriptionsCount +
        result.debtsCount +
        result.creditsCount +
        result.spendingCount +
        result.categoriesCount +
        (result.incomeCount || 0) +
        (result.accountsCount || 0) +
        (result.accountTransactionsCount || 0);
      showPopup({
        title: 'Vault Restored Successfully',
        message: `Decrypted and restored ${total} records across all tabs.`,
        icon: 'checkmark-circle-outline',
        iconColor: colors.accent.green,
        confirmText: 'Done',
        onConfirm: closePopup,
      });
      await loadVaultData();
    } else {
      setPasswordModalError(result.error || 'Decryption failed. Please check password.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRestoreSnapshot = (snapshot: VaultSnapshotItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showPopup({
      title: 'Restore Vault Snapshot?',
      message: `Restore data from snapshot (${snapshot.metadata.totalRecords} records)?\n\nChoose 'Merge' to combine with current ledger records, or 'Cancel' to exit.`,
      icon: 'download-outline',
      iconColor: colors.accent.blue,
      confirmText: 'Merge Records',
      cancelText: 'Cancel',
      onCancel: closePopup,
      onConfirm: async () => {
        closePopup();
        setLoading(true);
        const result = await restoreVaultSnapshot(snapshot.filePath, 'merge');
        setLoading(false);

        if (result.isEncrypted && result.error === 'ENCRYPTED_VAULT_PASSWORD_REQUIRED') {
          setPendingDecryptTarget({ type: 'snapshot', pathOrContent: snapshot.filePath, mode: 'merge' });
          setPasswordModalMode('decrypt');
          setPasswordModalError('');
          setShowPasswordModal(true);
          return;
        }

        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const total =
            result.subscriptionsCount +
            result.debtsCount +
            result.creditsCount +
            result.spendingCount +
            result.categoriesCount +
            (result.incomeCount || 0) +
            (result.accountsCount || 0) +
            (result.accountTransactionsCount || 0);
          showPopup({
            title: 'Vault Restored Successfully',
            message: `Restored ${total} entries and app preferences from snapshot ${snapshot.fileName}.`,
            icon: 'checkmark-circle-outline',
            iconColor: colors.accent.green,
            confirmText: 'Done',
            onConfirm: closePopup,
          });
        } else {
          showPopup({
            title: 'Restore Failed',
            message: result.error || 'Could not restore snapshot data.',
            icon: 'alert-circle-outline',
            iconColor: colors.accent.red,
            confirmText: 'OK',
            onConfirm: closePopup,
          });
        }
      },
    });
  };

  const handleShareSnapshot = async (snapshot: VaultSnapshotItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await shareVaultSnapshot(snapshot.filePath, snapshot.fileName);
  };

  const handleDeleteSnapshot = (snapshot: VaultSnapshotItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    showPopup({
      title: 'Delete Snapshot?',
      message: `Are you sure you want to permanently delete this snapshot (${snapshot.fileName})?`,
      icon: 'trash-outline',
      iconColor: colors.accent.red,
      cancelText: 'Cancel',
      confirmText: 'Delete',
      isDestructive: true,
      onCancel: closePopup,
      onConfirm: async () => {
        closePopup();
        setLoading(true);
        await deleteVaultSnapshot(snapshot.filePath);
        await loadVaultData();
        setLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    });
  };

  const handleExportJSON = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await exportDatabaseBackup();
    setLoading(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadVaultData();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showPopup({
        title: 'Export Failed',
        message: 'Could not export JSON backup file.',
        icon: 'alert-circle-outline',
        iconColor: colors.accent.red,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
    }
  };

  const handleImportExternalJSON = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    showPopup({
      title: 'Import External Backup?',
      message: 'Select a JSON backup file (from Google Drive, Downloads, or local files) to restore your offline ledger data.',
      icon: 'download-outline',
      iconColor: colors.accent.blue,
      confirmText: 'Choose File',
      cancelText: 'Cancel',
      isDestructive: false,
      onCancel: closePopup,
      onConfirm: async () => {
        closePopup();
        setLoading(true);
        const result = await importDatabaseBackup('merge');
        setLoading(false);

        if (result.isEncrypted && result.encryptedContent) {
          setPendingDecryptTarget({ type: 'external', pathOrContent: result.encryptedContent, mode: 'merge' });
          setPasswordModalMode('decrypt');
          setPasswordModalError('');
          setShowPasswordModal(true);
          return;
        }

        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const totalRecords =
            result.subscriptionsCount +
            result.debtsCount +
            result.creditsCount +
            result.spendingCount +
            result.categoriesCount +
            (result.incomeCount || 0) +
            (result.accountsCount || 0) +
            (result.accountTransactionsCount || 0);
          showPopup({
            title: 'Vault Restored',
            message: `Successfully imported ${totalRecords} records across all tabs and restored your settings.`,
            icon: 'checkmark-circle-outline',
            iconColor: colors.accent.green,
            confirmText: 'Done',
            onConfirm: closePopup,
          });
          await loadVaultData();
        } else if (!result.cancelled && result.error) {
          showPopup({
            title: 'Import Failed',
            message: result.error,
            icon: 'alert-circle-outline',
            iconColor: colors.accent.red,
            confirmText: 'OK',
            onConfirm: closePopup,
          });
        }
      },
    });
  };

  const handleExportCSV = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let entries: any[] = [];
    let currencyCode = 'INR';
    try {
      const rawSpending = await storage.getString(STORAGE_KEYS.DAILY_SPENDING);
      if (rawSpending) entries = JSON.parse(rawSpending);
      const savedCurrency = await storage.getString(STORAGE_KEYS.CURRENCY);
      if (savedCurrency) currencyCode = savedCurrency;
    } catch (err) {}

    const success = await exportSpendingCSV(entries, currencyCode);
    setLoading(false);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showPopup({
        title: 'Export Failed',
        message: 'Unable to generate CSV spreadsheet.',
        icon: 'alert-circle-outline',
        iconColor: colors.accent.red,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
    }
  };

  const formatSnapshotDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Data Vault & Backup</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBox}>
          <View style={styles.heroIconBox}>
            <Ionicons name="shield-checkmark" size={32} color={colors.accent.blue} />
          </View>
          <Text style={styles.heroTitle}>Offline Data Vault</Text>
          <Text style={styles.heroSubtitle}>
            Offline financial ledger snapshots with optional AES-256 PBKDF2 encryption and Google Drive / cloud storage sync.
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.accent.blue} />
            <Text style={styles.loadingText}>Processing vault operation...</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>GOOGLE DRIVE & CLOUD SYNC</Text>
        <View style={styles.scheduledCard}>
          <View style={styles.scheduledHeader}>
            <View style={[styles.scheduledIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="cloud-outline" size={22} color={colors.accent.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduledTitle}>Google Drive & Storage Sync</Text>
              <Text style={styles.scheduledDesc}>
                Link a Google Drive folder or device folder. Auto-snapshots sync directly so you can restore your data across devices.
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: publicFolder.name ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
            <Ionicons
              name={publicFolder.name ? 'checkmark-circle' : 'alert-circle'}
              size={13}
              color={publicFolder.name ? colors.accent.green : colors.accent.amber}
            />
            <Text style={[styles.statusBadgeText, { color: publicFolder.name ? colors.accent.green : colors.accent.amber }]}>
              {publicFolder.name ? `Linked Folder: ${publicFolder.name}` : 'Not Linked (Sandbox Only)'}
            </Text>
          </View>

          <View style={styles.folderBtnRow}>
            <TouchableOpacity style={styles.folderPickerBtn} onPress={handlePickFolder} activeOpacity={0.8}>
              <Ionicons name="folder-open-outline" size={16} color={colors.accent.blue} />
              <Text style={styles.folderPickerBtnText}>
                {publicFolder.name ? 'Change Folder' : 'Link Google Drive / Folder'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cloudRestoreBtn} onPress={handleImportExternalJSON} activeOpacity={0.8}>
              <Ionicons name="download-outline" size={16} color={colors.accent.green} />
              <Text style={styles.cloudRestoreBtnText}>Restore from Drive</Text>
            </TouchableOpacity>

            {publicFolder.name && (
              <TouchableOpacity style={styles.clearFolderBtn} onPress={handleClearFolder} activeOpacity={0.8}>
                <Ionicons name="close-circle-outline" size={16} color={colors.text.muted} />
                <Text style={styles.clearFolderBtnText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.sectionLabel}>ENCRYPTED CLOUD VAULT</Text>
        <View style={styles.scheduledCard}>
          <View style={styles.scheduledHeader}>
            <View style={[styles.scheduledIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.accent.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduledTitle}>AES-256 Vault Encryption</Text>
              <Text style={styles.scheduledDesc}>
                Password-protect all exports and auto-snapshots with PBKDF2 (100,000 rounds) + AES-256-GCM.
              </Text>
            </View>
            <Switch
              value={encryptedBackupsEnabled}
              onValueChange={handleToggleEncryption}
              trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', true: colors.accent.green }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.statusBadge, { backgroundColor: encryptedBackupsEnabled ? 'rgba(16, 185, 129, 0.15)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') }]}>
            <Ionicons
              name={encryptedBackupsEnabled ? 'shield-checkmark' : 'shield-outline'}
              size={13}
              color={encryptedBackupsEnabled ? colors.accent.green : colors.text.muted}
            />
            <Text style={[styles.statusBadgeText, { color: encryptedBackupsEnabled ? colors.accent.green : colors.text.muted }]}>
              {encryptedBackupsEnabled ? 'Vault Encryption Active' : 'Unencrypted Standard Backups'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.configPasswordBtn}
            onPress={() => {
              setPasswordModalMode('setup');
              setPasswordModalError('');
              setShowPasswordModal(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="key-outline" size={15} color={colors.accent.blue} />
            <Text style={styles.configPasswordBtnText}>
              {hasMasterPassword ? 'Change Master Password' : 'Set Master Password'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>AUTOMATED VAULT SNAPSHOTS</Text>
        <View style={styles.scheduledCard}>
          <View style={styles.scheduledHeader}>
            <View style={styles.scheduledIconBox}>
              <Ionicons name="timer-outline" size={22} color={colors.accent.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduledTitle}>Daily Auto-Snapshot</Text>
              <Text style={styles.scheduledDesc}>
                Automatically backs up all subscriptions, debts, credits & spending logs daily at 10:00 PM IST (with missed catch-up upon opening).
              </Text>
            </View>
            <Switch
              value={autoSnapshotEnabled}
              onValueChange={handleToggleAutoSnapshot}
              trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', true: colors.accent.purple }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.scheduleDivider} />

          <View style={styles.scheduleInfoRow}>
            <View style={styles.schedulePill}>
              <Ionicons name="time" size={13} color={colors.accent.purple} />
              <Text style={styles.schedulePillText}>Schedule: Daily @ 10:00 PM IST</Text>
            </View>
            <View style={styles.schedulePill}>
              <Ionicons name="folder" size={13} color={colors.accent.blue} />
              <Text style={styles.schedulePillText} numberOfLines={1}>
                {publicFolder.name ? `Folder: ${publicFolder.name}` : 'Storage: App Sandbox (Hidden by Android)'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.snapshotNowBtn}
            onPress={handleCreateSnapshotNow}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
            <Text style={styles.snapshotNowText}>Take Vault Snapshot Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionLabel}>SAVED VAULT SNAPSHOTS ({snapshots.length})</Text>
          {snapshots.length > 0 && (
            <TouchableOpacity onPress={handleSaveAllToPhone} activeOpacity={0.7}>
              <Text style={styles.exportAllLink}>Export All to Storage</Text>
            </TouchableOpacity>
          )}
        </View>

        {snapshots.length === 0 ? (
          <View style={styles.emptySnapshotCard}>
            <Ionicons name="archive-outline" size={32} color={colors.text.muted} />
            <Text style={styles.emptySnapshotTitle}>No Snapshots Created Yet</Text>
            <Text style={styles.emptySnapshotDesc}>
              Tap "Take Vault Snapshot Now" or let SubDebt auto-backup your data every night at 10:00 PM.
            </Text>
          </View>
        ) : (
          <View style={styles.snapshotList}>
            {snapshots.map((item) => (
              <View key={item.id} style={styles.snapshotItemCard}>
                <View style={styles.snapshotItemTop}>
                  <View style={styles.snapshotDateRow}>
                    <Ionicons
                      name={item.metadata.triggerType === 'auto' ? 'alarm-outline' : 'shield-checkmark-outline'}
                      size={16}
                      color={item.metadata.triggerType === 'auto' ? colors.accent.purple : colors.accent.blue}
                    />
                    <Text style={styles.snapshotDateText}>{formatSnapshotDate(item.createdAt)}</Text>
                    <View style={[styles.triggerBadge, { backgroundColor: item.metadata.triggerType === 'auto' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)' }]}>
                      <Text style={[styles.triggerBadgeText, { color: item.metadata.triggerType === 'auto' ? colors.accent.purple : colors.accent.blue }]}>
                        {item.metadata.triggerType === 'auto' ? 'Auto 10PM' : 'Manual'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.snapshotSizeText}>{item.sizeFormatted}</Text>
                </View>

                <View style={styles.snapshotStatsRow}>
                  <Text style={styles.snapshotMetaText}>
                    {item.metadata.totalRecords} records ({item.metadata.dailySpending} expenses · {item.metadata.debts + item.metadata.credits} debts · {item.metadata.subscriptions} subs)
                  </Text>
                </View>

                <View style={styles.snapshotActionsRow}>
                  <TouchableOpacity
                    style={styles.snapshotActionBtn}
                    onPress={() => handleRestoreSnapshot(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh-outline" size={14} color={colors.accent.blue} />
                    <Text style={[styles.snapshotActionText, { color: colors.accent.blue }]}>Restore</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.snapshotActionBtn}
                    onPress={() => handleSaveSnapshotToPhone(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="save-outline" size={14} color={colors.accent.green} />
                    <Text style={[styles.snapshotActionText, { color: colors.accent.green }]}>Save to Phone</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.snapshotActionBtn}
                    onPress={() => handleShareSnapshot(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-outline" size={14} color={colors.text.secondary} />
                    <Text style={[styles.snapshotActionText, { color: colors.text.secondary }]}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.snapshotActionBtn}
                    onPress={() => handleDeleteSnapshot(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.accent.red} />
                    <Text style={[styles.snapshotActionText, { color: colors.accent.red }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>EXTERNAL ACTIONS</Text>

        <TouchableOpacity style={styles.actionCard} onPress={handleExportJSON} activeOpacity={0.8} disabled={loading}>
          <View style={[styles.actionIconBox, { backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.15) : 'rgba(79, 195, 247, 0.15)' }]}>
            <Ionicons name="cloud-upload-outline" size={22} color={colors.accent.blue} />
          </View>
          <View style={styles.actionMeta}>
            <Text style={styles.actionTitle}>Share Full Backup File</Text>
            <Text style={styles.actionDesc}>Export JSON backup file to WhatsApp, Drive, email, or device storage.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleImportExternalJSON} activeOpacity={0.8} disabled={loading}>
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(102, 187, 106, 0.15)' }]}>
            <Ionicons name="cloud-download-outline" size={22} color={colors.accent.green} />
          </View>
          <View style={styles.actionMeta}>
            <Text style={styles.actionTitle}>Import External Backup</Text>
            <Text style={styles.actionDesc}>Select a `.json` backup file from Files / Drive to restore records.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleExportCSV} activeOpacity={0.8} disabled={loading}>
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(255, 183, 77, 0.15)' }]}>
            <Ionicons name="stats-chart-outline" size={22} color={colors.accent.amber} />
          </View>
          <View style={styles.actionMeta}>
            <Text style={styles.actionTitle}>Export Spending CSV</Text>
            <Text style={styles.actionDesc}>Generate an Excel/Sheets-compatible CSV spreadsheet of daily expenses.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>

        <View style={styles.privacyCard}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.accent.blue} />
          <Text style={styles.privacyText}>
            SubDebt Manager runs 100% offline. All snapshots are stored locally on your device without any cloud dependency.
          </Text>
        </View>
      </ScrollView>

      <AppPopup
        visible={!!popupConfig}
        title={popupConfig?.title || ''}
        message={popupConfig?.message || ''}
        icon={popupConfig?.icon}
        iconColor={popupConfig?.iconColor}
        confirmText={popupConfig?.confirmText || 'OK'}
        cancelText={popupConfig?.cancelText}
        isDestructive={popupConfig?.isDestructive || false}
        onConfirm={popupConfig?.onConfirm || closePopup}
        onCancel={popupConfig?.onCancel || closePopup}
      />

      <MasterPasswordModal
        visible={showPasswordModal}
        mode={passwordModalMode}
        onClose={() => {
          setShowPasswordModal(false);
          setPendingDecryptTarget(null);
          setPasswordModalError('');
        }}
        onSubmit={handlePasswordSubmit}
        onDisable={handleDisableMasterPassword}
        error={passwordModalError}
        hasExistingPassword={hasMasterPassword}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.primary },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.glass.cardBorder,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.glass.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
    content: { padding: 20, paddingBottom: 40 },
    heroBox: {
      alignItems: 'center',
      backgroundColor: colors.glass.card,
      borderRadius: 20,
      padding: 22,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      marginBottom: 20,
    },
    heroIconBox: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: 'rgba(79, 195, 247, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    heroTitle: { fontSize: 19, fontWeight: '800', color: colors.text.primary, marginBottom: 5 },
    heroSubtitle: { fontSize: 12.5, color: colors.text.secondary, textAlign: 'center', lineHeight: 18 },
    loadingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      padding: 12,
      backgroundColor: colors.glass.card,
      borderRadius: 14,
      marginBottom: 16,
    },
    loadingText: { fontSize: 13, fontWeight: '600', color: colors.accent.blue },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.text.muted,
      letterSpacing: 0.8,
      marginBottom: 10,
      marginLeft: 4,
    },
    scheduledCard: {
      backgroundColor: colors.glass.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      marginBottom: 20,
      gap: 12,
    },
    scheduledHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    scheduledIconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: 'rgba(168, 85, 247, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scheduledTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 2,
    },
    scheduledDesc: {
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 16,
    },
    scheduleDivider: {
      height: 0.5,
      backgroundColor: colors.glass.cardBorder,
      marginVertical: 2,
    },
    scheduleInfoRow: {
      gap: 6,
    },
    schedulePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
    },
    schedulePillText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    folderPickerCard: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
      gap: 6,
    },
    folderPickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    folderPickerTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.text.primary,
    },
    folderPickerDesc: {
      fontSize: 11.5,
      color: colors.text.secondary,
      lineHeight: 16,
    },
    folderBtnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    folderPickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: colors.accent.blue,
    },
    folderPickerBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent.blue,
    },
    cloudRestoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: colors.accent.green,
    },
    cloudRestoreBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent.green,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    configPasswordBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: colors.accent.blue,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    configPasswordBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent.blue,
    },
    clearFolderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    clearFolderBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.muted,
    },
    snapshotNowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent.purple,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 4,
    },
    snapshotNowText: {
      color: '#FFFFFF',
      fontSize: 13.5,
      fontWeight: '700',
    },
    historyHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
      paddingRight: 4,
    },
    exportAllLink: {
      fontSize: 11.5,
      color: colors.accent.blue,
      fontWeight: '700',
    },
    emptySnapshotCard: {
      alignItems: 'center',
      padding: 24,
      borderRadius: 16,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 6,
      marginBottom: 16,
    },
    emptySnapshotTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.secondary,
      marginTop: 4,
    },
    emptySnapshotDesc: {
      fontSize: 12,
      color: colors.text.muted,
      textAlign: 'center',
      lineHeight: 16,
    },
    snapshotList: {
      gap: 10,
      marginBottom: 16,
    },
    snapshotItemCard: {
      backgroundColor: colors.glass.card,
      borderRadius: 16,
      padding: 14,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 8,
    },
    snapshotItemTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    snapshotDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    snapshotDateText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text.primary,
    },
    triggerBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    triggerBadgeText: {
      fontSize: 9.5,
      fontWeight: '800',
    },
    snapshotSizeText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.text.muted,
    },
    snapshotStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    snapshotMetaText: {
      fontSize: 11.5,
      color: colors.text.secondary,
    },
    snapshotActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: colors.glass.cardBorder,
      flexWrap: 'wrap',
    },
    snapshotActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    snapshotActionText: {
      fontSize: 11,
      fontWeight: '700',
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.glass.card,
      borderRadius: 16,
      padding: 15,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      marginBottom: 10,
      gap: 12,
    },
    actionIconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionMeta: { flex: 1 },
    actionTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text.primary, marginBottom: 2 },
    actionDesc: { fontSize: 11.5, color: colors.text.secondary, lineHeight: 15 },
    privacyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.accent.alpha
        ? colors.accent.alpha(isDark ? 0.08 : 0.06)
        : isDark
        ? 'rgba(79, 195, 247, 0.08)'
        : 'rgba(2, 132, 199, 0.06)',
      borderRadius: 14,
      padding: 14,
      marginTop: 8,
      borderWidth: 0.5,
      borderColor: colors.accent.alpha
        ? colors.accent.alpha(isDark ? 0.2 : 0.15)
        : isDark
        ? 'rgba(79, 195, 247, 0.2)'
        : 'rgba(2, 132, 199, 0.15)',
    },
    privacyText: { flex: 1, fontSize: 11.5, color: colors.text.secondary, lineHeight: 16 },
  });
