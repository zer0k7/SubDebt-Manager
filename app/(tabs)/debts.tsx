import { useTheme } from '../../hooks/useTheme';
import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { DebtCard } from '../../components/DebtCard';
import { EmptyState } from '../../components/EmptyState';
import { SwipeableRow } from '../../components/SwipeableRow';
import { AmbientBackground } from '../../components/AmbientBackground';
import { AppPopup } from '../../components/AppPopup';
import { SearchBar } from '../../components/SearchBar';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { Confetti } from '../../components/Confetti';
import { SortFilterSheet, SortOption } from '../../components/SortFilterSheet';
import { SettlementCardModal } from '../../components/SettlementCardModal';
import { useDebts, Debt } from '../../hooks/useDebts';
import { useDailySpending } from '../../hooks/useDailySpending';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency } from '../../utils/dateHelpers';
import { FloatingTopHeader } from '../../components/FloatingTopHeader';

const filterOptions = [
  { key: 'all', label: 'All Debts', icon: 'albums-outline' },
  { key: 'pending', label: 'Pending', icon: 'time-outline' },
  { key: 'paid', label: 'Cleared', icon: 'checkmark-circle-outline' },
];

const sortOptions: SortOption[] = [
  { id: 'date_desc', label: 'Newest First', icon: 'time-outline' },
  { id: 'date_asc', label: 'Oldest First', icon: 'time-outline' },
  { id: 'amount_desc', label: 'Amount: High to Low', icon: 'trending-down-outline' },
  { id: 'amount_asc', label: 'Amount: Low to High', icon: 'trending-up-outline' },
  { id: 'name_asc', label: 'Name: A to Z', icon: 'text-outline' },
];

