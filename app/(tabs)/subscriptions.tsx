import { useTheme } from '../../hooks/useTheme';
import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  SectionList, ScrollView, Platform, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SubscriptionCard } from '../../components/SubscriptionCard';
import { EmptyState } from '../../components/EmptyState';
import { AmbientBackground } from '../../components/AmbientBackground';
import { AppPopup } from '../../components/AppPopup';
import { SearchBar } from '../../components/SearchBar';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { useSubscriptions, Subscription } from '../../hooks/useSubscriptions';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency, formatShortDate } from '../../utils/dateHelpers';
import { getSubscriptionIcon } from '../../utils/subscriptionIcons';
import { SubscriptionIcon } from '../../components/SubscriptionIcon';
import { SUBSCRIPTION_PRESETS } from '../../constants/subscriptionPresets';
import { FloatingTopHeader } from '../../components/FloatingTopHeader';

const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'expiring', label: 'Due Soon' },
  { key: 'trials', label: 'Trials' },
  { key: 'paused', label: 'Paused' },
];

const CATEGORY_ICONS: Record<string, string> = {
  'Entertainment': 'film-outline',
  'Productivity': 'rocket-outline',
  'Utilities': 'construct-outline',
  'Gaming': 'game-controller-outline',
  'Health & Fitness': 'heart-outline',
  'News & Reading': 'newspaper-outline',
  'AI': 'hardware-chip-outline',
  'Dev Tools': 'code-slash-outline',
  'Recharges': 'flash-outline',
  'Other': 'ellipsis-horizontal-outline',
  'Uncategorized': 'apps-outline',
};

