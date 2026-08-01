import { useTheme } from '../../hooks/useTheme';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppDatePicker } from '../../components/AppDatePicker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '../../components/AmbientBackground';
import { GlassButton } from '../../components/GlassButton';
import { useDailySpending, SpendingEntry, TimeRange } from '../../hooks/useDailySpending';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency } from '../../utils/dateHelpers';
import { exportSpendingToPDF } from '../../utils/pdfExporter';

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
  { key: 'light', label: 'Classic Light', icon: 'sunny-outline', activeColor: '#7C3AED' },
  { key: 'dark', label: 'Deep Slate Dark', icon: 'moon-outline', activeColor: '#6366F1' },
  { key: 'emerald', label: 'Luxury Emerald', icon: 'leaf-outline', activeColor: '#10B981' },
];

export default function ExportPDFModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const { entries, getEntriesForRange } = useDailySpending();
  const { currencyCode, convertAmount } = useCurrency();

  const [selectedRange, setSelectedRange] = useState<ExportRange>('30d');
  const [pdfTheme, setPdfTheme] = useState<PDFTheme>('light');
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Compute stats in real-time based on selection
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

    // Sort descending
    filtered = [...filtered].sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime());

    // Calculate total amount
    const total = filtered.reduce((sum, e) => sum + convertAmount(e.amount, e.currency), 0);

    // Calculate daily average
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

    // Calculate Category Breakdown
    const totalsMap = new Map<string, number>();
    filtered.forEach((entry) => {
      const amt = convertAmount(entry.amount, entry.currency);
      totalsMap.set(entry.category, (totalsMap.get(entry.category) || 0) + amt);
    });
    const categoryTotals = Array.from(totalsMap.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    // Calculate Highest Spending Day
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

  const handleExport = async () => {
    if (stats.entries.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExporting(true);

    const result = await exportSpendingToPDF({
      entries: stats.entries,
      timeRangeLabel: stats.label,
      totalAmount: stats.total,
      dailyAvg: stats.dailyAvg,
      currencyCode,
      categoryTotals: stats.categoryTotals,
      highestDay: stats.highestDay,
      pdfTheme,
    });

    setExporting(false);
    if (result) {
      router.back();
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Export PDF Report</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Step 1: Select Range */}
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

        {/* Custom Date Pickers */}
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

        {/* Select PDF Design Template */}
        <Text style={styles.sectionLabel}>2. Select Design Style</Text>
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
                <Text style={[styles.rangeLabel, isActive && { color: option.activeColor, fontWeight: '600' }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Step 3: Live Preview */}
        <Text style={styles.sectionLabel}>3. Document Preview</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="document-text-outline" size={20} color={colors.accent.purple} />
            <Text style={styles.previewTitle}>SubDebt Spending Ledger</Text>
            <View style={styles.previewStatus}>
              <Text style={styles.previewStatusText}>Offline</Text>
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

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.infoBoxText}>
            SubDebt-Manager exports reports with professional layout designs locally on your device.
            Your financial data never uploads to external servers.
          </Text>
        </View>

        {/* Export Button */}
        <View style={styles.btnContainer}>
          <GlassButton
            title={exporting ? '' : 'Generate PDF Report'}
            onPress={handleExport}
            size="large"
            disabled={stats.entries.length === 0 || exporting}
          >
            {exporting && <ActivityIndicator color="#FFF" size="small" />}
          </GlassButton>
          <GlassButton
            title="Cancel"
            variant="ghost"
            onPress={() => router.back()}
            size="large"
            disabled={exporting}
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
      padding: 16,
      paddingBottom: 40,
    },
    sectionLabel: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
      marginTop: 8,
    },
    rangeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    rangeCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    rangeCardActive: {
      backgroundColor: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
      borderColor: isDark ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.3)',
    },
    rangeIcon: {
      width: 22,
    },
    rangeLabel: {
      color: colors.text.muted,
      fontSize: 14,
      fontWeight: '500',
    },
    rangeLabelActive: {
      color: colors.accent.purple,
      fontWeight: '600',
    },
    customDateContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    dateSelector: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    dateSelectorIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dateSelectorLabel: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    dateSelectorValue: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '600',
      marginTop: 2,
    },
    previewCard: {
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    previewTitle: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '700',
      flex: 1,
    },
    previewStatus: {
      backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
      borderColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)',
      borderWidth: 0.5,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    previewStatusText: {
      color: colors.accent.emerald || '#10B981',
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    previewDivider: {
      height: 0.5,
      backgroundColor: colors.glass.cardBorder,
      marginVertical: 14,
    },
    previewStatsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    previewStat: {
      flex: 1,
    },
    previewStatLabel: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '500',
    },
    previewStatValue: {
      color: colors.text.primary,
      fontSize: 18,
      fontWeight: '700',
      marginTop: 4,
    },
    previewMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    previewMetaText: {
      color: colors.text.muted,
      fontSize: 12,
      fontWeight: '500',
    },
    emptyWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
      borderColor: isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.15)',
      borderWidth: 0.5,
      borderRadius: 10,
      padding: 10,
      marginTop: 14,
    },
    emptyWarningText: {
      color: colors.accent.red,
      fontSize: 11,
      fontWeight: '500',
      flex: 1,
    },
    infoBox: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      borderRadius: 16,
      padding: 14,
      marginBottom: 24,
    },
    infoBoxText: {
      color: colors.text.muted,
      fontSize: 11,
      lineHeight: 16,
      flex: 1,
    },
    btnContainer: {
      gap: 10,
    },
  });
