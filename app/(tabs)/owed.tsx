import { useTheme } from '../../hooks/useTheme';
import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DebtCard } from '../../components/DebtCard';
import { CreditCard } from '../../components/CreditCard';
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
import { useCredits, Credit } from '../../hooks/useCredits';
import { useDailySpending } from '../../hooks/useDailySpending';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency } from '../../utils/dateHelpers';
import { FloatingTopHeader } from '../../components/FloatingTopHeader';

const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
];

const sortOptions: SortOption[] = [
  { id: 'date_desc', label: 'Newest First', icon: 'time-outline' },
  { id: 'date_asc', label: 'Oldest First', icon: 'time-outline' },
  { id: 'amount_desc', label: 'Amount: High to Low', icon: 'trending-down-outline' },
  { id: 'amount_asc', label: 'Amount: Low to High', icon: 'trending-up-outline' },
  { id: 'name_asc', label: 'Name: A to Z', icon: 'text-outline' },
];

export default function OwedScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  
  // View mode: 'borrowed' (Debts) or 'lent' (Credits)
  const [viewMode, setViewMode] = useState<'borrowed' | 'lent'>('borrowed');

  const { debts, isLoaded: debtsLoaded, deleteDebt, markDebtAsPaid, getTotalPendingAmount: getDebtPending, getRemainingAmount: getDebtRemaining, refresh: refreshDebts } = useDebts();
  const { credits, isLoaded: creditsLoaded, deleteCredit, markCreditAsReturned, getTotalPendingAmount: getCreditPending, refresh: refreshCredits } = useCredits();
  const { addEntry: addSpendingEntry } = useDailySpending();
  const { currencyCode, convertAmount, refresh: refreshCurrency } = useCurrency();

  const isLoaded = debtsLoaded && creditsLoaded;
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');
  const [shareItem, setShareItem] = useState<{ item: any; type: 'borrowed' | 'lent' } | null>(null);
  const [pendingSpendingDebt, setPendingSpendingDebt] = useState<Debt | null>(null);

  const data = viewMode === 'borrowed' ? debts : credits;
  const accentColor = viewMode === 'borrowed' 
    ? (isDark ? '#FB7185' : '#E11D48') 
    : (isDark ? colors.accent.blue : '#0284C7');

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply filter
    if (filter === 'pending') {
      result = result.filter((d: any) => viewMode === 'borrowed' ? !d.isPaid : !d.isReturned);
    } else if (filter === 'paid') {
      result = result.filter((d: any) => viewMode === 'borrowed' ? d.isPaid : d.isReturned);
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d: any) =>
        d.personName.toLowerCase().includes(q) ||
        (d.purpose && d.purpose.toLowerCase().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q)) ||
        (d.phoneNumber && d.phoneNumber.includes(q))
      );
    }

    // Apply Sort
    result.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'amount_desc': return b.amount - a.amount;
        case 'amount_asc': return a.amount - b.amount;
        case 'name_asc': return a.personName.localeCompare(b.personName);
        case 'date_asc': {
            const dateA = new Date(a.takenDate || a.lentDate).getTime();
            const dateB = new Date(b.takenDate || b.lentDate).getTime();
            return dateA - dateB;
        }
        case 'date_desc':
        default: {
            const dateA = new Date(a.takenDate || a.lentDate).getTime();
            const dateB = new Date(b.takenDate || b.lentDate).getTime();
            return dateB - dateA;
        }
      }
    });

    return result;
  }, [data, filter, searchQuery, sortBy, viewMode]);

  const totalPending = viewMode === 'borrowed' 
    ? getDebtPending(convertAmount) 
    : getCreditPending(convertAmount);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshDebts(), refreshCredits(), refreshCurrency()]);
    setRefreshing(false);
  }, [refreshDebts, refreshCredits, refreshCurrency]);

  useFocusEffect(
    useCallback(() => {
      refreshDebts();
      refreshCredits();
      refreshCurrency();
    }, [refreshDebts, refreshCredits, refreshCurrency])
  );

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(viewMode === 'borrowed' ? '/modals/add-debt' : '/modals/add-credit');
  };

  const handleTogglePaid = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (viewMode === 'borrowed') {
      const itemToShare = debts.find(d => d.id === id);
      markDebtAsPaid(id);
      setShowConfetti(true);
      if (itemToShare) {
        const settledDebt: Debt = {
          ...itemToShare,
          isPaid: true,
          paidDate: new Date().toISOString(),
        };
        setPendingSpendingDebt(settledDebt);
      }
    } else {
      markCreditAsReturned(id);
      const itemToShare = credits.find(c => c.id === id);
      setShowConfetti(true);
      if (itemToShare) {
        setShareItem({
          item: {
            ...itemToShare,
            isReturned: true,
            returnedDate: new Date().toISOString(),
          },
          type: 'lent',
        });
      }
    }
  };

  const handleConfirmSpendingLog = () => {
    if (pendingSpendingDebt) {
      const remainingAmt = getDebtRemaining(pendingSpendingDebt);
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

  const handleEdit = (item: any) => {
    router.push({
      pathname: viewMode === 'borrowed' ? '/modals/edit-debt' : '/modals/edit-credit',
      params: { id: item.id },
    });
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      if (viewMode === 'borrowed') deleteDebt(deleteId);
      else deleteCredit(deleteId);
      setDeleteId(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <SwipeableRow
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item.id)}
    >
      {viewMode === 'borrowed' ? (
        <DebtCard 
          debt={item} 
          onTogglePaid={handleTogglePaid}
          onPress={() => handleEdit(item)}
          onDelete={() => handleDelete(item.id)}
          onSharePress={(d) => setShareItem({ item: d, type: 'borrowed' })}
        />
      ) : (
        <CreditCard 
          credit={item} 
          onMarkReturned={handleTogglePaid}
          onPress={() => handleEdit(item)}
          onDelete={() => handleDelete(item.id)}
          onSharePress={(c) => setShareItem({ item: c, type: 'lent' })}
        />
      )}
    </SwipeableRow>
  );

  const renderHeader = () => (
    <>
      {/* Segmented Control */}
      <View style={styles.segmentedWrapper}>
        <TouchableOpacity 
          style={[styles.segment, viewMode === 'borrowed' && styles.segmentActiveBorrowed]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setViewMode('borrowed');
          }}
        >
          <Ionicons name="arrow-down-circle" size={18} color={viewMode === 'borrowed' ? '#fff' : colors.text.tertiary} />
          <Text style={[styles.segmentText, viewMode === 'borrowed' && styles.segmentTextActive]}>Borrowed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segment, viewMode === 'lent' && styles.segmentActiveLent]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setViewMode('lent');
          }}
        >
          <Ionicons name="arrow-up-circle" size={18} color={viewMode === 'lent' ? '#fff' : colors.text.tertiary} />
          <Text style={[styles.segmentText, viewMode === 'lent' && styles.segmentTextActive]}>Lent</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={[
        styles.summaryCard, 
        { 
          borderColor: viewMode === 'borrowed' 
            ? (isDark ? 'rgba(251,113,133,0.35)' : 'rgba(225,29,72,0.25)') 
            : (isDark ? 'rgba(79,195,247,0.35)' : 'rgba(2,132,199,0.25)') 
        }
      ]}>
        <View style={styles.summaryTop}>
          <Text style={styles.summaryLabel}>{viewMode === 'borrowed' ? 'Total to Pay' : 'Total to Collect'}</Text>
          <View style={[
            styles.pendingBadge, 
            { 
              backgroundColor: viewMode === 'borrowed' 
                ? (isDark ? 'rgba(251,113,133,0.15)' : '#FFE4E6') 
                : (isDark ? 'rgba(79,195,247,0.15)' : '#E0F2FE') 
            }
          ]}>
            <Text style={[styles.pendingBadgeText, { color: accentColor }]}>
              {data.filter((d: any) => viewMode === 'borrowed' ? !d.isPaid : !d.isReturned).length} pending
            </Text>
          </View>
        </View>
        <Text style={[styles.summaryAmount, { color: accentColor }]}>
          {formatCurrency(totalPending, currencyCode)}
        </Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={`Search ${viewMode}...`}
        accentColor={accentColor}
      />

      {/* Filter & Sort */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterPill, filter === opt.key && { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40` }]}
              onPress={() => setFilter(opt.key)}
            >
              <Text style={[styles.filterText, filter === opt.key && { color: accentColor, fontWeight: '700' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity 
          style={styles.sortBtn} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowSortSheet(true);
          }}
        >
          <Ionicons name="swap-vertical" size={18} color={colors.text.secondary} />
          <Text style={styles.sortBtnText}>Sort</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <AmbientBackground />
        <View style={styles.header}>
          <Text style={styles.title}>Manager</Text>
        </View>
        <SkeletonLoader variant="debts" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      <Confetti visible={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* Floating Top Bar */}
      <FloatingTopHeader
        title="Ledger"
        subtitle={viewMode === 'borrowed' ? 'Debts & Borrowed' : 'Credits & Owed'}
        rightActions={
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/modals/settings')}>
            <Ionicons name="settings-outline" size={19} color={colors.text.tertiary} />
          </TouchableOpacity>
        }
      />

      {filteredData.length === 0 && !searchQuery ? (
        <>
          {renderHeader()}
          <EmptyState
            icon={viewMode === 'borrowed' ? "wallet-outline" : "cash-outline"}
            title={`No ${viewMode} recorded`}
            subtitle={viewMode === 'borrowed' ? "Track money you owe to people" : "Track money people owe you"}
            actionLabel={`Add ${viewMode === 'borrowed' ? 'Debt' : 'Credit'}`}
            onAction={handleAddPress}
            variant={viewMode === 'borrowed' ? "debts" : "credits"}
          />
        </>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={accentColor}
            />
          }
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.noResultsWrap}>
                <Ionicons name="search-outline" size={36} color={colors.text.muted} />
                <Text style={styles.noResultsText}>No results for "{searchQuery}"</Text>
              </View>
            ) : null
          }
        />
      )}

      <AppPopup 
        visible={!!deleteId}
        title={`Delete ${viewMode === 'borrowed' ? 'Debt' : 'Credit'}`}
        message="Are you sure you want to permanently delete this? Action cannot be undone."
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
                getDebtRemaining(pendingSpendingDebt) > 0
                  ? getDebtRemaining(pendingSpendingDebt)
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
        title="Sort Results"
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
    gap: 16,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  segmentedWrapper: {
    flexDirection: 'row',
    backgroundColor: isDark ? 'rgba(18, 18, 28, 0.88)' : '#FFFFFF',
    padding: 4,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  segmentActiveBorrowed: {
    backgroundColor: isDark ? '#F43F5E' : '#E11D48',
  },
  segmentActiveLent: {
    backgroundColor: isDark ? colors.accent.blue : '#0284C7',
  },
  segmentText: {
    color: isDark ? colors.text.muted : '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(18, 18, 28, 0.88)' : '#FFFFFF',
    borderWidth: 1,
    elevation: isDark ? 2 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.06,
    shadowRadius: 8,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: colors.text.tertiary,
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.buttonSecondary,
  },
  filterText: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  filterScroll: {
    gap: 8,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.buttonSecondary,
    marginLeft: 12,
  },
  sortBtnText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
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
});