export default function SubscriptionsScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { 
    subscriptions, isLoaded, deleteSubscription, toggleSubscriptionActive,
    markAsRenewed, getMonthlyBurnRate, getYearlyBurnRate, refresh 
  } = useSubscriptions();
  const { currencyCode, convertAmount, refresh: refreshCurrency } = useCurrency();

  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renewSub, setRenewSub] = useState<Subscription | null>(null);
  const [logExpenseOnRenew, setLogExpenseOnRenew] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [showYearlyBurn, setShowYearlyBurn] = useState(false);

  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(new Date().getDate());

  // Reload data when focused
  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshCurrency();
    }, [refresh, refreshCurrency])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refresh();
    await refreshCurrency();
    setRefreshing(false);
  }, [refresh, refreshCurrency]);

  const monthlyBurn = useMemo(() => getMonthlyBurnRate(convertAmount), [getMonthlyBurnRate, convertAmount]);
  const yearlyBurn = useMemo(() => getYearlyBurnRate(convertAmount), [getYearlyBurnRate, convertAmount]);

  // Calendar Day Map
  const calendarDueMap = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const dueMap: Record<number, Subscription[]> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      dueMap[i] = [];
    }

    subscriptions.forEach((sub) => {
      if (!sub.isActive) return;

      const targetDate = sub.isTrial && sub.trialEndDate ? sub.trialEndDate : sub.expiryDate || sub.startDate;
      const start = new Date(targetDate);
      if (isNaN(start.getTime())) return;

      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth, daysInMonth, 23, 59, 59);

      let occurrence = new Date(start.getTime());

      if (occurrence.getTime() < startOfMonth.getTime()) {
        let catchUpCount = 0;
        while (occurrence.getTime() < startOfMonth.getTime() && catchUpCount < 120) {
          catchUpCount++;
          if (sub.billingCycle === 'weekly') {
            occurrence.setDate(occurrence.getDate() + 7);
          } else if (sub.billingCycle === 'monthly') {
            occurrence.setMonth(occurrence.getMonth() + 1);
          } else if (sub.billingCycle === 'yearly') {
            occurrence.setFullYear(occurrence.getFullYear() + 1);
          } else {
            occurrence.setMonth(occurrence.getMonth() + 1);
          }
        }
      }

      let safetyCount = 0;
      while (occurrence.getTime() <= endOfMonth.getTime() && safetyCount < 120) {
        safetyCount++;
        const oYear = occurrence.getFullYear();
        const oMonth = occurrence.getMonth();
        const oDay = occurrence.getDate();

        if (oYear === currentYear && oMonth === currentMonth) {
          dueMap[oDay].push(sub);
        }

        if (sub.billingCycle === 'weekly') {
          occurrence.setDate(occurrence.getDate() + 7);
        } else if (sub.billingCycle === 'monthly') {
          occurrence.setMonth(occurrence.getMonth() + 1);
        } else if (sub.billingCycle === 'yearly') {
          occurrence.setFullYear(occurrence.getFullYear() + 1);
        } else {
          occurrence.setMonth(occurrence.getMonth() + 1);
        }
      }
    });

    return dueMap;
  }, [subscriptions]);

  const calendarDays = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    return Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const date = new Date(currentYear, currentMonth, day);
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        day,
        weekday,
        isToday: day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear(),
      };
    });
  }, []);

  const upcomingRenewals = useMemo(() => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return subscriptions
      .filter(s => {
        if (!s.isActive) return false;
        const target = s.isTrial && s.trialEndDate ? s.trialEndDate : s.expiryDate;
        if (!target) return false;
        const expiryTime = new Date(target).getTime();
        const diff = expiryTime - now;
        return diff <= sevenDays;
      })
      .map(s => {
        const target = s.isTrial && s.trialEndDate ? s.trialEndDate : s.expiryDate;
        const daysLeft = Math.ceil((new Date(target).getTime() - now) / (1000 * 60 * 60 * 24));
        return { ...s, daysLeft };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [subscriptions]);

  const isExpired = (date?: string) => date ? new Date(date).getTime() < Date.now() : false;

  const filteredSubscriptions = useMemo(() => {
    let result = subscriptions;

    if (filter === 'active') {
      result = result.filter(s => s.isActive && !s.isTrial);
    } else if (filter === 'expiring') {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      result = result.filter(s => {
        if (!s.isActive) return false;
        const target = s.isTrial && s.trialEndDate ? s.trialEndDate : s.expiryDate;
        if (!target) return false;
        const daysLeft = new Date(target).getTime() - Date.now();
        return daysLeft <= sevenDays;
      });
    } else if (filter === 'trials') {
      result = result.filter(s => s.isTrial);
    } else if (filter === 'paused') {
      result = result.filter(s => !s.isActive || s.status === 'paused');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) ||
        (s.category && s.category.toLowerCase().includes(query)) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        (s.paymentMethod && s.paymentMethod.toLowerCase().includes(query))
      );
    }

    return result;
  }, [subscriptions, filter, searchQuery]);

  // Group by category
  const categorySections = useMemo(() => {
    if (!groupByCategory) return [];

    const groups: Record<string, Subscription[]> = {};
    filteredSubscriptions.forEach((sub) => {
      const cat = sub.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(sub);
    });

    return Object.keys(groups)
      .sort()
      .map((cat) => ({
        title: cat,
        data: groups[cat],
      }));
  }, [filteredSubscriptions, groupByCategory]);

  const handleEdit = (sub: Subscription) => {
    router.push(`/modals/edit-subscription?id=${sub.id}` as any);
  };

  const handleConfirmRenew = async () => {
    if (!renewSub) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markAsRenewed(renewSub.id, {
      logToSpending: logExpenseOnRenew,
      spendingCategory: renewSub.category || 'Subscriptions',
    });
    setRenewSub(null);
  };

  const renderHeader = () => (
    <>
      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search subscriptions, categories..."
        />
      </View>

      {/* Burn Rate Summary Card */}
      <TouchableOpacity
        style={styles.summaryCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowYearlyBurn(!showYearlyBurn);
        }}
        activeOpacity={0.85}
      >
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>
              {showYearlyBurn ? 'YEARLY OUTFLOW' : 'MONTHLY BURN RATE'}
            </Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(showYearlyBurn ? yearlyBurn : monthlyBurn, currencyCode)}
            </Text>
          </View>

          <View style={styles.statsPillBox}>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>
                {subscriptions.filter(s => s.isActive && !s.isTrial).length} active
              </Text>
            </View>
            {subscriptions.filter(s => s.isTrial).length > 0 && (
              <View style={[styles.statChip, { backgroundColor: 'rgba(255,167,38,0.15)' }]}>
                <Text style={[styles.statChipText, { color: '#FFA726' }]}>
                  {subscriptions.filter(s => s.isTrial).length} trial
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.summaryFooter}>
          <Ionicons name="swap-horizontal" size={13} color={colors.accent.blue} />
          <Text style={styles.summaryFooterText}>
            Tap to toggle {showYearlyBurn ? 'monthly burn' : 'yearly estimate'} (~{formatCurrency(showYearlyBurn ? monthlyBurn : yearlyBurn, currencyCode)}/{showYearlyBurn ? 'mo' : 'yr'})
          </Text>
        </View>
      </TouchableOpacity>

      {/* Monthly Billing Calendar */}
      {subscriptions.length > 0 && (
        <View style={styles.calendarCard}>
          <Text style={styles.calendarHeaderLabel}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()} BILL CALENDAR
          </Text>
          
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={calendarDays}
            keyExtractor={(item) => String(item.day)}
            contentContainerStyle={styles.calendarScrollContent}
            initialScrollIndex={Math.max(0, (selectedCalendarDay || new Date().getDate()) - 3)}
            getItemLayout={(_, index) => ({
              length: 54,
              offset: 54 * index,
              index,
            })}
            renderItem={({ item }) => {
              const isSelected = selectedCalendarDay === item.day;
              const dueSubs = calendarDueMap[item.day] || [];
              
              return (
                <TouchableOpacity
                  style={[
                    styles.dayCapsule,
                    item.isToday && styles.dayCapsuleToday,
                    isSelected && styles.dayCapsuleSelected,
                    { borderColor: isSelected ? colors.accent.blue : item.isToday ? 'rgba(79,195,247,0.4)' : colors.glass.cardBorder }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCalendarDay(selectedCalendarDay === item.day ? null : item.day);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.dayOfWeekText,
                    isSelected ? { color: colors.accent.blue, fontWeight: '700' } : item.isToday ? { color: colors.accent.blue } : { color: colors.text.muted }
                  ]}>
                    {item.weekday}
                  </Text>
                  <Text style={[
                    styles.dayNumberText,
                    isSelected ? { color: colors.accent.blue, fontWeight: '800' } : { color: colors.text.primary }
                  ]}>
                    {item.day}
                  </Text>
                  
                  {/* Dot indicators */}
                  <View style={styles.dotsContainer}>
                    {dueSubs.slice(0, 3).map((sub, sIdx) => {
                      const iconMeta = getSubscriptionIcon(sub.name);
                      const dotColor = sub.color || iconMeta.color || colors.accent.blue;
                      return (
                        <View 
                          key={`${sub.id}-${sIdx}`} 
                          style={[styles.dotIndicator, { backgroundColor: dotColor }]} 
                        />
                      );
                    })}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Selected Day Renewal Detail */}
          {selectedCalendarDay !== null && (() => {
            const dueList = calendarDueMap[selectedCalendarDay] || [];
            const now = new Date();
            const dayLabel = selectedCalendarDay === now.getDate() ? 'Today' : selectedCalendarDay === now.getDate() + 1 ? 'Tomorrow' : `Day ${selectedCalendarDay}`;
            const formattedTotal = formatCurrency(
              dueList.reduce((sum, s) => {
                const amt = s.isShared && s.myShareAmount ? s.myShareAmount : s.amount;
                return sum + convertAmount(amt, s.currency);
              }, 0),
              currencyCode
            );

            return (
              <View style={styles.dayDetailCard}>
                <View style={styles.dayDetailHeader}>
                  <Text style={styles.dayDetailTitle}>
                    Renewals for {dayLabel} ({dueList.length})
                  </Text>
                  {dueList.length > 0 && (
                    <Text style={styles.dayDetailTotal}>
                      {formattedTotal} due
                    </Text>
                  )}
                </View>

                {dueList.length > 0 ? (
                  <View style={styles.dayDetailList}>
                    {dueList.map((sub) => {
                      const iconMeta = getSubscriptionIcon(sub.name);
                      const brandColor = sub.color || iconMeta.color || colors.accent.blue;
                      const amt = sub.isShared && sub.myShareAmount ? sub.myShareAmount : sub.amount;
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          style={styles.dayDetailRow}
                          onPress={() => handleEdit(sub)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.dayDetailDot, { backgroundColor: brandColor }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dayDetailName}>{sub.name}</Text>
                            <Text style={styles.dayDetailCycle}>
                              {sub.billingCycle.toUpperCase()} BILL
                            </Text>
                          </View>
                          <Text style={styles.dayDetailAmount}>
                            {formatCurrency(amt, sub.currency)}
                          </Text>
                          <Ionicons name="chevron-forward" size={14} color={colors.text.muted} style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.dayDetailEmpty}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={colors.accent.green} />
                    <Text style={styles.dayDetailEmptyText}>No subscriptions renew on this date</Text>
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      )}

      {/* Filter Tabs & Group Toggle */}
      <View style={styles.controlsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterChip, filter === opt.key && styles.filterChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(opt.key);
              }}
            >
              <Text style={[styles.filterText, filter === opt.key && styles.filterTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.groupToggleBtn, groupByCategory && styles.groupToggleBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setGroupByCategory(!groupByCategory);
          }}
        >
          <Ionicons
            name={groupByCategory ? 'folder' : 'folder-outline'}
            size={16}
            color={groupByCategory ? colors.accent.purple || '#AB47BC' : colors.text.muted}
          />
        </TouchableOpacity>
      </View>
    </>
  );

  const renderItem = ({ item }: { item: Subscription }) => (
    <SubscriptionCard
      subscription={item}
      onPress={() => handleEdit(item)}
      onDelete={() => setDeleteId(item.id)}
      onRenew={() => setRenewSub(item)}
      onToggleActive={() => toggleSubscriptionActive(item.id)}
    />
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => {
    const iconName = CATEGORY_ICONS[title] || 'pricetag-outline';
    return (
      <View style={styles.sectionHeaderWrap}>
        <Ionicons name={iconName as any} size={15} color={colors.accent.blue} />
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
    );
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <AmbientBackground />
        <SkeletonLoader />
      </SafeAreaView>
    );
  }

  // 1. Completely Empty State (0 subscriptions added ever)
  if (subscriptions.length === 0 && !searchQuery) {
    return (
      <SafeAreaView style={styles.container}>
        <AmbientBackground />
        
        {/* Floating Top Bar */}
        <FloatingTopHeader
          title="Subscriptions"
          subtitle="Recurring & Trials"
          rightActions={
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/modals/add-subscription')}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          }
        />

        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <EmptyState
            icon="card-outline"
            title="No Subscriptions Yet"
            subtitle="Track all your recurring payments, trials, and shared family plans with smart alarms."
            actionLabel="Add Subscription"
            onAction={() => router.push('/modals/add-subscription')}
            variant="subscriptions"
          >
            {/* Quick Preset Shortcuts in Empty State */}
            <View style={styles.emptyPresetContainer}>
              <Text style={styles.emptyPresetTitle}>Or tap a popular service to start:</Text>
              <View style={styles.emptyPresetGrid}>
                {SUBSCRIPTION_PRESETS.slice(0, 6).map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={styles.emptyPresetChip}
                    onPress={() => router.push('/modals/add-subscription')}
                  >
                    <SubscriptionIcon name={preset.iconKey} size={28} />
                    <Text style={styles.emptyPresetName}>{preset.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </EmptyState>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 2. Normal List / Section View
  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      
      {/* Floating Top Bar */}
      <FloatingTopHeader
        title="Subscriptions"
        subtitle="Recurring & Trials"
        rightActions={
          <>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/modals/tool-subscription-forecast');
              }}
            >
              <Ionicons name="calendar-outline" size={19} color={colors.accent.purple || '#AB47BC'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/modals/add-subscription')}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        }
      />

      {groupByCategory && categorySections.length > 0 ? (
        <SectionList
          sections={categorySections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.blue}
              colors={[colors.accent.blue]}
              progressBackgroundColor="#1a1a2e"
            />
          }
        />
      ) : (
        <FlatList
          data={filteredSubscriptions}
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
              tintColor={colors.accent.blue}
              colors={[colors.accent.blue]}
              progressBackgroundColor="#1a1a2e"
            />
          }
          ListEmptyComponent={
            <View style={styles.noResultsWrap}>
              <Ionicons name="search-outline" size={40} color={colors.text.muted} />
              <Text style={styles.noResultsText}>
                {searchQuery ? `No results for "${searchQuery}"` : 'No subscriptions in this filter'}
              </Text>
            </View>
          }
        />
      )}

      {/* Delete Popup */}
      <AppPopup
        visible={deleteId !== null}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription? Reminder alarms will also be cancelled."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        onConfirm={async () => {
          if (deleteId) {
            await deleteSubscription(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />

      {/* 1-Tap Renew Confirmation Modal */}
      <Modal visible={renewSub !== null} transparent animationType="fade" onRequestClose={() => setRenewSub(null)}>
        <View style={styles.renewModalOverlay}>
          <View style={styles.renewModalCard}>
            <View style={styles.renewModalHeader}>
              <SubscriptionIcon name={renewSub?.iconKey || renewSub?.name || ''} size={48} />
              <Text style={styles.renewModalTitle}>Renew {renewSub?.name}</Text>
              <Text style={styles.renewModalSubtitle}>
                This will advance the renewal date to the next {renewSub?.billingCycle} cycle.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logSpendingToggle}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLogExpenseOnRenew(!logExpenseOnRenew);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={logExpenseOnRenew ? 'checkbox' : 'square-outline'}
                size={22}
                color={logExpenseOnRenew ? colors.accent.blue : colors.text.muted}
              />
              <Text style={styles.logSpendingText}>
                Auto-log {formatCurrency(renewSub?.isShared && renewSub.myShareAmount ? renewSub.myShareAmount : (renewSub?.amount || 0), renewSub?.currency || 'INR')} in Daily Spending
              </Text>
            </TouchableOpacity>

            <View style={styles.renewModalBtns}>
              <TouchableOpacity style={styles.renewConfirmBtn} onPress={handleConfirmRenew}>
                <Text style={styles.renewConfirmText}>Confirm Renewal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.renewCancelBtn} onPress={() => setRenewSub(null)}>
                <Text style={styles.renewCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  listContent: {
    paddingBottom: 110,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyPresetContainer: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  emptyPresetTitle: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  emptyPresetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  emptyPresetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  emptyPresetName: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(18, 18, 28, 0.88)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    elevation: isDark ? 2 : 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.06,
    shadowRadius: 8,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    color: isDark ? colors.text.muted : '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  statsPillBox: {
    flexDirection: 'row',
    gap: 6,
  },
  statChip: {
    backgroundColor: isDark ? 'rgba(79,195,247,0.15)' : '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statChipText: {
    color: isDark ? colors.accent.blue : '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
  },
  summaryFooterText: {
    color: isDark ? colors.text.muted : '#64748B',
    fontSize: 11,
  },
  calendarCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(18, 18, 28, 0.88)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    elevation: isDark ? 2 : 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.06,
    shadowRadius: 8,
  },
  calendarHeaderLabel: {
    color: isDark ? colors.text.muted : '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  calendarScrollContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  dayCapsule: {
    width: 46,
    height: 64,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dayCapsuleToday: {
    backgroundColor: isDark ? 'rgba(79,195,247,0.1)' : '#E0F2FE',
  },
  dayCapsuleSelected: {
    backgroundColor: isDark ? 'rgba(79,195,247,0.2)' : '#BAE6FD',
  },
  dayOfWeekText: {
    fontSize: 10,
    fontWeight: '500',
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
    height: 4,
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dayDetailCard: {
    marginTop: 12,
    marginHorizontal: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
  },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayDetailTitle: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  dayDetailTotal: {
    color: colors.accent.blue,
    fontSize: 12,
    fontWeight: '700',
  },
  dayDetailList: {
    gap: 8,
  },
  dayDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.glass.card,
  },
  dayDetailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dayDetailName: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  dayDetailCycle: {
    color: colors.text.muted,
    fontSize: 9,
    fontWeight: '600',
  },
  dayDetailAmount: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  dayDetailEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  dayDetailEmptyText: {
    color: colors.text.muted,
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  filterChipActive: {
    backgroundColor: 'rgba(79,195,247,0.18)',
    borderColor: colors.accent.blue,
  },
  filterText: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.accent.blue,
    fontWeight: '700',
  },
  groupToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupToggleBtnActive: {
    borderColor: colors.accent.purple || '#AB47BC',
    backgroundColor: 'rgba(171,71,188,0.12)',
  },
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 4,
  },
  sectionHeaderText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noResultsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  noResultsText: {
    color: colors.text.muted,
    fontSize: 14,
    marginTop: 10,
  },
  renewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  renewModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    backgroundColor: colors.background.secondary || '#161922',
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.cardBorder,
  },
  renewModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  renewModalTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  renewModalSubtitle: {
    color: colors.text.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  logSpendingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
    borderRadius: 14,
    width: '100%',
    marginBottom: 20,
  },
  logSpendingText: {
    color: colors.text.primary,
    fontSize: 12,
    flex: 1,
  },
  renewModalBtns: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  renewConfirmBtn: {
    flex: 1,
    backgroundColor: colors.accent.blue,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  renewConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  renewCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.glass.card,
    alignItems: 'center',
  },
  renewCancelText: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '600',
  },
});
