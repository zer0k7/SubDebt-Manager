import { useTheme } from '../../hooks/useTheme';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SpendingEntryCard } from '../../components/SpendingEntryCard';
import { SpendingTrendChart } from '../../components/SpendingTrendChart';
import { CategoryBreakdown } from '../../components/CategoryBreakdown';
import { SpendingHeatmap } from '../../components/SpendingHeatmap';
import { InsightsPanel } from '../../components/InsightsPanel';
import { EmptyState } from '../../components/EmptyState';
import { SwipeableRow } from '../../components/SwipeableRow';
import { AmbientBackground } from '../../components/AmbientBackground';
import { AppPopup } from '../../components/AppPopup';
import { SearchBar } from '../../components/SearchBar';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import {
  useDailySpending,
  SpendingEntry,
  TimeRange,
} from '../../hooks/useDailySpending';
import { useCurrency } from '../../hooks/useCurrency';
import { useBudget } from '../../hooks/useBudget';
import { formatCurrency } from '../../utils/dateHelpers';

type ViewMode = 'overview' | 'entries';

const TIME_RANGE_OPTIONS: { key: TimeRange; label: string; shortLabel: string }[] = [
  { key: '7d', label: 'Last 7 Days', shortLabel: '7D' },
  { key: '30d', label: 'Last 30 Days', shortLabel: '30D' },
  { key: '90d', label: 'Last 3 Months', shortLabel: '3M' },
  { key: '1y', label: 'This Year', shortLabel: '1Y' },
  { key: 'all', label: 'All Time', shortLabel: 'All' },
];

