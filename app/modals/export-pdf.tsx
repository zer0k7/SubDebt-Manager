import { useTheme } from '../../hooks/useTheme';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppDatePicker } from '../../components/AppDatePicker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '../../components/AmbientBackground';
import { GlassButton } from '../../components/GlassButton';
import { AppPopup } from '../../components/AppPopup';
import { useDailySpending, SpendingEntry, TimeRange } from '../../hooks/useDailySpending';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { useDebts } from '../../hooks/useDebts';
import { useCredits } from '../../hooks/useCredits';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency } from '../../utils/dateHelpers';
import {
  exportSpendingToPDF,
  savePDFToPhoneFolder,
  sharePDFFile,
  PDFExportData,
} from '../../utils/pdfExporter';
import {
  getPublicBackupFolderInfo,
  pickPublicBackupFolder,
} from '../../utils/vaultSnapshots';

type ExportRange = TimeRange | 'custom';
type PDFTheme = 'light' | 'dark' | 'emerald';

const RANGE_OPTIONS: { key: ExportRange; label: string; icon: string }[] = [
  { key: '7d', label: 'Last 7 Days', icon: 'today-outline' },
  { key: '30d', label: 'Last 30 Days', icon: 'calendar-outline' },
  { key: '90d', label: 'Last 3 Months', icon: 'calendar-number-outline' },
  { key: '1y', label: 'This Year', icon: 'stats-chart-outline' },
  { key: 'all', label: 'All Time', icon: 'infinite-outline' },
  { key: 'custom', label: 'Custom Range', icon: 'options-outline' },
];

const THEME_OPTIONS: { key: PDFTheme; label: string; icon: string; activeColor: string }[] = [
  { key: 'light', label: 'Classic Light', icon: 'sunny-outline', activeColor: '#0D9488' },
  { key: 'dark', label: 'Deep Slate Dark', icon: 'moon-outline', activeColor: '#818CF8' },
  { key: 'emerald', label: 'Luxury Emerald', icon: 'leaf-outline', activeColor: '#10B981' },
];

