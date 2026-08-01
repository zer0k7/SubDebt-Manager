import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { AmbientBackground } from '../../components/AmbientBackground';
import { exportDatabaseBackup, importDatabaseBackup, exportSpendingCSV } from '../../utils/backupRestore';
import { storage } from '../../storage/mmkv';
import { STORAGE_KEYS } from '../../storage/keys';
import { AppPopup } from '../../components/AppPopup';

export default function DataVaultToolScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState<any>({});

  const showPopup = (config: any) => {
    setPopupConfig(config);
    setPopupVisible(true);
  };

  const closePopup = () => setPopupVisible(false);

  const handleExportJSON = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await exportDatabaseBackup();
    setLoading(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showPopup({
        title: 'Backup Created',
        message: 'Your full encrypted JSON ledger backup has been generated and is ready to share or save.',
        icon: 'checkmark-circle-outline',
        iconColor: '#66BB6A',
        confirmText: 'Great',
        onConfirm: closePopup,
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showPopup({
        title: 'Backup Failed',
        message: 'Could not create JSON backup file. Please verify file permissions.',
        icon: 'alert-circle-outline',
        iconColor: colors.accent.red,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
    }
  };

  const handleImportJSON = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    showPopup({
      title: 'Restore Ledger Backup?',
      message: 'Restoring from a JSON file will merge backup records with your current offline ledger data. Do you want to proceed?',
      icon: 'download-outline',
      iconColor: colors.accent.blue,
      confirmText: 'Select Backup File',
      cancelText: 'Cancel',
      isDestructive: false,
      onCancel: closePopup,
      onConfirm: async () => {
        closePopup();
        setLoading(true);
        const result = await importDatabaseBackup('merge');
        setLoading(false);
        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showPopup({
            title: 'Ledger Restored',
            message: `Successfully imported ${result.subscriptionsCount + result.debtsCount + result.creditsCount} records into your offline vault.`,
            icon: 'checkmark-circle-outline',
            iconColor: '#66BB6A',
            confirmText: 'Done',
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
      showPopup({
        title: 'CSV Exported',
        message: 'Your daily spending entries have been compiled into a structured CSV spreadsheet.',
        icon: 'checkmark-circle-outline',
        iconColor: '#66BB6A',
        confirmText: 'Done',
        onConfirm: closePopup,
      });
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
            Create instant offline backups of your subscriptions, debts, and daily spending entries, or restore from a previous JSON backup file.
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.accent.blue} />
            <Text style={styles.loadingText}>Processing vault operation...</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>BACKUP & RESTORE ACTIONS</Text>

        <TouchableOpacity style={styles.actionCard} onPress={handleExportJSON} activeOpacity={0.8} disabled={loading}>
          <View style={[styles.actionIconBox, { backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.15) : 'rgba(79, 195, 247, 0.15)' }]}>
            <Ionicons name="cloud-upload-outline" size={22} color={colors.accent.blue} />
          </View>
          <View style={styles.actionMeta}>
            <Text style={styles.actionTitle}>Create JSON Backup</Text>
            <Text style={styles.actionDesc}>Export your entire ledger (debts, credits, subscriptions, expenses) into a portable JSON backup file.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleImportJSON} activeOpacity={0.8} disabled={loading}>
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(102, 187, 106, 0.15)' }]}>
            <Ionicons name="cloud-download-outline" size={22} color={colors.accent.green} />
          </View>
          <View style={styles.actionMeta}>
            <Text style={styles.actionTitle}>Restore from Backup</Text>
            <Text style={styles.actionDesc}>Import and merge records from an existing SubDebt JSON backup file on your device.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleExportCSV} activeOpacity={0.8} disabled={loading}>
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(255, 183, 77, 0.15)' }]}>
            <Ionicons name="stats-chart-outline" size={22} color={colors.accent.amber} />
          </View>
          <View style={styles.actionMeta}>
            <Text style={styles.actionTitle}>Export Spending CSV</Text>
            <Text style={styles.actionDesc}>Generate a formatted CSV spreadsheet of your daily spending logs for Excel or Google Sheets.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>

        <View style={styles.privacyCard}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.accent.blue} />
          <Text style={styles.privacyText}>
            SubDebt Manager runs 100% offline. All exported files are saved directly to your device storage without external server transfers.
          </Text>
        </View>
      </ScrollView>

      <AppPopup
        visible={popupVisible}
        title={popupConfig.title || ''}
        message={popupConfig.message || ''}
        icon={popupConfig.icon}
        iconColor={popupConfig.iconColor}
        confirmText={popupConfig.confirmText}
        cancelText={popupConfig.cancelText}
        isDestructive={popupConfig.isDestructive}
        onConfirm={popupConfig.onConfirm || closePopup}
        onCancel={popupConfig.onCancel || closePopup}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
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
  content: { padding: 20 },
  heroBox: {
    alignItems: 'center',
    backgroundColor: colors.glass.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    marginBottom: 24,
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: colors.text.primary, marginBottom: 6 },
  heroSubtitle: { fontSize: 13, color: colors.text.secondary, textAlign: 'center', lineHeight: 18 },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.glass.card,
    borderRadius: 14,
    marginBottom: 20,
  },
  loadingText: { fontSize: 14, fontWeight: '600', color: colors.accent.blue },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    marginBottom: 12,
    gap: 14,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMeta: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: colors.text.primary, marginBottom: 2 },
  actionDesc: { fontSize: 12, color: colors.text.secondary, lineHeight: 16 },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.accent.alpha ? colors.accent.alpha(isDark ? 0.08 : 0.06) : (isDark ? 'rgba(79, 195, 247, 0.08)' : 'rgba(2, 132, 199, 0.06)'),
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: colors.accent.alpha ? colors.accent.alpha(isDark ? 0.2 : 0.15) : (isDark ? 'rgba(79, 195, 247, 0.2)' : 'rgba(2, 132, 199, 0.15)'),
  },
  privacyText: { flex: 1, fontSize: 12, color: colors.text.secondary, lineHeight: 16 },
});
