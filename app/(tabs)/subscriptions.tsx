import { useTheme } from '../../hooks/useTheme';
import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  SectionList, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SubscriptionCard } from '../../components/SubscriptionCard';
import { EmptyState } from '../../components/EmptyState';
import { SwipeableRow } from '../../components/SwipeableRow';
import { AmbientBackground } from '../../components/AmbientBackground';
import { AppPopup } from '../../components/AppPopup';
import { SearchBar } from '../../components/SearchBar';
import { SpendingChart } from '../../components/SpendingChart';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { useSubscriptions, Subscription } from '../../hooks/useSubscriptions';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency } from '../../utils/dateHelpers';
import { typography, spacing } from '../../constants/typography';
import { getSubscriptionIcon } from '../../utils/subscriptionIcons';
import { SubscriptionIcon } from '../../components/SubscriptionIcon';

const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'expired', label: 'Expired' },
  { key: 'expiring', label: 'Expiring' },
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
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { subscriptions, isLoaded, deleteSubscription, getTotalAmount, refresh } = useSubscriptions();
  const { currencyCode, convertAmount, refresh: refreshCurrency } = useCurrency();
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChart, setShowChart] = useState(true);
  const [groupByCategory, setGroupByCategory] = useState(false);

  const [selectedProjectionIndex, setSelectedProjectionIndex] = useState<number | null>(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(new Date().getDate());

  const projectionData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const months = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(currentYear, currentMonth + i, 1);
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        label: `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`,
        total: 0,
      };
    });

    subscriptions.forEach((sub) => {
      if (!sub.isActive) return;

      const baseAmount = convertAmount(sub.amount, sub.currency);
      const start = sub.expiryDate ? new Date(sub.expiryDate) : new Date(sub.startDate);
      if (isNaN(start.getTime())) return;

      const lastMonthDate = new Date(months[11].year, months[11].month, 31, 23, 59, 59);
      let occurrence = new Date(start.getTime());

      if (occurrence.getTime() < new Date(currentYear, currentMonth, 1).getTime()) {
        let catchUpCount = 0;
        while (occurrence.getTime() < new Date(currentYear, currentMonth, 1).getTime() && catchUpCount < 120) {
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
      while (occurrence.getTime() <= lastMonthDate.getTime() && safetyCount < 150) {
        safetyCount++;
        const oYear = occurrence.getFullYear();
        const oMonth = occurrence.getMonth();

        const match = months.find((m) => m.month === oMonth && m.year === oYear);
        if (match) {
          match.total += baseAmount;
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

    return months;
  }, [subscriptions, convertAmount]);

  const calendarDueMap = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const dueMap: Record<number, Subscription[]> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      dueMap[day] = [];
    }

    subscriptions.forEach((sub) => {
      if (!sub.isActive) return;

      const start = sub.expiryDate ? new Date(sub.expiryDate) : new Date(sub.startDate);
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
  }, [subscriptions, convertAmount]);

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
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return subscriptions
      .filter(s => {
        if (!s.isActive || !s.expiryDate) return false;
        const expiryTime = new Date(s.expiryDate).getTime();
        const diff = expiryTime - now;
        return diff > 0 && diff <= thirtyDays;
      })
      .map(s => {
        const daysLeft = Math.ceil((new Date(s.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
        return {
          ...s,
          daysLeft,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [subscriptions]);

  const isExpired = (date: string) => new Date(date).getTime() < Date.now();

  const filteredSubscriptions = useMemo(() => {
    let result = subscriptions;

    // Apply filter
    if (filter === 'active') result = result.filter(s => s.isActive && !isExpired(s.expiryDate));
    else if (filter === 'expired') result = result.filter(s => isExpired(s.expiryDate) || !s.isActive);
    else if (filter === 'expiring') {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      result = result.filter(s => {
        if (!s.isActive || isExpired(s.expiryDate)) return false;
        const daysLeft = new Date(s.expiryDate).getTime() - Date.now();
        return daysLeft > 0 && daysLeft <= sevenDays;
      });
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [subscriptions, filter, searchQuery]);

  // Group by category for SectionList
  const categorySections = useMemo(() => {
    if (!groupByCategory) return [];
    const map = new Map<string, Subscription[]>();
    filteredSubscriptions.forEach(sub => {
      const cat = sub.category || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(sub);
    });
    return Array.from(map.entries())
      .map(([title, data]) => ({
        title,
        data,
        icon: CATEGORY_ICONS[title] || 'apps-outline',
        count: data.length,
        total: data.reduce((sum, s) => sum + convertAmount(s.amount, s.currency), 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredSubscriptions, groupByCategory, convertAmount]);

  const totalAmount = getTotalAmount(convertAmount);

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
    router.push('/modals/add-subscription');
  };

  const handleEdit = (subscription: Subscription) => {
    router.push({
      pathname: '/modals/edit-subscription',
      params: { id: subscription.id },
    });
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteSubscription(deleteId);
      setDeleteId(null);
    }
  };

  const renderItem = ({ item }: { item: Subscription }) => (
    <SwipeableRow
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item.id)}
    >
      <SubscriptionCard 
        subscription={item} 
        onDelete={() => handleDelete(item.id)}
      />
    </SwipeableRow>
  );

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={section.icon as any} size={16} color={colors.accent.blue} />
        </View>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{section.count}</Text>
        </View>
      </View>
      <Text style={styles.sectionTotal}>
        {formatCurrency(section.total, currencyCode)}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>
              {subscriptions.filter(s => s.isActive).length} active
            </Text>
          </View>
        </View>
        <Text style={styles.summaryAmount}>
          {formatCurrency(totalAmount, currencyCode)}
        </Text>
      </View>

      {/* 12-Month Outflow Projection Bar Chart */}
      <View style={styles.projectionCard}>
        <View style={styles.projectionHeader}>
          <View>
            <Text style={styles.projectionLabel}>12-MONTH OUTFLOW PROJECTION</Text>
            <Text style={styles.projectionTotalAmount}>
              {selectedProjectionIndex !== null
                ? `${projectionData[selectedProjectionIndex].label}: ${formatCurrency(projectionData[selectedProjectionIndex].total, currencyCode)}`
                : 'Tap any column to inspect projected billing'
              }
            </Text>
          </View>
          {selectedProjectionIndex !== null && (
            <TouchableOpacity 
              onPress={() => setSelectedProjectionIndex(null)}
              style={styles.projectionResetBtn}
            >
              <Text style={styles.projectionResetText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.projectionScroll}
          contentContainerStyle={styles.projectionScrollContent}
        >
          {(() => {
            const totals = projectionData.map((d) => d.total);
            const maxTotal = Math.max(...totals, 1);
            const chartHeight = 90;
            const barMaxHeight = chartHeight - 20;
            const barWidth = 32;
            const barGap = 12;
            const chartWidth = projectionData.length * (barWidth + barGap) + 16;
            
            return (
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <LinearGradient id="projectionBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={colors.accent.purple} stopOpacity="1" />
                    <Stop offset="100%" stopColor={colors.accent.indigo} stopOpacity="0.4" />
                  </LinearGradient>
                  <LinearGradient id="projectionBarActive" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={colors.accent.amber} stopOpacity="1" />
                    <Stop offset="100%" stopColor={colors.accent.amber} stopOpacity="0.5" />
                  </LinearGradient>
                  <LinearGradient id="projectionBarEmpty" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="rgba(255,255,255,0.06)" stopOpacity="1" />
                    <Stop offset="100%" stopColor="rgba(255,255,255,0.02)" stopOpacity="1" />
                  </LinearGradient>
                </Defs>

                {projectionData.map((item, i) => {
                  const barHeight = item.total > 0 ? Math.max((item.total / maxTotal) * barMaxHeight, 6) : 6;
                  const x = 8 + i * (barWidth + barGap);
                  const y = barMaxHeight - barHeight + 4;
                  const isSelected = selectedProjectionIndex === i;
                  
                  const fillId = item.total <= 0 
                    ? 'url(#projectionBarEmpty)'
                    : isSelected 
                      ? 'url(#projectionBarActive)'
                      : 'url(#projectionBarGrad)';
                      
                  return (
                    <React.Fragment key={`${item.label}-${i}`}>
                      <Rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx={6}
                        ry={6}
                        fill={fillId}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedProjectionIndex(selectedProjectionIndex === i ? null : i);
                        }}
                      />
                      <SvgText
                        x={x + barWidth / 2}
                        y={chartHeight - 2}
                        fontSize="9"
                        fill={isSelected ? colors.accent.amber : colors.text.muted}
                        textAnchor="middle"
                        fontWeight={isSelected ? '700' : '500'}
                      >
                        {item.label.split(' ')[0]}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
              </Svg>
            );
          })()}
        </ScrollView>
      </View>

      {/* Monthly Billing Calendar Grid */}
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
            length: 54, // width of day capsule (46) + gap (8)
            offset: 54 * index,
            index,
          })}
          renderItem={({ item }) => {
            const isSelected = selectedCalendarDay === item.day;
            const dueSubs = calendarDueMap[item.day] || [];
            const hasDue = dueSubs.length > 0;
            
            return (
              <TouchableOpacity
                style={[
                  styles.dayCapsule,
                  item.isToday && styles.dayCapsuleToday,
                  isSelected && styles.dayCapsuleSelected,
                  { borderColor: isSelected ? colors.accent.blue : item.isToday ? (colors.accent.alpha ? colors.accent.alpha(0.4) : 'rgba(79,195,247,0.4)') : colors.glass.cardBorder }
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
                
                {/* Dots indicator */}
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

        {/* Selected Day Renewal Detail Panel */}
        {selectedCalendarDay !== null && (() => {
          const dueList = calendarDueMap[selectedCalendarDay] || [];
          const now = new Date();
          const dayLabel = selectedCalendarDay === now.getDate() ? 'Today' : selectedCalendarDay === now.getDate() + 1 ? 'Tomorrow' : `Day ${selectedCalendarDay}`;
          const formattedTotal = formatCurrency(
            dueList.reduce((sum, s) => sum + convertAmount(s.amount, s.currency), 0),
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
                          {formatCurrency(sub.amount, sub.currency)}
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

      {/* Subscription Renewal Forecast Strip */}
      {upcomingRenewals.length > 0 && (
        <View style={styles.renewalContainer}>
          <Text style={styles.renewalSectionTitle}>Upcoming Renewals</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={upcomingRenewals}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.renewalScrollContent}
            renderItem={({ item }) => {
              const iconMeta = getSubscriptionIcon(item.name);
              const brandColor = item.color || iconMeta.color || colors.accent.blue;
              
              let badgeColor = colors.accent.blue;
              let badgeBg = colors.accent.alpha ? colors.accent.alpha(0.08) : 'rgba(79, 195, 247, 0.08)';
              let badgeText = `${item.daysLeft}d left`;
              
              if (item.daysLeft === 1) {
                badgeColor = colors.accent.amber;
                badgeBg = 'rgba(245, 158, 11, 0.12)';
                badgeText = 'Tomorrow';
              } else if (item.daysLeft <= 3) {
                badgeColor = colors.accent.purple;
                badgeBg = colors.accent.alpha(0.12);
                badgeText = `${item.daysLeft}d left`;
              } else if (item.daysLeft === 0) {
                badgeColor = colors.accent.red;
                badgeBg = 'rgba(239, 68, 68, 0.12)';
                badgeText = 'Today';
              }
              
              return (
                <TouchableOpacity
                  style={[
                    styles.renewalCard,
                    {
                      borderColor: brandColor + '30',
                    }
                  ]}
                  onPress={() => handleEdit(item)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.cardGlowStrip, { backgroundColor: brandColor }]} />
                  <SubscriptionIcon name={item.name} size={32} />
                  <Text style={styles.renewalName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.renewalAmount}>
                    {formatCurrency(item.amount, item.currency)}
                  </Text>
                  <View style={[styles.renewalBadge, { backgroundColor: badgeBg, borderColor: badgeColor + '20' }]}>
                    <Text style={[styles.renewalBadgeText, { color: badgeColor }]}>
                      {badgeText}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Chart Toggle + Chart */}
      {subscriptions.length > 0 && (
        <TouchableOpacity
          style={styles.chartToggle}
          onPress={() => setShowChart(!showChart)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showChart ? 'chevron-up' : 'bar-chart-outline'}
            size={16}
            color={colors.accent.blue}
          />
          <Text style={styles.chartToggleText}>
            {showChart ? 'Hide Chart' : 'Show Spending Chart'}
          </Text>
        </TouchableOpacity>
      )}

      {showChart && subscriptions.length > 0 && (
        <SpendingChart subscriptions={subscriptions} currencyCode={currencyCode} />
      )}

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search subscriptions..."
        accentColor={colors.accent.blue}
      />

      {/* Filter + Category Toggle Row */}
      <View style={styles.filterRow}>
        {filterOptions.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.filterPill, filter === opt.key && styles.filterPillActive]}
            onPress={() => setFilter(opt.key)}
          >
            <Text style={[styles.filterText, filter === opt.key && styles.filterTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
        {/* Category Group Toggle */}
        {subscriptions.length > 0 && (
          <TouchableOpacity
            style={[styles.filterPill, styles.categoryToggle, groupByCategory && styles.categoryToggleActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setGroupByCategory(!groupByCategory);
            }}
          >
            <Ionicons
              name={groupByCategory ? 'grid' : 'grid-outline'}
              size={14}
              color={groupByCategory ? colors.accent.purple : colors.text.muted}
            />
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  // Skeleton Loading
  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <AmbientBackground />
        <View style={styles.header}>
          <Text style={styles.title}>Subscriptions</Text>
          <View style={styles.headerRight}>
            <View style={styles.iconButton}>
              <Ionicons name="settings-outline" size={22} color={colors.text.tertiary} />
            </View>
          </View>
        </View>
        <SkeletonLoader variant="subscriptions" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Subscriptions</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modals/tool-subscription-forecast');
            }}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.accent.purple} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/modals/settings')}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Empty State */}
      {filteredSubscriptions.length === 0 && !searchQuery ? (
        <>
          {renderHeader()}
          <EmptyState
            icon="card-outline"
            title="No subscriptions yet"
            subtitle="Track all your recurring payments in one place"
            actionLabel="Add Subscription"
            onAction={handleAddPress}
            variant="subscriptions"
          />
        </>
      ) : groupByCategory && categorySections.length > 0 ? (
        /* Category Grouped View */
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
        /* Normal List View */
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
        title="Delete Subscription"
        message="Are you sure you want to permanently delete this subscription? This will clean it from storage."
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

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.tertiary,
    fontSize: 16,
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
    backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.12) : 'rgba(79,195,247,0.12)',
    borderWidth: 0.5,
    borderColor: colors.accent.alpha ? colors.accent.alpha(0.3) : 'rgba(79,195,247,0.3)',
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
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
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
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(102,187,106,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(102,187,106,0.3)',
  },
  activeBadgeText: {
    color: '#66BB6A',
    fontSize: 11,
    fontWeight: '600',
  },
  summaryAmount: {
    color: colors.text.primary,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
  },
  chartToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.06) : 'rgba(79,195,247,0.06)',
    borderWidth: 0.5,
    borderColor: colors.accent.alpha ? colors.accent.alpha(0.15) : 'rgba(79,195,247,0.15)',
  },
  chartToggleText: {
    color: colors.accent.blue,
    fontSize: 13,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.buttonSecondary,
  },
  filterPillActive: {
    backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.15) : 'rgba(79,195,247,0.15)',
    borderColor: colors.accent.alpha ? colors.accent.alpha(0.4) : 'rgba(79,195,247,0.4)',
  },
  filterText: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.accent.blue,
    fontWeight: '600',
  },
  categoryToggle: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  categoryToggleActive: {
    backgroundColor: colors.accent.alpha(0.15),
    borderColor: colors.accent.alpha(0.4),
  },
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.1) : 'rgba(79,195,247,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.glass.buttonSecondary,
  },
  sectionCountText: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTotal: {
    color: colors.accent.blue,
    fontSize: 14,
    fontWeight: '700',
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
  renewalContainer: {
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  renewalSectionTitle: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  renewalScrollContent: {
    paddingRight: 20,
  },
  renewalCard: {
    width: 124,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginRight: 12,
  },
  cardGlowStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  renewalName: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 2,
    width: '100%',
  },
  renewalAmount: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  renewalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renewalBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  
  // Projection Card Styles
  projectionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.glass.card,
    borderWidth: 1,
    borderColor: colors.glass.cardBorder,
  },
  projectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectionLabel: {
    color: colors.text.tertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  projectionTotalAmount: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  projectionResetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.glass.buttonSecondary,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  projectionResetText: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
  projectionScroll: {
    marginHorizontal: -8,
  },
  projectionScrollContent: {
    paddingHorizontal: 8,
  },

  // Calendar Card Styles
  calendarCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.glass.card,
    borderWidth: 1,
    borderColor: colors.glass.cardBorder,
  },
  calendarHeaderLabel: {
    color: colors.text.tertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  calendarScrollContent: {
    paddingRight: 12,
    gap: 8,
    paddingBottom: 6,
  },
  dayCapsule: {
    width: 46,
    height: 72,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dayCapsuleToday: {
    backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.03) : 'rgba(79,195,247,0.03)',
  },
  dayCapsuleSelected: {
    backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.12) : 'rgba(79,195,247,0.12)',
  },
  dayOfWeekText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dayNumberText: {
    fontSize: 15,
    fontWeight: '700',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
    height: 4,
    marginTop: 6,
    width: '100%',
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Day detail card
  dayDetailCard: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderStyle: 'solid',
    borderTopColor: colors.glass.cardBorder,
  },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayDetailTitle: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: colors.glass.cardBorder,
  },
  dayDetailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  dayDetailName: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  dayDetailCycle: {
    color: colors.text.tertiary,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
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
    paddingVertical: 8,
    justifyContent: 'center',
  },
  dayDetailEmptyText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