export default function ExportPDFModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const { entries, getEntriesForRange } = useDailySpending();
  const { subscriptions } = useSubscriptions();
  const { debts } = useDebts();
  const { credits } = useCredits();
  const { currencyCode, convertAmount } = useCurrency();

  const [selectedRange, setSelectedRange] = useState<ExportRange>('30d');
  const [pdfTheme, setPdfTheme] = useState<PDFTheme>('light');
  const [includeAllSections, setIncludeAllSections] = useState(true);
  const [publicFolder, setPublicFolder] = useState<{ uri: string | null; name: string | null }>({
    uri: null,
    name: null,
  });

  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [exportingAction, setExportingAction] = useState<'save' | 'share' | null>(null);

  const [popupConfig, setPopupConfig] = useState<any>(null);
  const showPopup = (config: any) => setPopupConfig(config);
  const closePopup = () => setPopupConfig(null);

  const loadFolder = useCallback(async () => {
    const info = await getPublicBackupFolderInfo();
    setPublicFolder(info);
  }, []);

  useEffect(() => {
    loadFolder();
  }, [loadFolder]);

  const handlePickFolder = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS !== 'android') {
      showPopup({
        title: 'Device Storage',
        message: 'On iOS, files can be directly saved into the Files app or iCloud via the Share Sheet.',
        confirmText: 'OK',
        onConfirm: closePopup,
      });
      return;
    }

    const result = await pickPublicBackupFolder();
    if (result.granted && result.folderName) {
      await loadFolder();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showPopup({
        title: 'Storage Folder Linked',
        message: `Linked folder: "${result.folderName}". All generated PDF statements will be saved here so they show up directly in your phone's File Manager.`,
        confirmText: 'Done',
        onConfirm: closePopup,
      });
    }
  };

  const stats = useMemo(() => {
    let filtered: SpendingEntry[] = [];
    let label = '';

    if (selectedRange === 'custom') {
      const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
      const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();

      filtered = entries.filter((e) => {
        const d = new Date(e.spentAt);
        const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        return dTime >= startTime && dTime <= endTime;
      });

      const startStr = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const endStr = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      label = `${startStr} - ${endStr}`;
    } else {
      filtered = getEntriesForRange(selectedRange as TimeRange);
      const opt = RANGE_OPTIONS.find((o) => o.key === selectedRange);
      label = opt ? opt.label : '';
    }

    filtered = [...filtered].sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime());

    const total = filtered.reduce((sum, e) => sum + convertAmount(e.amount, e.currency), 0);

    let avg = 0;
    if (filtered.length > 0) {
      const dayKeys = new Set(
        filtered.map((e) => {
          const d = new Date(e.spentAt);
          return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        })
      );
      avg = dayKeys.size > 0 ? Math.round((total / dayKeys.size) * 100) / 100 : 0;
    }

    const totalsMap = new Map<string, number>();
    filtered.forEach((entry) => {
      const amt = convertAmount(entry.amount, entry.currency);
      totalsMap.set(entry.category, (totalsMap.get(entry.category) || 0) + amt);
    });
    const categoryTotals = Array.from(totalsMap.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    const dayMap = new Map<string, number>();
    filtered.forEach((entry) => {
      const d = new Date(entry.spentAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const amt = convertAmount(entry.amount, entry.currency);
      dayMap.set(key, (dayMap.get(key) || 0) + amt);
    });
    let maxKey = '';
    let maxTotal = 0;
    dayMap.forEach((total, key) => {
      if (total > maxTotal) {
        maxTotal = total;
        maxKey = key;
      }
    });

    return {
      entries: filtered,
      label,
      total,
      dailyAvg: avg,
      categoryTotals,
      highestDay: { date: maxKey, total: maxTotal },
    };
  }, [entries, selectedRange, startDate, endDate, getEntriesForRange, convertAmount]);

  const preparePDFData = (): PDFExportData => {
    const mappedSubs = subscriptions.map((s) => ({
      name: s.name,
      amount: s.amount,
      currency: s.currency,
      billingCycle: s.billingCycle,
      nextRenewalDate: s.expiryDate,
      isActive: s.isActive,
    }));

    const mappedDebts = debts.map((d) => {
      const totalPaid = Array.isArray(d.payments)
        ? d.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
        : 0;
      return {
        personName: d.personName,
        amount: d.amount,
        currency: d.currency,
        dueDate: d.dueDate,
        isPaid: d.isPaid,
        remainingAmount: Math.max(0, d.amount - totalPaid),
      };
    });

    const mappedCredits = credits.map((c) => {
      const totalReturned = Array.isArray(c.payments)
        ? c.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
        : 0;
      return {
        personName: c.personName,
        amount: c.amount,
        currency: c.currency,
        expectedReturnDate: c.expectedReturnDate,
        isReturned: c.isReturned,
        remainingAmount: Math.max(0, c.amount - totalReturned),
      };
    });

    return {
      entries: stats.entries,
      timeRangeLabel: stats.label,
      totalAmount: stats.total,
      dailyAvg: stats.dailyAvg,
      currencyCode,
      categoryTotals: stats.categoryTotals,
      highestDay: stats.highestDay,
      pdfTheme,
      subscriptions: mappedSubs,
      debts: mappedDebts,
      credits: mappedCredits,
      includeAllSections,
    };
  };

  const handleSaveToDevice = async () => {
    if (stats.entries.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setExportingAction('save');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const pdfData = preparePDFData();
    const result = await exportSpendingToPDF(pdfData);

    if (!result || !result.filePath) {
      setExportingAction(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showPopup({
        title: 'Export Failed',
        message: 'Could not generate PDF file.',
        confirmText: 'OK',
        onConfirm: closePopup,
      });
      return;
    }

    const saveResult = await savePDFToPhoneFolder(result.filePath, result.fileName);
    setExportingAction(null);

    if (saveResult.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showPopup({
        title: 'Statement Saved',
        message: `Your financial statement was saved successfully.\n\nFolder: "${saveResult.folderName}"\nFile: ${result.fileName}\n\nYou can access it anytime from your phone's File Manager.`,
        confirmText: 'Open PDF',
        cancelText: 'Done',
        onCancel: () => {
          closePopup();
          router.back();
        },
        onConfirm: async () => {
          closePopup();
          await sharePDFFile(result.filePath, result.fileName);
          router.back();
        },
      });
    } else if (saveResult.error && saveResult.error !== 'No folder selected.') {
      showPopup({
        title: 'Save Failed',
        message: saveResult.error,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
    }
  };

  const handleShareViaApps = async () => {
    if (stats.entries.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setExportingAction('share');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const pdfData = preparePDFData();
    const result = await exportSpendingToPDF(pdfData);
    setExportingAction(null);

    if (result && result.filePath) {
      await sharePDFFile(result.filePath, result.fileName);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showPopup({
        title: 'Export Failed',
        message: 'Could not generate PDF file.',
        confirmText: 'OK',
        onConfirm: closePopup,
      });
    }
  };

  const handleRangeChange = (range: ExportRange) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRange(range);
  };

  const handleThemeChange = (theme: PDFTheme) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPdfTheme(theme);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Export PDF Statement</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>1. Select Time Range</Text>
        <View style={styles.rangeGrid}>
          {RANGE_OPTIONS.map((option) => {
            const isActive = selectedRange === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.rangeCard, isActive && styles.rangeCardActive]}
                onPress={() => handleRangeChange(option.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={isActive ? colors.accent.purple : colors.text.secondary}
                  style={styles.rangeIcon}
                />
                <Text style={[styles.rangeLabel, isActive && styles.rangeLabelActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedRange === 'custom' && (
          <View style={styles.customDateContainer}>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowStartDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dateSelectorIconWrap}>
                <Ionicons name="calendar-outline" size={16} color={colors.accent.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateSelectorLabel}>Start Date</Text>
                <Text style={styles.dateSelectorValue}>
                  {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowEndDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dateSelectorIconWrap}>
                <Ionicons name="calendar-outline" size={16} color={colors.accent.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateSelectorLabel}>End Date</Text>
                <Text style={styles.dateSelectorValue}>
                  {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionLabel}>2. Select Document Style</Text>
        <View style={styles.rangeGrid}>
          {THEME_OPTIONS.map((option) => {
            const isActive = pdfTheme === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.rangeCard, isActive && styles.rangeCardActive]}
                onPress={() => handleThemeChange(option.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={isActive ? option.activeColor : colors.text.secondary}
                  style={styles.rangeIcon}
                />
                <Text style={[styles.rangeLabel, isActive && { color: option.activeColor, fontWeight: '700' }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>3. Statement Options</Text>
        <TouchableOpacity
          style={styles.toggleCard}
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIncludeAllSections((prev) => !prev);
          }}
        >
          <View style={styles.toggleIconWrap}>
            <Ionicons
              name={includeAllSections ? 'checkbox' : 'square-outline'}
              size={22}
              color={includeAllSections ? colors.accent.purple : colors.text.muted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Include Active Subscriptions & Debts</Text>
            <Text style={styles.toggleSub}>
              Adds your recurring bills and liability ledgers to this statement report.
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>4. Storage Destination</Text>
        <View style={styles.folderCard}>
          <View style={styles.folderIconWrap}>
            <Ionicons name="folder-outline" size={20} color={colors.accent.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.folderTitle}>Phone Storage Location</Text>
            <Text style={styles.folderSubtitle} numberOfLines={1}>
              {publicFolder.name ? `Linked: ${publicFolder.name}` : 'Default File Manager / Downloads'}
            </Text>
          </View>
          {Platform.OS === 'android' && (
            <TouchableOpacity onPress={handlePickFolder} style={styles.changeFolderBtn}>
              <Text style={styles.changeFolderText}>
                {publicFolder.name ? 'Change' : 'Set Folder'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionLabel}>5. Statement Preview</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="document-text-outline" size={20} color={colors.accent.purple} />
            <Text style={styles.previewTitle}>SubDebt Spending Ledger</Text>
            <View style={styles.previewStatus}>
              <Text style={styles.previewStatusText}>Verified Offline</Text>
            </View>
          </View>

          <View style={styles.previewDivider} />

          <View style={styles.previewStatsGrid}>
            <View style={styles.previewStat}>
              <Text style={styles.previewStatLabel}>Total Outflow</Text>
              <Text style={[styles.previewStatValue, { color: colors.accent.purple }]}>
                {formatCurrency(stats.total, currencyCode)}
              </Text>
            </View>
            <View style={styles.previewStat}>
              <Text style={styles.previewStatLabel}>Entries</Text>
              <Text style={styles.previewStatValue}>{stats.entries.length} items</Text>
            </View>
          </View>

          <View style={styles.previewMeta}>
            <Ionicons name="time-outline" size={12} color={colors.text.muted} />
            <Text style={styles.previewMetaText}>{stats.label}</Text>
          </View>

          {stats.entries.length === 0 && (
            <View style={styles.emptyWarning}>
              <Ionicons name="warning-outline" size={16} color={colors.accent.red} />
              <Text style={styles.emptyWarningText}>
                No transactions found in this date range to export.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.btnContainer}>
          <GlassButton
            title={exportingAction === 'save' ? '' : 'Save Statement to Phone'}
            onPress={handleSaveToDevice}
            size="large"
            disabled={stats.entries.length === 0 || exportingAction !== null}
          >
            {exportingAction === 'save' && <ActivityIndicator color="#FFF" size="small" />}
          </GlassButton>

          <GlassButton
            title={exportingAction === 'share' ? '' : 'Share via Apps'}
            variant="secondary"
            onPress={handleShareViaApps}
            size="large"
            disabled={stats.entries.length === 0 || exportingAction !== null}
          >
            {exportingAction === 'share' && <ActivityIndicator color="#FFF" size="small" />}
          </GlassButton>

          <GlassButton
            title="Cancel"
            variant="ghost"
            onPress={() => router.back()}
            size="large"
            disabled={exportingAction !== null}
          />
        </View>
      </ScrollView>

      <AppDatePicker
        visible={showStartDatePicker}
        date={startDate}
        maximumDate={endDate}
        onConfirm={(d) => {
          setShowStartDatePicker(false);
          setStartDate(d);
        }}
        onCancel={() => setShowStartDatePicker(false)}
      />

      <AppDatePicker
        visible={showEndDatePicker}
        date={endDate}
        minimumDate={startDate}
        maximumDate={new Date()}
        onConfirm={(d) => {
          setShowEndDatePicker(false);
          setEndDate(d);
        }}
        onCancel={() => setShowEndDatePicker(false)}
      />

      <AppPopup
        visible={!!popupConfig}
        title={popupConfig?.title || ''}
        message={popupConfig?.message || ''}
        icon={popupConfig?.icon}
        iconColor={popupConfig?.iconColor}
        cancelText={popupConfig?.cancelText}
        confirmText={popupConfig?.confirmText || 'OK'}
        isDestructive={popupConfig?.isDestructive}
        onCancel={popupConfig?.onCancel}
        onConfirm={popupConfig?.onConfirm || closePopup}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.glass.card,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    title: {
      color: colors.text.primary,
      fontSize: 18,
      fontWeight: '700',
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: 20,
      marginBottom: 10,
    },
    rangeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    rangeCard: {
      width: '48.5%',
      backgroundColor: colors.glass.card,
      borderColor: colors.glass.cardBorder,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    rangeCardActive: {
      borderColor: colors.accent.purple,
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)',
    },
    rangeIcon: {
      marginRight: 2,
    },
    rangeLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.secondary,
      flexShrink: 1,
    },
    rangeLabelActive: {
      color: colors.accent.purple,
      fontWeight: '700',
    },
    customDateContainer: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    dateSelector: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.glass.card,
      borderColor: colors.glass.cardBorder,
      borderWidth: 1,
      borderRadius: 12,
      padding: 10,
      gap: 8,
    },
    dateSelectorIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dateSelectorLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.text.muted,
      textTransform: 'uppercase',
    },
    dateSelectorValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.primary,
      marginTop: 2,
    },
    toggleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.glass.card,
      borderColor: colors.glass.cardBorder,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      gap: 12,
    },
    toggleIconWrap: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text.primary,
    },
    toggleSub: {
      fontSize: 11,
      color: colors.text.muted,
      marginTop: 2,
    },
    folderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.glass.card,
      borderColor: colors.glass.cardBorder,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      gap: 12,
    },
    folderIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    folderTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.primary,
    },
    folderSubtitle: {
      fontSize: 11,
      color: colors.text.muted,
      marginTop: 2,
    },
    changeFolderBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    changeFolderText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent.purple,
    },
    previewCard: {
      backgroundColor: colors.glass.card,
      borderColor: colors.glass.cardBorder,
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    previewTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.primary,
      flex: 1,
    },
    previewStatus: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
    },
    previewStatusText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.accent.green,
    },
    previewDivider: {
      height: 1,
      backgroundColor: colors.glass.cardBorder,
      marginVertical: 12,
    },
    previewStatsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    previewStat: {
      flex: 1,
    },
    previewStatLabel: {
      fontSize: 11,
      color: colors.text.muted,
      marginBottom: 2,
    },
    previewStatValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text.primary,
    },
    previewMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 10,
    },
    previewMetaText: {
      fontSize: 11,
      color: colors.text.muted,
    },
    emptyWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
      padding: 8,
      borderRadius: 8,
      marginTop: 10,
    },
    emptyWarningText: {
      fontSize: 11,
      color: colors.accent.red,
      fontWeight: '600',
      flex: 1,
    },
    btnContainer: {
      marginTop: 24,
      gap: 10,
    },
  });
