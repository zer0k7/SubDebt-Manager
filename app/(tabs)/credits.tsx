import { useTheme } from '../../hooks/useTheme';
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard } from '../../components/CreditCard';
import { EmptyState } from '../../components/EmptyState';
import { SwipeableRow } from '../../components/SwipeableRow';
import { AmbientBackground } from '../../components/AmbientBackground';
import { AppPopup } from '../../components/AppPopup';
import { SearchBar } from '../../components/SearchBar';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { Confetti } from '../../components/Confetti';
import { SortFilterSheet, SortOption } from '../../components/SortFilterSheet';
import { useCredits, Credit } from '../../hooks/useCredits';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency } from '../../utils/dateHelpers';
import { FloatingTopHeader } from '../../components/FloatingTopHeader';

const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'returned', label: 'Returned' },
];

const sortOptions: SortOption[] = [
  { id: 'date_desc', label: 'Newest First', icon: 'time-outline' },
  { id: 'date_asc', label: 'Oldest First', icon: 'time-outline' },
  { id: 'amount_desc', label: 'Amount: High to Low', icon: 'trending-down-outline' },
  { id: 'amount_asc', label: 'Amount: Low to High', icon: 'trending-up-outline' },
  { id: 'name_asc', label: 'Name: A to Z', icon: 'text-outline' },
];

export default function CreditsScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { credits, isLoaded, deleteCredit, markCreditAsReturned, getTotalPendingAmount, refresh } = useCredits();
  const { currencyCode, convertAmount, refresh: refreshCurrency } = useCurrency();
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');

  const filteredCredits = useMemo(() => {
    let result = credits;

    if (filter === 'pending') result = result.filter(c => !c.isReturned);
    else if (filter === 'returned') result = result.filter(c => c.isReturned);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c =>
        c.personName.toLowerCase().includes(q) ||
        (c.purpose && c.purpose.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q)) ||
        (c.phoneNumber && c.phoneNumber.includes(q))
      );
    }

    // Apply Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'amount_desc': return convertAmount(b.amount, b.currency) - convertAmount(a.amount, a.currency);
        case 'amount_asc': return convertAmount(a.amount, a.currency) - convertAmount(b.amount, b.currency);
        case 'name_asc': return a.personName.localeCompare(b.personName);
        case 'date_asc': return new Date(a.lentDate).getTime() - new Date(b.lentDate).getTime();
        case 'date_desc':
        default:
          return new Date(b.lentDate).getTime() - new Date(a.lentDate).getTime();
      }
    });

    return result;
  }, [credits, filter, searchQuery, sortBy]);

  const totalPending = getTotalPendingAmount(convertAmount);

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
    router.push('/modals/add-credit');
  };

  const handleMarkReturned = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markCreditAsReturned(id);
    setShowConfetti(true);
  };

  const handleEdit = (credit: Credit) => {
    router.push({
      pathname: '/modals/edit-credit',
      params: { id: credit.id },
    });
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteCredit(deleteId);
      setDeleteId(null);
    }
  };

  const renderItem = ({ item }: { item: Credit }) => (
    <SwipeableRow onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item.id)}>
      <CreditCard
        credit={item}
        onMarkReturned={handleMarkReturned}
        onPress={() => handleEdit(item)}
        onDelete={() => handleDelete(item.id)}
      />
    </SwipeableRow>
  );

  const renderHeader = () => (
    <>
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <Text style={styles.summaryLabel}>Money To Receive</Text>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{credits.filter(c => !c.isReturned).length} pending</Text>
          </View>
        </View>
        <Text style={styles.summaryAmount}>{formatCurrency(totalPending, currencyCode)}</Text>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search credits..."
        accentColor={colors.accent.green}
      />

      {/* Filter Pills & Sort Button */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterPill, filter === opt.key && styles.filterPillActive]}
              onPress={() => setFilter(opt.key)}
            >
              <Text style={[styles.filterText, filter === opt.key && styles.filterTextActive]}>{opt.label}</Text>
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
          <Text style={styles.title}>Credits</Text>
          <View style={styles.headerRight}>
            <View style={styles.iconButton}>
              <Ionicons name="settings-outline" size={22} color={colors.text.tertiary} />
            </View>
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

      {/* Floating Top Bar */}
      <FloatingTopHeader
        title="Credits"
        subtitle="Money Owed to You"
        rightActions={
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/modals/settings')}>
            <Ionicons name="settings-outline" size={19} color={colors.text.tertiary} />
          </TouchableOpacity>
        }
      />

      {filteredCredits.length === 0 && !searchQuery ? (
        <>
          {renderHeader()}
          <EmptyState
            icon="cash-outline"
            title="No credits recorded"
            subtitle="Track money you gave to people and need to collect"
            actionLabel="Add Credit"
            onAction={handleAddPress}
            variant="debts"
          />
        </>
      ) : (
        <FlatList
          data={filteredCredits}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.green}
              colors={[colors.accent.green]}
              progressBackgroundColor={colors.background.primary}
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
        title="Delete Credit"
        message="Are you sure you want to permanently delete this credit? This will remove it from storage."
        icon="trash-outline"
        iconColor={colors.accent.red}
        cancelText="Cancel"
        confirmText="Delete"
        isDestructive={true}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

      <SortFilterSheet
        visible={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        title="Sort Credits"
        options={sortOptions}
        selectedOptionId={sortBy}
        onSelect={setSortBy}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { color: colors.text.primary, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(102,187,106,0.12)', borderWidth: 0.5, borderColor: 'rgba(102,187,106,0.3)', justifyContent: 'center', alignItems: 'center' },
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
  summaryCard: { marginHorizontal: 20, marginTop: 8, marginBottom: 12, padding: 20, borderRadius: 20, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { color: colors.text.tertiary, fontSize: 13, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  pendingBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: 'rgba(102,187,106,0.15)', borderWidth: 0.5, borderColor: 'rgba(102,187,106,0.3)' },
  pendingBadgeText: { color: colors.accent.green, fontSize: 11, fontWeight: '600' },
  summaryAmount: { color: colors.text.primary, fontSize: 34, fontWeight: '700', letterSpacing: -1 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.buttonSecondary },
  filterPillActive: { backgroundColor: 'rgba(102,187,106,0.15)', borderColor: 'rgba(102,187,106,0.4)' },
  filterText: { color: colors.text.muted, fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: colors.accent.green, fontWeight: '600' },
  filterScroll: { gap: 8 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.buttonSecondary, marginLeft: 12 },
  sortBtnText: { color: colors.text.secondary, fontSize: 13, fontWeight: '600' },
  listContent: { paddingTop: 4, paddingBottom: 120 },
  noResultsWrap: { alignItems: 'center', paddingTop: 40, gap: 12 },
  noResultsText: { color: colors.text.muted, fontSize: 15 },
});
