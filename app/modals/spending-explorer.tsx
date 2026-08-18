import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../hooks/useTheme';
import { AmbientBackground } from '../../components/AmbientBackground';
import { SpendingEntryCard } from '../../components/SpendingEntryCard';
import { AppDatePicker } from '../../components/AppDatePicker';
import { AppPopup } from '../../components/AppPopup';
import { SwipeableRow } from '../../components/SwipeableRow';
import { EmptyState } from '../../components/EmptyState';
import { useDailySpending, SpendingEntry } from '../../hooks/useDailySpending';
import { useCurrency } from '../../hooks/useCurrency';
import { useCategoryManager } from '../../hooks/useCategoryManager';
import { formatCurrency, formatDate } from '../../utils/dateHelpers';

export type DateFilterPreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_90d'
  | 'this_year'
  | 'custom';

export type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'amount_desc'
  | 'amount_asc'
  | 'title_asc';

const DATE_PRESETS: { key: DateFilterPreset; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'last_90d', label: 'Last 90 Days' },
  { key: 'this_year', label: 'This Year' },
  { key: 'custom', label: 'Custom Range' },
];

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'date_desc', label: 'Newest First', icon: 'time-outline' },
  { key: 'date_asc', label: 'Oldest First', icon: 'hourglass-outline' },
  { key: 'amount_desc', label: 'Highest Amount', icon: 'trending-up-outline' },
  { key: 'amount_asc', label: 'Lowest Amount', icon: 'trending-down-outline' },
  { key: 'title_asc', label: 'Title (A-Z)', icon: 'text-outline' },
];

