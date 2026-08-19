import { useTheme } from '../../hooks/useTheme';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '../../components/AmbientBackground';
import { AppPopup } from '../../components/AppPopup';
import { useCurrency } from '../../hooks/useCurrency';
import { useSettings } from '../../context/SettingsContext';
import { parseCsvContent, importCsvToSpending, ParsedCsvRow } from '../../utils/csvImporter';

export default function ImportCsvModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { currencyCode } = useCurrency();
  const { formatCurrency, formatDate } = useSettings();

  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [importing, setImporting] = useState(false);

  const [popupConfig, setPopupConfig] = useState<any>(null);
  const showPopup = (config: any) => setPopupConfig(config);
  const closePopup = () => setPopupConfig(null);

  const handlePickCsv = async () => {
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileName(asset.name);

        const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'utf8' as any,
        });

        const rows = parseCsvContent(fileContent);
        setParsedRows(rows);

        if (rows.length === 0) {
          showPopup({
            title: 'No Rows Found',
            message: 'Could not detect valid transactions in this CSV file.',
            icon: 'alert-circle-outline',
            iconColor: colors.accent.amber,
            confirmText: 'OK',
            onConfirm: closePopup,
          });
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (err) {
      showPopup({
        title: 'File Read Error',
        message: 'Failed to read the selected CSV file.',
        icon: 'alert-circle-outline',
        iconColor: colors.accent.red,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    try {
      setImporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const count = await importCsvToSpending(parsedRows, currencyCode);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showPopup({
        title: 'Import Successful! 🎉',
        message: `Successfully imported ${count} transactions into your Daily Spending ledger.`,
        icon: 'checkmark-circle-outline',
        iconColor: colors.accent.green,
        confirmText: 'Great!',
        onConfirm: () => {
          closePopup();
          router.back();
        },
      });
    } catch (err) {
      showPopup({
        title: 'Import Failed',
        message: 'An error occurred while saving imported entries.',
        icon: 'alert-circle-outline',
        iconColor: colors.accent.red,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
    } finally {
      setImporting(false);
    }
  };

  const totalAmount = parsedRows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CSV DATA IMPORTER</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Upload Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SELECT CSV FILE</Text>
          <Text style={styles.cardDesc}>
            Import expenses from Excel, Google Sheets, or Bank CSV exports. Columns for Date, Description, Amount, and Category will be auto-detected.
          </Text>

          <TouchableOpacity style={styles.uploadBtn} onPress={handlePickCsv} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={colors.accent.purple} />
            ) : (
              <>
                <Ionicons name="document-attach-outline" size={26} color={colors.accent.purple} />
                <Text style={styles.uploadBtnText}>
                  {fileName ? `File: ${fileName}` : 'Pick CSV File'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Preview Section */}
        {parsedRows.length > 0 && (
          <View style={styles.card}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.cardTitle}>PREVIEW TRANSACTIONS ({parsedRows.length})</Text>
                <Text style={styles.previewSub}>Total: {formatCurrency(totalAmount, currencyCode)}</Text>
              </View>
              <TouchableOpacity style={styles.importBtn} onPress={handleConfirmImport} disabled={importing} activeOpacity={0.85}>
                {importing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
                    <Text style={styles.importBtnText}>Import {parsedRows.length}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.previewList}>
              {parsedRows.slice(0, 10).map((row, idx) => (
                <View key={idx} style={styles.previewRow}>
                  <View style={styles.previewInfo}>
                    <Text style={styles.rowTitle}>{row.title}</Text>
                    <Text style={styles.rowMeta}>
                      {row.category} · {formatDate(row.date)}
                    </Text>
                  </View>
                  <Text style={styles.rowAmount}>{formatCurrency(row.amount, currencyCode)}</Text>
                </View>
              ))}
              {parsedRows.length > 10 && (
                <Text style={styles.moreText}>+ {parsedRows.length - 10} more transactions ready for import</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <AppPopup
        visible={!!popupConfig}
        title={popupConfig?.title || ''}
        message={popupConfig?.message || ''}
        icon={popupConfig?.icon || 'information-circle-outline'}
        iconColor={popupConfig?.iconColor}
        cancelText={popupConfig?.cancelText}
        confirmText={popupConfig?.confirmText || 'OK'}
        isDestructive={popupConfig?.isDestructive || false}
        onCancel={popupConfig?.onCancel || closePopup}
        onConfirm={popupConfig?.onConfirm || closePopup}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.glass.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    headerTitle: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    content: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
    card: {
      padding: 18,
      borderRadius: 22,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 12,
    },
    cardTitle: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    cardDesc: {
      color: colors.text.secondary,
      fontSize: 13,
      lineHeight: 18,
    },
    uploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 16,
      backgroundColor: colors.accent.alpha(isDark ? 0.12 : 0.06),
      borderWidth: 1,
      borderColor: colors.accent.alpha(0.25),
      marginTop: 4,
    },
    uploadBtnText: {
      color: colors.accent.purple,
      fontSize: 14,
      fontWeight: '700',
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      paddingBottom: 12,
    },
    previewSub: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },
    importBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.accent.purple,
    },
    importBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    previewList: { gap: 8, paddingTop: 4 },
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
    },
    previewInfo: { flex: 1 },
    rowTitle: { color: colors.text.primary, fontSize: 13, fontWeight: '700' },
    rowMeta: { color: colors.text.muted, fontSize: 11, marginTop: 2 },
    rowAmount: { color: colors.accent.purple, fontSize: 14, fontWeight: '800' },
    moreText: {
      color: colors.text.secondary,
      fontSize: 12,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 4,
    },
  });