export default function SpendingScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const {
    entries,
    isLoaded,
    deleteEntry,
    getTotalForDay,
    getTotalForWeek,
    getTotalForMonth,
    getTotalForYear,
    getTotalForRange,
    getDailyAverage,
    getNoSpendDaysThisMonth,
    getSavingMessage,
    getWeeklyData,
    getDailyData,
    getYearlyMonthlyData,
    getCategoryTotals,
    getComparisonStats,
    getHighestSpendingDay,
    getEntriesForRange,
    getEntriesGroupedByDay,
    getSpendingHeatmap,
    getTopExpenses,
    refresh,
  } = useDailySpending();
  const { budget, refresh: refreshBudget } = useBudget();
  const { currencyCode, convertAmount, refresh: refreshCurrency } = useCurrency();
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const todayTotal = getTotalForDay(new Date(), convertAmount);
  const weekTotal = getTotalForWeek(convertAmount);
  const monthTotal = getTotalForMonth(new Date(), convertAmount);
  const yearTotal = getTotalForYear(new Date(), convertAmount);
  const rangeTotal = getTotalForRange(timeRange, convertAmount);

  // Budget calculations
  const budgetProgress = budget.amount > 0 ? monthTotal / budget.amount : 0;
  const remainingBudget = budget.amount - monthTotal;
  const dailyAvg = getDailyAverage(timeRange, convertAmount);
  const weeklyData = getWeeklyData(convertAmount);
  const dailyData30 = useMemo(() => getDailyData(30, convertAmount), [getDailyData, convertAmount]);
  const dailyData90 = useMemo(() => getDailyData(90, convertAmount), [getDailyData, convertAmount]);
  const yearlyData = useMemo(() => getYearlyMonthlyData(convertAmount), [getYearlyMonthlyData, convertAmount]);
  const categoryTotals = useMemo(() => getCategoryTotals(timeRange, convertAmount), [getCategoryTotals, timeRange, convertAmount]);
  const comparisonStats = useMemo(
    () => getComparisonStats(timeRange, convertAmount),
    [getComparisonStats, timeRange, convertAmount]
  );
  const highestDay = useMemo(
    () => getHighestSpendingDay(timeRange, convertAmount),
    [getHighestSpendingDay, timeRange, convertAmount]
  );

  const rangeEntries = useMemo(
    () => getEntriesForRange(timeRange),
    [getEntriesForRange, timeRange]
  );

  const groupedEntries = useMemo(
    () => getEntriesGroupedByDay(timeRange, convertAmount),
    [getEntriesGroupedByDay, timeRange, convertAmount]
  );

  const heatmapData = useMemo(
    () => getSpendingHeatmap(30, convertAmount),
    [getSpendingHeatmap, convertAmount]
  );

  const topExpenses = useMemo(
    () => getTopExpenses(timeRange, 5, convertAmount),
    [getTopExpenses, timeRange, convertAmount]
  );

  const noSpendDays = getNoSpendDaysThisMonth();
  const savingMessage = getSavingMessage();

  const filteredEntries = useMemo(() => {
    const source = viewMode === 'entries' ? rangeEntries : rangeEntries;
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase().trim();
    return source.filter(
      (entry) =>
        entry.title.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q) ||
        (entry.notes && entry.notes.toLowerCase().includes(q))
    );
  }, [rangeEntries, searchQuery, viewMode]);

  const rangeLabel = useMemo(() => {
    const opt = TIME_RANGE_OPTIONS.find((o) => o.key === timeRange);
    return opt?.label || 'Last 7 Days';
  }, [timeRange]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refresh(),
      refreshBudget(),
    ]);
    setRefreshing(false);
  }, [refresh, refreshBudget]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshBudget();
      refreshCurrency();
    }, [refresh, refreshBudget, refreshCurrency])
  );

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/modals/add-spending');
  };

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

  const handleTimeRangeChange = (range: TimeRange) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeRange(range);
  };

  const renderItem = ({ item }: { item: SpendingEntry }) => (
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
  );

  const renderTimeRangeFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.timeFilterContainer}
      style={styles.timeFilterScroll}
    >
      {TIME_RANGE_OPTIONS.map((option) => {
        const isActive = option.key === timeRange;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.timeFilterPill, isActive && styles.timeFilterPillActive]}
            onPress={() => handleTimeRangeChange(option.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.timeFilterText,
                isActive && styles.timeFilterTextActive,
              ]}
            >
              {option.shortLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderOverviewHeader = () => (
    <>
      {/* Time Range Filter */}
      {renderTimeRangeFilter()}

      {/* Monthly Budget Card */}
      {budget.amount > 0 && (
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <View>
              <Text style={styles.budgetLabel}>Monthly Budget</Text>
              <Text style={styles.budgetAmount}>
                {formatCurrency(monthTotal, currencyCode)} / {formatCurrency(budget.amount, currencyCode)}
              </Text>
            </View>
            <View style={styles.budgetStats}>
              <Text style={[
                styles.remainingText,
                remainingBudget < 0 && { color: colors.accent.red }
              ]}>
                {remainingBudget >= 0 ? 'Remaining: ' : 'Over: '}
                {formatCurrency(Math.abs(remainingBudget), currencyCode)}
              </Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[
              styles.progressBarFill,
              { width: `${Math.min(budgetProgress * 100, 100)}%` },
              budgetProgress > 0.9 && { backgroundColor: colors.accent.red },
              budgetProgress <= 0.9 && budgetProgress > 0.7 && { backgroundColor: colors.accent.amber },
            ]} />
          </View>
        </View>
      )}

      {/* Quick Stats Row */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <View style={styles.statHeader}>
            <Ionicons name="today-outline" size={14} color={colors.accent.purple} />
            <Text style={styles.statLabel}>TODAY</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.accent.purple }]}>
            {formatCurrency(todayTotal, currencyCode)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.statLabel}>THIS WEEK</Text>
          </View>
          <Text style={styles.statValue}>
            {formatCurrency(weekTotal, currencyCode)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="calendar-number-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.statLabel}>THIS MONTH</Text>
          </View>
          <Text style={styles.statValue}>
            {formatCurrency(monthTotal, currencyCode)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="stats-chart-outline" size={14} color={colors.accent.amber} />
            <Text style={styles.statLabel}>THIS YEAR</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.accent.amber }]}>
            {formatCurrency(yearTotal, currencyCode)}
          </Text>
        </View>
      </View>

      {/* Spending Trend Chart */}
      <SpendingTrendChart
        timeRange={timeRange}
        weeklyData={weeklyData}
        dailyData30={dailyData30}
        dailyData90={dailyData90}
        yearlyData={yearlyData}
        rangeTotal={rangeTotal}
        previousTotal={comparisonStats.previousTotal}
        changePercent={comparisonStats.changePercent}
        currencyCode={currencyCode}
        dailyAvg={dailyAvg}
      />

      {/* Highest Spending Day Insight */}
      {highestDay.total > 0 && (
        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Ionicons name="flame-outline" size={18} color={colors.accent.red} />
          </View>
          <View style={styles.insightInfo}>
            <Text style={styles.insightLabel}>Highest Spending Day</Text>
            <Text style={styles.insightValue}>
              {formatCurrency(highestDay.total, currencyCode)}
              <Text style={styles.insightDate}>
                {' '}· {new Date(highestDay.date + 'T00:00:00').toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </Text>
          </View>
        </View>
      )}

      {/* Category Breakdown */}
      <CategoryBreakdown
        categories={categoryTotals}
        currencyCode={currencyCode}
        rangeLabel={rangeLabel}
        categoryLimits={budget.categoryLimits}
      />

      {/* Spending Heatmap */}
      <SpendingHeatmap
        entries={entries}
        currencyCode={currencyCode}
        dailyAverage={dailyAvg}
        convertAmount={convertAmount}
      />

      {/* Smart Insights */}
      {rangeEntries.length > 0 && (
        <InsightsPanel
          noSpendDaysMonth={noSpendDays}
          savingMessage={savingMessage}
          dailyAvg={dailyAvg}
          topExpenses={topExpenses}
          currencyCode={currencyCode}
          budgetAmount={budget.amount}
          monthTotal={monthTotal}
        />
      )}

      {/* Day-grouped entries */}
      {groupedEntries.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          <Text style={styles.sectionCount}>
            {rangeEntries.length} in {rangeLabel.toLowerCase()}
          </Text>
        </View>
      )}

      {groupedEntries.slice(0, 5).map((group) => (
        <View key={group.date}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayLabel}>{group.relativeLabel}</Text>
            <Text style={styles.dayTotal}>{formatCurrency(group.total, currencyCode)}</Text>
          </View>
        </View>
      ))}
    </>
  );

  const renderEntriesHeader = () => (
    <>
      {/* Time Range Filter */}
      {renderTimeRangeFilter()}

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search spending..."
        accentColor={colors.accent.purple}
      />

      {/* Quick total for filtered view */}
      <View style={styles.entriesQuickStat}>
        <Text style={styles.entriesQuickLabel}>
          {searchQuery
            ? `Results for "${searchQuery}"`
            : `${rangeLabel} • ${filteredEntries.length} entries`}
        </Text>
        <Text style={styles.entriesQuickTotal}>
          {formatCurrency(
            filteredEntries.reduce((sum, e) => sum + convertAmount(e.amount, e.currency), 0),
            currencyCode
          )}
        </Text>
      </View>
    </>
  );

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <AmbientBackground />
        <View style={styles.header}>
          <Text style={styles.title}>Daily Spending</Text>
        </View>
        <SkeletonLoader variant="debts" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Daily Spending</Text>
        <View style={styles.headerRight}>
          {/* View mode toggle */}
          <View style={styles.toggleWrap}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                viewMode === 'overview' && styles.toggleBtnActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode('overview');
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="stats-chart"
                size={16}
                color={
                  viewMode === 'overview'
                    ? colors.accent.purple
                    : colors.text.muted
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                viewMode === 'entries' && styles.toggleBtnActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode('entries');
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="list"
                size={16}
                color={
                  viewMode === 'entries'
                    ? colors.accent.purple
                    : colors.text.muted
                }
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modals/export-pdf');
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={22}
              color={colors.accent.purple}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/modals/settings')}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={
          viewMode === 'entries'
            ? filteredEntries
            : filteredEntries.slice(0, 10)
        }
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={
          viewMode === 'overview' ? renderOverviewHeader : renderEntriesHeader
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.purple}
            colors={[colors.accent.purple]}
            progressBackgroundColor={colors.background.primary}
          />
        }
        ListEmptyComponent={
          !searchQuery ? (
            <View style={{ paddingVertical: 60 }}>
              <EmptyState
                icon="receipt-outline"
                title="No spending recorded"
                subtitle="Track your daily expenses to understand your spending habits"
                actionLabel="Add Spending"
                onAction={handleAddPress}
                variant="debts"
              />
            </View>
          ) : (
            <View style={styles.noResultsWrap}>
              <Ionicons
                name="search-outline"
                size={36}
                color={colors.text.muted}
              />
              <Text style={styles.noResultsText}>
                No results for "{searchQuery}"
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          viewMode === 'overview' && rangeEntries.length > 10 ? (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode('entries');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>
                View All {rangeEntries.length} Entries
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.accent.purple}
              />
            </TouchableOpacity>
          ) : null
        }
      />

      <AppPopup
        visible={!!deleteId}
        title="Delete Spending"
        message="Are you sure you want to permanently delete this spending entry?"
        icon="trash-outline"
        iconColor={colors.accent.red}
        cancelText="Cancel"
        confirmText="Delete"
        isDestructive={true}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
    },
    title: {
      color: colors.text.primary,
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    toggleWrap: {
      flexDirection: 'row',
      backgroundColor: colors.glass.card,
      borderRadius: 14,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      padding: 3,
    },
    toggleBtn: {
      width: 32,
      height: 28,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleBtnActive: {
      backgroundColor: isDark
        ? 'rgba(124,58,237,0.15)'
        : 'rgba(124,58,237,0.1)',
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark
        ? 'rgba(124,58,237,0.12)'
        : 'rgba(124,58,237,0.1)',
      borderWidth: 0.5,
      borderColor: isDark
        ? 'rgba(124,58,237,0.3)'
        : 'rgba(124,58,237,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.glass.card,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Time Range Filter
    timeFilterScroll: {
      marginBottom: 10,
    },
    timeFilterContainer: {
      paddingHorizontal: 20,
      gap: 8,
    },
    timeFilterPill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    timeFilterPillActive: {
      backgroundColor: isDark
        ? 'rgba(124,58,237,0.18)'
        : 'rgba(124,58,237,0.12)',
      borderColor: isDark
        ? 'rgba(124,58,237,0.4)'
        : 'rgba(124,58,237,0.35)',
    },
    timeFilterText: {
      color: colors.text.muted,
      fontSize: 13,
      fontWeight: '600',
    },
    timeFilterTextActive: {
      color: colors.accent.purple,
      fontWeight: '700',
    },

    // Budget Card
    budgetCard: {
      marginHorizontal: 20,
      marginBottom: 16,
      padding: 18,
      borderRadius: 20,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    budgetLabel: {
      color: colors.text.tertiary,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    budgetAmount: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    budgetStats: {
      alignItems: 'flex-end',
    },
    remainingText: {
      color: colors.accent.green,
      fontSize: 13,
      fontWeight: '600',
    },
    progressBarBg: {
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: colors.accent.purple,
    },

    // Stats Grid
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingHorizontal: 20,
      marginTop: 4,
      marginBottom: 14,
    },
    statCard: {
      flexBasis: '47%',
      flexGrow: 1,
      minHeight: 80,
      borderRadius: 18,
      padding: 14,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      justifyContent: 'space-between',
    },
    statCardPrimary: {
      borderColor: isDark
        ? 'rgba(124,58,237,0.35)'
        : 'rgba(124,58,237,0.25)',
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 6,
    },
    statLabel: {
      color: colors.text.tertiary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    statValue: {
      color: colors.text.primary,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.5,
    },

    // Insight Card
    insightCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginBottom: 14,
      padding: 14,
      borderRadius: 18,
      backgroundColor: isDark
        ? 'rgba(239,83,80,0.08)'
        : 'rgba(220,38,38,0.05)',
      borderWidth: 0.5,
      borderColor: isDark
        ? 'rgba(239,83,80,0.2)'
        : 'rgba(220,38,38,0.15)',
    },
    insightIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark
        ? 'rgba(239,83,80,0.15)'
        : 'rgba(220,38,38,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    insightInfo: {
      flex: 1,
    },
    insightLabel: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.3,
      marginBottom: 2,
    },
    insightValue: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    insightDate: {
      color: colors.text.tertiary,
      fontSize: 13,
      fontWeight: '500',
    },

    // Section header
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 6,
      marginBottom: 12,
    },
    sectionTitle: {
      color: colors.text.secondary,
      fontSize: 15,
      fontWeight: '700',
    },
    sectionCount: {
      color: colors.text.muted,
      fontSize: 12,
      fontWeight: '500',
    },

    // Entries header
    entriesQuickStat: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 12,
      borderRadius: 14,
      backgroundColor: isDark
        ? 'rgba(124,58,237,0.08)'
        : 'rgba(124,58,237,0.05)',
      borderWidth: 0.5,
      borderColor: isDark
        ? 'rgba(124,58,237,0.2)'
        : 'rgba(124,58,237,0.15)',
    },
    entriesQuickLabel: {
      color: colors.text.secondary,
      fontSize: 13,
      fontWeight: '500',
      flex: 1,
    },
    entriesQuickTotal: {
      color: colors.accent.purple,
      fontSize: 16,
      fontWeight: '800',
    },

    // List
    listContent: {
      paddingTop: 4,
      paddingBottom: 120,
    },
    noResultsWrap: {
      alignItems: 'center',
      paddingTop: 40,
      gap: 12,
    },
    noResultsText: {
      color: colors.text.muted,
      fontSize: 15,
    },

    // View all
    viewAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginHorizontal: 20,
      marginTop: 4,
      marginBottom: 8,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: isDark
        ? 'rgba(124,58,237,0.08)'
        : 'rgba(124,58,237,0.06)',
      borderWidth: 0.5,
      borderColor: isDark
        ? 'rgba(124,58,237,0.2)'
        : 'rgba(124,58,237,0.15)',
    },
    viewAllText: {
      color: colors.accent.purple,
      fontSize: 14,
      fontWeight: '600',
    },

    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 8,
      marginBottom: 2,
    },
    dayLabel: {
      color: colors.text.secondary,
      fontSize: 13,
      fontWeight: '700',
    },
    dayTotal: {
      color: colors.accent.purple,
      fontSize: 13,
      fontWeight: '700',
    },
  });