export default function SpendingExplorerModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const { entries, deleteEntry, refresh } = useDailySpending();
  const { currencyCode, convertAmount } = useCurrency();
  const { allCategories, getCategoryColor, getCategoryIcon } = useCategoryManager();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');

  // Custom date range states
  const [customStartDate, setCustomStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [customEndDate, setCustomEndDate] = useState<Date>(() => new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Sorting sheet state
  const [showSortSelector, setShowSortSelector] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Helper date calculators
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (datePreset) {
      case 'today':
        return { start: todayStart, end: todayEnd };
      case 'yesterday': {
        const yStart = new Date(todayStart);
        yStart.setDate(yStart.getDate() - 1);
        const yEnd = new Date(todayEnd);
        yEnd.setDate(yEnd.getDate() - 1);
        return { start: yStart, end: yEnd };
      }
      case 'this_week': {
        const day = now.getDay();
        const diff = (day + 6) % 7; // Monday start
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - diff);
        return { start: weekStart, end: todayEnd };
      }
      case 'this_month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        return { start: monthStart, end: todayEnd };
      }
      case 'last_month': {
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { start: lastMonthStart, end: lastMonthEnd };
      }
      case 'last_90d': {
        const d90 = new Date(todayStart);
        d90.setDate(d90.getDate() - 89);
        return { start: d90, end: todayEnd };
      }
      case 'this_year': {
        const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        return { start: yearStart, end: todayEnd };
      }
      case 'custom': {
        const s = new Date(customStartDate);
        s.setHours(0, 0, 0, 0);
        const e = new Date(customEndDate);
        e.setHours(23, 59, 59, 999);
        return { start: s, end: e };
      }
      case 'all':
      default:
        return null;
    }
  }, [datePreset, customStartDate, customEndDate]);

  // Filtered and Sorted Entries
  const filteredEntries = useMemo(() => {
    let list = [...entries];

    // 1. Date Filter
    if (dateRangeBounds) {
      const sTime = dateRangeBounds.start.getTime();
      const eTime = dateRangeBounds.end.getTime();
      list = list.filter((e) => {
        const t = new Date(e.spentAt).getTime();
        return t >= sTime && t <= eTime;
      });
    }

    // 2. Category Filter
    if (selectedCategory !== 'ALL') {
      list = list.filter(
        (e) => e.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    // 4. Sorting
    list.sort((a, b) => {
      if (sortOption === 'date_desc') {
        return new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime();
      }
      if (sortOption === 'date_asc') {
        return new Date(a.spentAt).getTime() - new Date(b.spentAt).getTime();
      }
      if (sortOption === 'amount_desc') {
        const valA = convertAmount(a.amount, a.currency);
        const valB = convertAmount(b.amount, b.currency);
        return valB - valA;
      }
      if (sortOption === 'amount_asc') {
        const valA = convertAmount(a.amount, a.currency);
        const valB = convertAmount(b.amount, b.currency);
        return valA - valB;
      }
      if (sortOption === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [entries, dateRangeBounds, selectedCategory, searchQuery, sortOption, convertAmount]);

  // Aggregate Metrics for Filtered List
  const metrics = useMemo(() => {
    const count = filteredEntries.length;
    const total = filteredEntries.reduce(
      (sum, e) => sum + convertAmount(e.amount, e.currency),
      0
    );
    const avg = count > 0 ? total / count : 0;

    // Category breakdown
    const catMap = new Map<string, { total: number; count: number }>();
    filteredEntries.forEach((e) => {
      const val = convertAmount(e.amount, e.currency);
      const existing = catMap.get(e.category) || { total: 0, count: 0 };
      catMap.set(e.category, {
        total: existing.total + val,
        count: existing.count + 1,
      });
    });

    let topCategory = '—';
    let topCategoryTotal = 0;

    const catList: { name: string; total: number; count: number; percent: number }[] = [];
    catMap.forEach((data, name) => {
      const percent = total > 0 ? (data.total / total) * 100 : 0;
      catList.push({ name, total: data.total, count: data.count, percent });
      if (data.total > topCategoryTotal) {
        topCategoryTotal = data.total;
        topCategory = name;
      }
    });

    catList.sort((a, b) => b.total - a.total);

    return {
      count,
      total,
      avg,
      topCategory,
      topCategoryTotal,
      categories: catList,
    };
  }, [filteredEntries, convertAmount]);

  // Available unique categories present in the system + custom
  const availableCategories = useMemo(() => {
    const list = [{ name: 'ALL', icon: 'grid-outline', color: colors.accent.blue }];
    allCategories.forEach((c) => {
      list.push({ name: c.name, icon: c.icon, color: c.color });
    });
    return list;
  }, [allCategories, colors.accent.blue]);

  // Handlers
  const handleEdit = (entry: SpendingEntry) => {
    router.push({ pathname: '/modals/edit-spending', params: { id: entry.id } });
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteEntry(deleteId);
      setDeleteId(null);
    }
  };

  const handleResetFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    setSelectedCategory('ALL');
    setDatePreset('all');
    setSortOption('date_desc');
  };

  // CSV Exporter
  const handleExportCSV = async () => {
    if (filteredEntries.length === 0) {
      Alert.alert('No Data', 'There are no transactions to export with current filters.');
      return;
    }

    try {
      setIsExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const headers = 'ID,Date,Title,Category,Amount,Currency,Converted_Amount,Notes\n';
      const rows = filteredEntries
        .map((e) => {
          const conv = convertAmount(e.amount, e.currency).toFixed(2);
          const safeTitle = `"${e.title.replace(/"/g, '""')}"`;
          const safeCat = `"${e.category.replace(/"/g, '""')}"`;
          const safeNotes = `"${(e.notes || '').replace(/"/g, '""')}"`;
          const safeDate = e.spentAt.split('T')[0];
          return `${e.id},${safeDate},${safeTitle},${safeCat},${e.amount},${e.currency},${conv},${safeNotes}`;
        })
        .join('\n');

      const csvContent = headers + rows;
      const fileName = `Spending_Export_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Filtered Spending (CSV)',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        await Share.share({
          message: csvContent,
          title: fileName,
        });
      }
    } catch (err) {
      console.error('CSV Export error:', err);
      Alert.alert('Export Failed', 'Unable to export transactions CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const activeSortLabel = SORT_OPTIONS.find((s) => s.key === sortOption)?.label || 'Sort';

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Spending Explorer</Text>
          <Text style={styles.headerSubtitle}>
            {metrics.count} {metrics.count === 1 ? 'transaction' : 'transactions'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {(selectedCategory !== 'ALL' || datePreset !== 'all' || searchQuery.trim() !== '') && (
            <TouchableOpacity
              onPress={handleResetFilters}
              style={styles.resetBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.accent.blue} />
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleExportCSV}
            style={styles.exportIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="share-outline" size={19} color={colors.accent.blue} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.filterSection}>
            {/* Search Input Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={17} color={colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search transactions, notes, categories..."
                placeholderTextColor={colors.text.muted}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && Platform.OS !== 'ios' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={17} color={colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Date Preset Filter Bar */}
            <View style={styles.filterRowWrapper}>
              <View style={styles.filterLabelRow}>
                <Ionicons name="calendar-outline" size={13} color={colors.accent.blue} />
                <Text style={styles.filterLabel}>DATE FILTER</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {DATE_PRESETS.map((dp) => {
                  const isActive = datePreset === dp.key;
                  return (
                    <TouchableOpacity
                      key={dp.key}
                      style={[styles.presetChip, isActive && styles.presetChipActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDatePreset(dp.key);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.presetChipText, isActive && styles.presetChipTextActive]}
                      >
                        {dp.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Custom Date Range Selector Inputs */}
              {datePreset === 'custom' && (
                <View style={styles.customDateBox}>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Ionicons name="calendar" size={13} color={colors.accent.blue} />
                    <Text style={styles.datePickerBtnText}>
                      From: {formatDate(customStartDate.toISOString())}
                    </Text>
                  </TouchableOpacity>

                  <Ionicons name="arrow-forward" size={14} color={colors.text.tertiary} />

                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Ionicons name="calendar" size={13} color={colors.accent.blue} />
                    <Text style={styles.datePickerBtnText}>
                      To: {formatDate(customEndDate.toISOString())}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Category Filter Horizontal Selector */}
            <View style={styles.filterRowWrapper}>
              <View style={styles.filterLabelRow}>
                <Ionicons name="pricetag-outline" size={13} color={colors.accent.purple} />
                <Text style={styles.filterLabel}>CATEGORY</Text>
                {selectedCategory !== 'ALL' && (
                  <TouchableOpacity onPress={() => setSelectedCategory('ALL')}>
                    <Text style={styles.clearFilterText}>Show All</Text>
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {availableCategories.map((cat) => {
                  const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.catChip,
                        isActive && {
                          backgroundColor: `${cat.color}25`,
                          borderColor: cat.color,
                          borderWidth: 1.2,
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedCategory(cat.name);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={13}
                        color={isActive ? cat.color : colors.text.secondary}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          isActive && { color: cat.color, fontWeight: '700' },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Summary Metrics Bar */}
            <View style={styles.metricsCard}>
              <View style={styles.metricItem}>
                <Text style={styles.metricSub}>TOTAL SPENT</Text>
                <Text style={styles.metricValPrimary}>
                  {formatCurrency(metrics.total, currencyCode)}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricSub}>AVG / ENTRY</Text>
                <Text style={styles.metricVal}>
                  {formatCurrency(metrics.avg, currencyCode)}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricSub}>TOP CATEGORY</Text>
                <Text style={styles.metricVal} numberOfLines={1}>
                  {metrics.topCategory}
                </Text>
              </View>
            </View>

            {/* Category Breakdown Progress Bars (if more than 1 category) */}
            {metrics.categories.length > 1 && selectedCategory === 'ALL' && (
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>Filtered Category Distribution</Text>
                <View style={styles.breakdownList}>
                  {metrics.categories.slice(0, 4).map((c) => {
                    const barColor = getCategoryColor(c.name) || colors.accent.blue;
                    return (
                      <View key={c.name} style={styles.breakdownRow}>
                        <View style={styles.breakdownLabelRow}>
                          <View style={styles.breakdownNameWrap}>
                            <View style={[styles.catDot, { backgroundColor: barColor }]} />
                            <Text style={styles.breakdownCatName} numberOfLines={1}>
                              {c.name}
                            </Text>
                            <Text style={styles.breakdownCount}>({c.count})</Text>
                          </View>
                          <Text style={styles.breakdownAmount}>
                            {formatCurrency(c.total, currencyCode)} ({c.percent.toFixed(0)}%)
                          </Text>
                        </View>
                        <View style={styles.progressBarTrack}>
                          <View
                            style={[
                              styles.progressBarThumb,
                              { width: `${Math.min(c.percent, 100)}%`, backgroundColor: barColor },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Sort Order Selector Bar */}
            <View style={styles.sortBar}>
              <Text style={styles.listHeading}>
                RESULTS ({filteredEntries.length})
              </Text>
              <TouchableOpacity
                style={styles.sortBtn}
                onPress={() => setShowSortSelector(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-vertical" size={13} color={colors.accent.blue} />
                <Text style={styles.sortBtnText}>{activeSortLabel}</Text>
                <Ionicons name="chevron-down" size={12} color={colors.accent.blue} />
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <SwipeableRow
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item.id)}
          >
            <SpendingEntryCard
              entry={item}
              onPress={() => handleEdit(item)}
              onDelete={() => handleDelete(item.id)}
            />
          </SwipeableRow>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No Matching Expenses"
            subtitle="Try changing your date range, category, or search filters."
            actionLabel="Reset All Filters"
            onAction={handleResetFilters}
          />
        }
      />

      {/* Date Pickers */}
      <AppDatePicker
        visible={showStartDatePicker}
        date={customStartDate}
        onConfirm={(d) => {
          setCustomStartDate(d);
          setShowStartDatePicker(false);
        }}
        onCancel={() => setShowStartDatePicker(false)}
        maximumDate={customEndDate}
        title="Select Start Date"
      />

      <AppDatePicker
        visible={showEndDatePicker}
        date={customEndDate}
        onConfirm={(d) => {
          setCustomEndDate(d);
          setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
        minimumDate={customStartDate}
        title="Select End Date"
      />

      {/* Delete Confirmation Popup */}
      <AppPopup
        visible={deleteId !== null}
        title="Delete Expense"
        message="Are you sure you want to delete this spending entry?"
        isDestructive={true}
        icon="trash-outline"
        iconColor={colors.accent.red}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Sort Option Modal */}
      {showSortSelector && (
        <View style={styles.sortModalOverlay}>
          <TouchableOpacity
            style={styles.sortModalBackdrop}
            onPress={() => setShowSortSelector(false)}
            activeOpacity={1}
          />
          <View style={styles.sortModalSheet}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>Sort Transactions By</Text>
              <TouchableOpacity onPress={() => setShowSortSelector(false)}>
                <Ionicons name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.sortOptionsList}>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortOption === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.sortOptionItem, isSelected && styles.sortOptionItemSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSortOption(opt.key);
                      setShowSortSelector(false);
                    }}
                  >
                    <View style={styles.sortOptionLeft}>
                      <Ionicons
                        name={opt.icon as any}
                        size={17}
                        color={isSelected ? colors.accent.blue : colors.text.secondary}
                      />
                      <Text
                        style={[
                          styles.sortOptionLabel,
                          isSelected && { color: colors.accent.blue, fontWeight: '700' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={colors.accent.blue} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}
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
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      backgroundColor: colors.background.primary,
    },
    headerIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
    },
    headerCenter: {
      flex: 1,
      marginHorizontal: 12,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text.primary,
    },
    headerSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.tertiary,
      marginTop: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(2, 132, 199, 0.1)',
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(2, 132, 199, 0.2)',
    },
    resetBtnText: {
      color: colors.accent.blue,
      fontSize: 11,
      fontWeight: '700',
    },
    exportIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(2, 132, 199, 0.1)',
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(2, 132, 199, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    filterSection: {
      paddingTop: 14,
      gap: 14,
      marginBottom: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 44,
      gap: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.04,
      shadowRadius: 4,
      elevation: isDark ? 0 : 1,
    },
    searchInput: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: '500',
      color: colors.text.primary,
    },
    filterRowWrapper: {
      gap: 8,
    },
    filterLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },
    filterLabel: {
      flex: 1,
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.text.tertiary,
    },
    clearFilterText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.accent.blue,
    },
    chipRow: {
      gap: 7,
      paddingVertical: 2,
    },
    presetChip: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.03,
      shadowRadius: 3,
      elevation: isDark ? 0 : 1,
    },
    presetChipActive: {
      backgroundColor: colors.accent.blue,
      borderColor: colors.accent.blue,
    },
    presetChipText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    presetChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    customDateBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
      borderRadius: 12,
      padding: 9,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      marginTop: 4,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.03,
      shadowRadius: 3,
      elevation: isDark ? 0 : 1,
    },
    datePickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(2, 132, 199, 0.08)',
    },
    datePickerBtnText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.text.primary,
    },
    catChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.03,
      shadowRadius: 3,
      elevation: isDark ? 0 : 1,
    },
    catChipText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    metricsCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 6,
      elevation: isDark ? 0 : 2,
    },
    metricItem: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
    },
    metricDivider: {
      width: 1,
      height: 28,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.07)',
    },
    metricSub: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: colors.text.muted,
    },
    metricValPrimary: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.accent.blue,
    },
    metricVal: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text.primary,
    },
    breakdownCard: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
      gap: 10,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.04,
      shadowRadius: 6,
      elevation: isDark ? 0 : 1,
    },
    breakdownTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.secondary,
    },
    breakdownList: {
      gap: 9,
    },
    breakdownRow: {
      gap: 5,
    },
    breakdownLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    breakdownNameWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    catDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    breakdownCatName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.primary,
      maxWidth: 130,
    },
    breakdownCount: {
      fontSize: 11,
      color: colors.text.muted,
    },
    breakdownAmount: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.text.secondary,
    },
    progressBarTrack: {
      height: 5,
      borderRadius: 2.5,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      overflow: 'hidden',
    },
    progressBarThumb: {
      height: '100%',
      borderRadius: 2.5,
    },
    sortBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    listHeading: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.text.tertiary,
    },
    sortBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(2, 132, 199, 0.08)',
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(2, 132, 199, 0.15)',
    },
    sortBtnText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.accent.blue,
    },
    sortModalOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      zIndex: 1000,
    },
    sortModalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sortModalSheet: {
      backgroundColor: isDark ? '#141420' : '#FFFFFF',
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 20,
      paddingBottom: 38,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 10,
    },
    sortModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    sortModalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
    },
    sortOptionsList: {
      gap: 4,
    },
    sortOptionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    sortOptionItemSelected: {
      backgroundColor: isDark ? 'rgba(79, 195, 247, 0.14)' : 'rgba(2, 132, 199, 0.1)',
    },
    sortOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    sortOptionLabel: {
      fontSize: 13.5,
      fontWeight: '600',
      color: colors.text.primary,
    },
  });