export default function DebtsScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { debts, isLoaded, deleteDebt, markDebtAsPaid, getTotalPendingAmount, getRemainingAmount, refresh } = useDebts();
  const { addEntry: addSpendingEntry } = useDailySpending();
  const { currencyCode, convertAmount, refresh: refreshCurrency } = useCurrency();
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');
  const [shareItem, setShareItem] = useState<{ item: any; type: 'borrowed' | 'lent' } | null>(null);
  const [pendingSpendingDebt, setPendingSpendingDebt] = useState<Debt | null>(null);

  const filteredDebts = useMemo(() => {
    let result = debts;
    if (filter === 'pending') result = result.filter(d => !d.isPaid);
    else if (filter === 'paid') result = result.filter(d => d.isPaid);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d =>
        d.personName.toLowerCase().includes(q) ||
        (d.purpose && d.purpose.toLowerCase().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q)) ||
        (d.phoneNumber && d.phoneNumber.includes(q))
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'amount_desc': return convertAmount(b.amount, b.currency) - convertAmount(a.amount, a.currency);
        case 'amount_asc': return convertAmount(a.amount, a.currency) - convertAmount(b.amount, b.currency);
        case 'name_asc': return a.personName.localeCompare(b.personName);
        case 'date_asc': return new Date(a.takenDate).getTime() - new Date(b.takenDate).getTime();
        case 'date_desc':
        default:
          return new Date(b.takenDate).getTime() - new Date(a.takenDate).getTime();
      }
    });

    return result;
  }, [debts, filter, searchQuery, sortBy]);

  const totalPending = getTotalPendingAmount(convertAmount);
  const pendingCount = debts.filter(d => !d.isPaid).length;
  const paidCount = debts.filter(d => d.isPaid).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshCurrency();
    }, [refresh, refreshCurrency])
  );

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/modals/add-debt');
  };

  const handleTogglePaid = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markDebtAsPaid(id);
    const itemToShare = debts.find(d => d.id === id);
    setShowConfetti(true);
    if (itemToShare) {
      const settledDebt: Debt = {
        ...itemToShare,
        isPaid: true,
        paidDate: new Date().toISOString(),
      };
      setPendingSpendingDebt(settledDebt);
    }
  };

  const handleConfirmSpendingLog = () => {
    if (pendingSpendingDebt) {
      const remainingAmt = getRemainingAmount(pendingSpendingDebt);
      const logAmount = remainingAmt > 0 ? remainingAmt : pendingSpendingDebt.amount;
      addSpendingEntry({
        title: `Repaid debt: ${pendingSpendingDebt.personName}`,
        amount: logAmount,
        currency: pendingSpendingDebt.currency,
        category: 'Debt & EMI',
        spentAt: new Date().toISOString(),
        notes: pendingSpendingDebt.purpose ? `Purpose: ${pendingSpendingDebt.purpose}` : undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const itemToShare = pendingSpendingDebt;
      setPendingSpendingDebt(null);
      setShareItem({
        item: itemToShare,
        type: 'borrowed',
      });
    }
  };

  const handleSkipSpendingLog = () => {
    if (pendingSpendingDebt) {
      const itemToShare = pendingSpendingDebt;
      setPendingSpendingDebt(null);
      setShareItem({
        item: itemToShare,
        type: 'borrowed',
      });
    }
  };

  const handleEdit = (debt: Debt) => {
    router.push({ pathname: '/modals/edit-debt', params: { id: debt.id } });
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) { deleteDebt(deleteId); setDeleteId(null); }
  };

  const renderItem = ({ item }: { item: Debt }) => (
    <SwipeableRow onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item.id)}>
      <DebtCard
        debt={item}
        onTogglePaid={handleTogglePaid}
        onPress={() => handleEdit(item)}
        onDelete={() => handleDelete(item.id)}
        onSharePress={(d) => setShareItem({ item: d, type: 'borrowed' })}
      />
    </SwipeableRow>
  );

  const renderHeader = () => (
    <>
      {/* ── Hero Summary Card ── */}
      <LinearGradient
        colors={isDark
          ? ['rgba(244,63,94,0.18)', 'rgba(225,29,72,0.08)', 'transparent'] as const
          : ['rgba(244,63,94,0.12)', 'rgba(251,113,133,0.06)', 'transparent'] as const
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradientWrap}
      >
        <View style={styles.heroCard}>
          {/* Decorative top-right orb */}
          <View style={styles.heroOrb} />

          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>BORROWED TOTAL</Text>
              <Text style={styles.heroAmount}>{formatCurrency(totalPending, currencyCode)}</Text>
            </View>
            <View style={styles.heroIconCircle}>
              <Ionicons name="wallet-outline" size={26} color={isDark ? '#FB7185' : '#E11D48'} />
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <View style={[styles.heroStatDot, { backgroundColor: isDark ? '#FB7185' : '#E11D48' }]} />
              <Text style={styles.heroStatLabel}>Pending</Text>
              <Text style={styles.heroStatValue}>{pendingCount}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <View style={[styles.heroStatDot, { backgroundColor: colors.accent.green }]} />
              <Text style={styles.heroStatLabel}>Cleared</Text>
              <Text style={styles.heroStatValue}>{paidCount}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <View style={[styles.heroStatDot, { backgroundColor: colors.accent.blue }]} />
              <Text style={styles.heroStatLabel}>Total</Text>
              <Text style={styles.heroStatValue}>{debts.length}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── Search ── */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name, purpose..."
        accentColor={isDark ? '#FB7185' : '#E11D48'}
      />

      {/* ── Filter Pills + Sort ── */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterPill, filter === opt.key && styles.filterPillActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(opt.key);
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={opt.icon as any}
                size={13}
                color={filter === opt.key ? (isDark ? '#FB7185' : '#E11D48') : colors.text.muted}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterText, filter === opt.key && styles.filterTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSortSheet(true); }}
          activeOpacity={0.75}
        >
          <Ionicons name="funnel-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.sortBtnText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* ── Section label ── */}
      {filteredDebts.length > 0 && (
        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>
            {filteredDebts.length} {filter === 'all' ? 'debt' : filter}{filteredDebts.length !== 1 ? 's' : ''}
          </Text>
          <View style={styles.sectionLine} />
        </View>
      )}
    </>
  );

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <AmbientBackground />
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>TRACKER</Text>
            <Text style={styles.title}>Debts</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.iconButton}><Ionicons name="settings-outline" size={20} color={colors.text.tertiary} /></View>
          </View>
        </View>
        <SkeletonLoader variant="debts" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      <Confetti visible={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* ── Floating Top Bar ── */}
      <FloatingTopHeader
        title="Debts"
        subtitle="Money You Owe"
        rightActions={
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/modals/settings')} activeOpacity={0.8}>
            <Ionicons name="settings-outline" size={19} color={colors.text.tertiary} />
          </TouchableOpacity>
        }
      />

      {filteredDebts.length === 0 && !searchQuery ? (
        <>
          {renderHeader()}
          <EmptyState
            icon="wallet-outline"
            title="No debts recorded"
            subtitle="Track money you owe to people"
            actionLabel="Add Debt"
            onAction={handleAddPress}
            variant="debts"
          />
        </>
      ) : (
        <FlatList
          data={filteredDebts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.amber}
              colors={[colors.accent.amber]}
              progressBackgroundColor={isDark ? '#1a1a2e' : '#fff'}
            />
          }
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.noResultsWrap}>
                <View style={styles.noResultsIconWrap}>
                  <Ionicons name="search-outline" size={28} color={colors.text.muted} />
                </View>
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsText}>No debts match "{searchQuery}"</Text>
              </View>
            ) : null
          }
        />
      )}

      <AppPopup
        visible={!!deleteId}
        title="Delete Debt?"
        message="This will permanently remove this debt record from your ledger. This action cannot be undone."
        icon="trash-outline"
        iconColor={colors.accent.red}
        cancelText="Cancel"
        confirmText="Delete"
        isDestructive={true}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

      <AppPopup
        visible={!!pendingSpendingDebt}
        title="Log in Daily Spending?"
        message={
          pendingSpendingDebt
            ? `Would you like to record this payment of ${formatCurrency(
                getRemainingAmount(pendingSpendingDebt) > 0
                  ? getRemainingAmount(pendingSpendingDebt)
                  : pendingSpendingDebt.amount,
                pendingSpendingDebt.currency
              )} to ${pendingSpendingDebt.personName} as an expense in Daily Spending?`
            : ''
        }
        icon="wallet-outline"
        iconColor={colors.accent.green}
        cancelText="Skip"
        confirmText="Log Expense"
        onCancel={handleSkipSpendingLog}
        onConfirm={handleConfirmSpendingLog}
      />

      <SortFilterSheet
        visible={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        title="Sort Debts"
        options={sortOptions}
        selectedOptionId={sortBy}
        onSelect={setSortBy}
      />

      <SettlementCardModal
        visible={!!shareItem}
        onClose={() => setShareItem(null)}
        item={shareItem?.item}
        type={shareItem?.type}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerEyebrow: {
    color: isDark ? '#FB7185' : '#E11D48',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 2,
    opacity: 0.9,
  },
  title: {
    color: colors.text.primary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(244,63,94,0.15)' : '#FFE4E6',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(244,63,94,0.3)' : '#FDA4AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Hero Summary Card ──
  heroGradientWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 14,
    borderRadius: 24,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: isDark ? 'rgba(18,18,28,0.88)' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(251,113,133,0.25)' : 'rgba(225,29,72,0.18)',
    overflow: 'hidden',
    ...(isDark ? {} : {
      shadowColor: 'rgba(225,29,72,0.15)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 4,
    }),
  },
  heroOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: isDark ? 'rgba(244,63,94,0.08)' : 'rgba(225,29,72,0.06)',
    top: -30,
    right: -20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  heroEyebrow: {
    color: isDark ? '#FB7185' : '#BE123C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroAmount: {
    color: colors.text.primary,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: isDark ? 'rgba(244,63,94,0.15)' : '#FFE4E6',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(244,63,94,0.3)' : '#FDA4AF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats row
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 0.5,
    borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  heroStatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroStatLabel: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  heroStatValue: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
  },

  // ── Filters ──
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterScroll: {
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
  },
  filterPillActive: {
    backgroundColor: isDark ? 'rgba(244,63,94,0.18)' : '#FFE4E6',
    borderColor: isDark ? 'rgba(244,63,94,0.4)' : '#FDA4AF',
  },
  filterText: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: isDark ? '#FB7185' : '#E11D48',
    fontWeight: '700',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
  },
  sortBtnText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Section label ──
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 10,
  },
  sectionLabel: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  sectionLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
  },

  listContent: {
    paddingTop: 4,
    paddingBottom: 120,
  },

  // ── Empty / No Results ──
  noResultsWrap: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 10,
  },
  noResultsIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  noResultsTitle: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '700',
  },
  noResultsText: {
    color: colors.text.muted,
    fontSize: 13,
  },
});
