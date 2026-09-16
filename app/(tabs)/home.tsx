import { useTheme } from '../../hooks/useTheme';
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { AmbientBackground } from '../../components/AmbientBackground';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useDebts } from '../../hooks/useDebts';
import { useCredits } from '../../hooks/useCredits';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { useDailySpending } from '../../hooks/useDailySpending';
import { useIncome } from '../../hooks/useIncome';
import { useCurrency } from '../../hooks/useCurrency';
import { useBudget } from '../../hooks/useBudget';
import { useSettings } from '../../context/SettingsContext';
import { storage } from '../../storage/mmkv';
import { getCategoryIcon } from '../../constants/categories';
import { FloatingTopHeader } from '../../components/FloatingTopHeader';
import { ReceiptGalleryModal } from '../../components/ReceiptGalleryModal';
import {
  calculateCashflowForecast,
  detectSubscriptionPriceHikes,
} from '../../utils/cashflowForecast';

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const { currencyCode, convertAmount, refresh: refreshCurrency } = useCurrency();
  const { formatCurrency, formatDate } = useSettings();

  const [refreshing, setRefreshing] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showReceiptGallery, setShowReceiptGallery] = useState(false);
  const [dismissedHikes, setDismissedHikes] = useState<string[]>([]);

  const { debts, getTotalPendingAmount: getDebtTotal, refresh: refreshDebts } = useDebts();
  const { credits, getTotalPendingAmount: getCreditTotal, refresh: refreshCredits } = useCredits();
  const { subscriptions, getTotalAmount: getSubTotal, refresh: refreshSubs } = useSubscriptions();
  const { getDailyAverage, getTotalForMonth, refresh: refreshSpending, entries } = useDailySpending();
  const { incomes, getTotalIncomeForMonth, refresh: refreshIncome } = useIncome();
  const { budget, refresh: refreshBudget } = useBudget();

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const pMode = await storage.getString('privacy_mode_enabled');
      setPrivacyMode(pMode === 'true');
    } catch {}

    await Promise.all([
      refreshDebts(),
      refreshCredits(),
      refreshSubs(),
      refreshSpending(),
      refreshIncome(),
      refreshCurrency(),
      refreshBudget(),
    ]);
    setRefreshing(false);
  }, [
    refreshDebts,
    refreshCredits,
    refreshSubs,
    refreshSpending,
    refreshIncome,
    refreshCurrency,
    refreshBudget,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const togglePrivacyMode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !privacyMode;
    setPrivacyMode(next);
    await storage.set('privacy_mode_enabled', String(next));
  };

  const totalDebt = useMemo(() => getDebtTotal(), [getDebtTotal]);
  const totalCredit = useMemo(() => getCreditTotal(), [getCreditTotal]);
  const totalSubs = useMemo(() => getSubTotal(), [getSubTotal]);
  const monthlySpending = useMemo(() => getTotalForMonth(new Date()), [getTotalForMonth]);
  const monthlyIncome = useMemo(() => getTotalIncomeForMonth(new Date()), [getTotalIncomeForMonth]);
  const dailyAvg = useMemo(() => getDailyAverage(), [getDailyAverage]);

  // Net Position (Credits owed to you minus Debts you owe)
  const netPosition = totalCredit - totalDebt;

  // Monthly Net Cashflow = Income Inflow - (Daily Spending + Subscriptions)
  const totalMonthlyOutflow = monthlySpending + totalSubs;
  const netMonthlySavings = monthlyIncome - totalMonthlyOutflow;
  const savingsRate = monthlyIncome > 0
    ? Math.max(0, Math.min(100, Math.round((netMonthlySavings / monthlyIncome) * 100)))
    : 0;

  // 30-Day Cash Runway & Outflow Projections
  const cashflowForecast = useMemo(() => {
    return calculateCashflowForecast(entries, subscriptions, debts, incomes, totalCredit, (amt, curr) =>
      convertAmount(amt, curr)
    );
  }, [entries, subscriptions, debts, incomes, totalCredit, convertAmount]);

  // Subscription Price Hike Detection (with dismiss filter)
  const priceHikeAlerts = useMemo(() => {
    const raw = detectSubscriptionPriceHikes(subscriptions, entries);
    return raw.filter((h) => !dismissedHikes.includes(h.subscriptionId));
  }, [subscriptions, entries, dismissedHikes]);

  const formatValue = (val: number) => {
    if (privacyMode) return '••••••';
    return formatCurrency(val, currencyCode);
  };

  // Upcoming alerts (next 7 days)
  const upcomingAlerts = useMemo(() => {
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const alerts: {
      id: string;
      title: string;
      subtitle: string;
      amount: number;
      type: 'debt' | 'sub';
    }[] = [];

    subscriptions
      .filter((s) => s.isActive && s.expiryDate)
      .forEach((s) => {
        const d = new Date(s.expiryDate);
        if (d >= now && d <= next7Days) {
          const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          alerts.push({
            id: `sub-${s.id}`,
            title: `Renewal: ${s.name}`,
            subtitle: daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
            amount: convertAmount(s.amount, s.currency),
            type: 'sub',
          });
        }
      });

    debts
      .filter((d) => !d.isPaid && d.dueDate)
      .forEach((d) => {
        const due = new Date(d.dueDate!);
        if (due >= now && due <= next7Days) {
          const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          alerts.push({
            id: `debt-${d.id}`,
            title: `Pay Debt: ${d.personName}`,
            subtitle: daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
            amount: convertAmount(d.amount, d.currency),
            type: 'debt',
          });
        }
      });

    return alerts.slice(0, 3);
  }, [subscriptions, debts, convertAmount]);

  // Category spending progress
  const categoryProgress = useMemo(() => {
    if (!budget.categoryLimits || Object.keys(budget.categoryLimits).length === 0) return [];
    const now = new Date();
    const currentMonthEntries = entries.filter((e) => {
      const d = new Date(e.spentAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    return Object.entries(budget.categoryLimits)
      .map(([cat, limit]) => {
        if (!limit || limit <= 0) return null;
        const spending = currentMonthEntries
          .filter((e) => e.category?.toLowerCase() === cat.toLowerCase())
          .reduce((sum, e) => sum + convertAmount(e.amount, e.currency), 0);
        const pct = Math.min(100, Math.round((spending / limit) * 100));
        return { category: cat, limit, spending, pct };
      })
      .filter((item): item is { category: string; limit: number; spending: number; pct: number } => item !== null)
      .sort((a, b) => b.pct - a.pct);
  }, [budget.categoryLimits, entries, convertAmount]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AmbientBackground />

      {/* Modern Floating Top Bar */}
      <FloatingTopHeader
        title="Financial Dashboard"
        subtitle="Real-Time Overview & Cash Flow"
        rightActions={
          <View style={styles.headerActionRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={togglePrivacyMode} activeOpacity={0.8}>
              <Ionicons name={privacyMode ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/modals/settings')} activeOpacity={0.8}>
              <Ionicons name="settings-outline" size={19} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.accent.purple} />}
      >
        {/* Executive Hero: Net Position & Budget Meter */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>NET POSITION (CREDITS - DEBTS)</Text>
            <View style={[styles.statusBadge, netPosition >= 0 ? styles.badgeGreen : styles.badgeRed]}>
              <Text style={[styles.statusBadgeText, netPosition >= 0 ? styles.badgeGreenText : styles.badgeRedText]}>
                {netPosition >= 0 ? 'NET POSITIVE' : 'NET LIABILITY'}
              </Text>
            </View>
          </View>

          <Text style={[styles.heroAmount, netPosition < 0 && { color: colors.accent.red }]}>
            {formatValue(Math.abs(netPosition))}
          </Text>

          {/* Monthly Budget Progress Meter */}
          {budget.amount > 0 && (
            <View style={styles.budgetMeterSection}>
              <View style={styles.budgetMeterRow}>
                <Text style={styles.meterLabel}>Monthly Budget Progress</Text>
                <Text style={styles.meterValue}>
                  {formatCurrency(monthlySpending, currencyCode)} / {formatCurrency(budget.amount, currencyCode)}
                </Text>
              </View>

              <View style={styles.meterTrack}>
                <View
                  style={[
                    styles.meterFill,
                    {
                      width: `${Math.min(100, Math.round((monthlySpending / budget.amount) * 100))}%`,
                      backgroundColor:
                        monthlySpending > budget.amount
                          ? colors.accent.red
                          : monthlySpending > budget.amount * 0.8
                          ? colors.accent.amber
                          : colors.accent.green,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* 1-Tap Quick Action Row (5 Actions) */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modals/add-spending');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.accent.alpha(0.15) }]}>
              <Ionicons name="add-circle-outline" size={20} color={colors.accent.purple} />
            </View>
            <Text style={styles.actionText}>+ Spend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modals/add-income');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="cash-outline" size={20} color={colors.accent.green} />
            </View>
            <Text style={styles.actionText}>+ Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modals/add-debt');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="hand-right-outline" size={19} color={colors.accent.red} />
            </View>
            <Text style={styles.actionText}>+ Debt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modals/add-subscription');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="repeat-outline" size={19} color={colors.accent.blue} />
            </View>
            <Text style={styles.actionText}>+ Sub</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowReceiptGallery(true);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons name="images-outline" size={19} color={colors.accent.purple} />
            </View>
            <Text style={styles.actionText}>Receipts</Text>
          </TouchableOpacity>
        </View>

        {/* Unified Monthly Cashflow & Runway Card */}
        <View style={styles.cashflowCard}>
          <View style={styles.cashflowHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="analytics-outline" size={17} color={colors.accent.blue} />
              <Text style={styles.cashflowTitle}>MONTHLY CASHFLOW & RUNWAY</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/modals/add-income');
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.manageIncomeLink}>+ Log Income</Text>
            </TouchableOpacity>
          </View>

          {/* Row 1: Inflow / Outflow / Net Savings */}
          <View style={styles.cashflowGrid}>
            <View style={styles.cashflowStat}>
              <Text style={styles.cashflowStatLabel}>Income Inflow</Text>
              <Text style={[styles.cashflowStatVal, { color: colors.accent.green }]}>
                +{formatValue(monthlyIncome)}
              </Text>
            </View>
            <View style={styles.cashflowDivider} />
            <View style={styles.cashflowStat}>
              <Text style={styles.cashflowStatLabel}>Total Outflow</Text>
              <Text style={[styles.cashflowStatVal, { color: colors.accent.red }]}>
                -{formatValue(totalMonthlyOutflow)}
              </Text>
            </View>
            <View style={styles.cashflowDivider} />
            <View style={styles.cashflowStat}>
              <Text style={styles.cashflowStatLabel}>Net Savings</Text>
              <Text
                style={[
                  styles.cashflowStatVal,
                  { color: netMonthlySavings >= 0 ? colors.accent.green : colors.accent.red },
                ]}
              >
                {netMonthlySavings >= 0 ? '+' : ''}{formatValue(netMonthlySavings)}
              </Text>
            </View>
          </View>

          {/* Row 2: Daily Burn & 30-Day Outflow Projection */}
          <View style={styles.cashflowForecastRow}>
            <View style={styles.forecastItem}>
              <Text style={styles.forecastLabel}>Daily Burn Rate</Text>
              <Text style={styles.forecastValue}>
                ~{formatValue(cashflowForecast.dailyBurnRate)}/day
              </Text>
            </View>
            <View style={styles.forecastDivider} />
            <View style={styles.forecastItem}>
              <Text style={styles.forecastLabel}>30-Day Outflow Est.</Text>
              <Text style={[styles.forecastValue, { color: colors.accent.amber }]}>
                {formatValue(cashflowForecast.projected30DayOutflow)}
              </Text>
            </View>
            {cashflowForecast.daysRunway !== undefined && (
              <>
                <View style={styles.forecastDivider} />
                <View style={styles.forecastItem}>
                  <Text style={styles.forecastLabel}>Est. Runway</Text>
                  <Text style={[styles.forecastValue, { color: colors.accent.purple }]}>
                    {cashflowForecast.daysRunway} Days
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Savings Rate Meter (if income > 0) */}
          {monthlyIncome > 0 && (
            <View style={styles.savingsRateWrap}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.savingsRateLabel}>Monthly Savings Rate</Text>
                <Text style={[styles.savingsRateVal, { color: colors.accent.green }]}>
                  {savingsRate}% Saved
                </Text>
              </View>
              <View style={styles.savingsTrack}>
                <View style={[styles.savingsFill, { width: `${Math.min(100, savingsRate)}%` }]} />
              </View>
            </View>
          )}
        </View>

        {/* Subscription Price Hike Warning Banner (Sleek & Dismissible) */}
        {priceHikeAlerts.length > 0 && (
          <View style={styles.priceHikeCard}>
            <View style={styles.priceHikeHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="alert-circle" size={17} color={colors.accent.red} />
                <Text style={styles.priceHikeTitle}>SUBSCRIPTION PRICE HIKE DETECTED</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setDismissedHikes(priceHikeAlerts.map((h) => h.subscriptionId));
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close" size={16} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
            {priceHikeAlerts.map((hike) => (
              <View key={hike.subscriptionId} style={styles.priceHikeRow}>
                <Text style={styles.priceHikeSubName}>{hike.name}</Text>
                <Text style={styles.priceHikeDiff}>
                  +{formatValue(hike.difference)} (+{hike.percentIncrease}%)
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 4-Metric Financial Pulse Matrix */}
        <Text style={styles.sectionHeaderTitle}>FINANCIAL PULSE</Text>
        <View style={styles.matrixGrid}>
          {/* Debts */}
          <TouchableOpacity
            style={[styles.matrixCard, { borderColor: 'rgba(239, 68, 68, 0.25)' }]}
            onPress={() => router.push('/(tabs)/debts')}
            activeOpacity={0.8}
          >
            <View style={styles.matrixCardTop}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.accent.red} />
              <View style={[styles.pillBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Text style={{ color: colors.accent.red, fontSize: 10, fontWeight: '700' }}>
                  {debts.filter((d) => !d.isPaid).length} Pending
                </Text>
              </View>
            </View>
            <Text style={styles.matrixValue}>{formatValue(totalDebt)}</Text>
            <Text style={styles.matrixLabel}>Debts Owed</Text>
          </TouchableOpacity>

          {/* Credits */}
          <TouchableOpacity
            style={[styles.matrixCard, { borderColor: 'rgba(16, 185, 129, 0.25)' }]}
            onPress={() => router.push('/(tabs)/credits')}
            activeOpacity={0.8}
          >
            <View style={styles.matrixCardTop}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.accent.green} />
              <View style={[styles.pillBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={{ color: colors.accent.green, fontSize: 10, fontWeight: '700' }}>
                  {credits.filter((c) => !c.isReturned).length} Owed
                </Text>
              </View>
            </View>
            <Text style={styles.matrixValue}>{formatValue(totalCredit)}</Text>
            <Text style={styles.matrixLabel}>Owed to You</Text>
          </TouchableOpacity>

          {/* Subscriptions */}
          <TouchableOpacity
            style={[styles.matrixCard, { borderColor: colors.accent.alpha(0.25) }]}
            onPress={() => router.push('/(tabs)/subscriptions')}
            activeOpacity={0.8}
          >
            <View style={styles.matrixCardTop}>
              <Ionicons name="refresh-circle-outline" size={20} color={colors.accent.purple} />
              <View style={[styles.pillBadge, { backgroundColor: colors.accent.alpha(0.15) }]}>
                <Text style={{ color: colors.accent.purple, fontSize: 10, fontWeight: '700' }}>
                  {subscriptions.filter((s) => s.isActive).length} Active
                </Text>
              </View>
            </View>
            <Text style={styles.matrixValue}>{formatValue(totalSubs)}</Text>
            <Text style={styles.matrixLabel}>Sub Outflow</Text>
          </TouchableOpacity>

          {/* Spending */}
          <TouchableOpacity
            style={[styles.matrixCard, { borderColor: 'rgba(59, 130, 246, 0.25)' }]}
            onPress={() => router.push('/(tabs)/spending')}
            activeOpacity={0.8}
          >
            <View style={styles.matrixCardTop}>
              <Ionicons name="wallet-outline" size={20} color={colors.accent.blue} />
              <View style={[styles.pillBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Text style={{ color: colors.accent.blue, fontSize: 10, fontWeight: '700' }}>
                  ~{formatValue(dailyAvg)}/day
                </Text>
              </View>
            </View>
            <Text style={styles.matrixValue}>{formatValue(monthlySpending)}</Text>
            <Text style={styles.matrixLabel}>Spent This Month</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Payment Alerts Strip */}
        {upcomingAlerts.length > 0 && (
          <View style={styles.alertsCard}>
            <View style={styles.alertsHeader}>
              <Ionicons name="notifications-outline" size={17} color={colors.accent.amber} />
              <Text style={styles.alertsTitle}>UPCOMING PAYMENTS & RENEWALS</Text>
            </View>

            {upcomingAlerts.map((item) => (
              <View key={item.id} style={styles.alertRow}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertItemTitle}>{item.title}</Text>
                  <Text style={styles.alertItemSub}>{item.subtitle}</Text>
                </View>
                <Text
                  style={[
                    styles.alertItemVal,
                    item.type === 'debt' ? { color: colors.accent.red } : { color: colors.accent.purple },
                  ]}
                >
                  {formatValue(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Category Budget Progress Bars */}
        {categoryProgress.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeaderTitle}>CATEGORY SPENDING LIMITS</Text>

            {categoryProgress.map((item) => {
              const icon = getCategoryIcon(item.category);
              const barColor =
                item.pct >= 90 ? colors.accent.red : item.pct >= 70 ? colors.accent.amber : colors.accent.purple;

              return (
                <View key={item.category} style={styles.catProgressRow}>
                  <View style={styles.catProgressHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={icon as any} size={16} color={colors.text.primary} />
                      <Text style={styles.catProgressName}>{item.category}</Text>
                    </View>
                    <Text style={styles.catProgressVal}>
                      {formatValue(item.spending)} / {formatValue(item.limit)}
                    </Text>
                  </View>

                  <View style={styles.catTrack}>
                    <View style={[styles.catFill, { width: `${item.pct}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Financial Tools Hub */}
        <Text style={styles.sectionHeaderTitle}>FINANCIAL UTILITIES HUB</Text>
        <View style={styles.toolsGrid}>
          {[
            { id: 'fin-calendar', title: 'Calendar Grid', subtitle: 'Event Matrix', icon: 'calendar-number-outline', color: '#3B82F6', route: '/modals/tool-financial-calendar' },
            { id: 'emi-calc', title: 'EMI Calculator', subtitle: 'Loan Schedules', icon: 'calculator-outline', color: '#8B5CF6', route: '/modals/tool-emi-calculator' },
            { id: 'sub-forecast', title: 'Sub Forecast', subtitle: '12-Month Outflow', icon: 'calendar-outline', color: '#6366F1', route: '/modals/tool-subscription-forecast' },
            { id: 'import-csv', title: 'CSV Importer', subtitle: 'Excel & Sheets', icon: 'cloud-upload-outline', color: '#10B981', route: '/modals/import-csv' },
            { id: 'health-audit', title: 'Health Audit', subtitle: 'Score & Report', icon: 'pulse-outline', color: colors.accent.green, route: '/modals/tool-health-audit' },
            { id: 'reminder-gen', title: 'Reminders', subtitle: 'WhatsApp / SMS', icon: 'paper-plane-outline', color: colors.accent.blue, route: '/modals/tool-reminder-generator' },
            { id: 'debt-payoff', title: 'Payoff Planner', subtitle: 'Snowball Method', icon: 'trending-up-outline', color: colors.accent.amber, route: '/modals/tool-debt-payoff' },
            { id: 'currency-converter', title: 'FX Converter', subtitle: 'Offline Rates', icon: 'swap-horizontal-outline', color: colors.accent.purple, route: '/modals/tool-currency-converter' },
            { id: 'export-statement', title: 'PDF Export', subtitle: 'Custom Reports', icon: 'document-text-outline', color: '#26A69A', route: '/modals/export-pdf' },
            { id: 'security-vault', title: 'Data Vault', subtitle: 'Backup & Restore', icon: 'shield-checkmark-outline', color: '#EC4899', route: '/modals/tool-data-vault' },
          ].map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(tool.route as any);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.toolIconBox, { backgroundColor: `${tool.color}18`, borderColor: `${tool.color}40` }]}>
                <Ionicons name={tool.icon as any} size={22} color={tool.color} />
              </View>
              <View style={styles.toolTextWrap}>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Full Screen Receipt Vault Gallery Modal */}
      <ReceiptGalleryModal
        visible={showReceiptGallery}
        onClose={() => setShowReceiptGallery(false)}
        entries={entries}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.primary },
    headerActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.glass.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 140,
      gap: 16,
    },
    heroCard: {
      padding: 20,
      borderRadius: 24,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 10,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroLabel: {
      color: colors.text.tertiary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    badgeGreen: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
    badgeRed: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
    statusBadgeText: { fontSize: 10, fontWeight: '800' },
    badgeGreenText: { color: colors.accent.green },
    badgeRedText: { color: colors.accent.red },
    heroAmount: {
      color: colors.accent.green,
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -1,
    },
    budgetMeterSection: {
      gap: 6,
      marginTop: 6,
      paddingTop: 10,
      borderTopWidth: 0.5,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    budgetMeterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    meterLabel: { color: colors.text.secondary, fontSize: 11, fontWeight: '600' },
    meterValue: { color: colors.text.primary, fontSize: 12, fontWeight: '800' },
    meterTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
    },
    meterFill: { height: '100%', borderRadius: 4 },

    // Quick action 5-button row
    quickActionRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionTile: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 2,
      borderRadius: 16,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    actionIconBox: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionText: {
      color: colors.text.primary,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
    },

    // Unified Cashflow & Runway Card
    cashflowCard: {
      padding: 18,
      borderRadius: 22,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 14,
    },
    cashflowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cashflowTitle: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    manageIncomeLink: {
      color: colors.accent.purple,
      fontSize: 12,
      fontWeight: '700',
    },
    cashflowGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cashflowStat: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    cashflowStatLabel: {
      color: colors.text.muted,
      fontSize: 10.5,
      fontWeight: '600',
    },
    cashflowStatVal: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    cashflowDivider: {
      width: 0.5,
      height: 28,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    cashflowForecastRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 0.5,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    },
    forecastItem: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
    },
    forecastLabel: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '600',
    },
    forecastValue: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    forecastDivider: {
      width: 0.5,
      height: 22,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    savingsRateWrap: {
      gap: 6,
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    },
    savingsRateLabel: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '600',
    },
    savingsRateVal: {
      fontSize: 11,
      fontWeight: '800',
    },
    savingsTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
    },
    savingsFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: colors.accent.green,
    },

    // Price Hike Warning Banner
    priceHikeCard: {
      padding: 14,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(254, 226, 226, 0.8)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      gap: 8,
    },
    priceHikeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priceHikeTitle: {
      color: colors.accent.red,
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    priceHikeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 2,
    },
    priceHikeSubName: {
      color: colors.text.primary,
      fontSize: 12.5,
      fontWeight: '700',
    },
    priceHikeDiff: {
      color: colors.accent.red,
      fontSize: 12.5,
      fontWeight: '800',
    },

    // Financial Pulse
    sectionHeaderTitle: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginLeft: 4,
    },
    matrixGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    matrixCard: {
      width: '48%',
      padding: 16,
      borderRadius: 20,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      gap: 8,
    },
    matrixCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pillBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    matrixValue: {
      color: colors.text.primary,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    matrixLabel: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '600',
    },

    // Upcoming Alerts
    alertsCard: {
      padding: 16,
      borderRadius: 20,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 12,
    },
    alertsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    alertsTitle: {
      color: colors.accent.amber,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    alertRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    alertInfo: { gap: 2 },
    alertItemTitle: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    alertItemSub: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '500',
    },
    alertItemVal: {
      fontSize: 13,
      fontWeight: '800',
    },

    // Category Spending Limits
    sectionCard: {
      padding: 16,
      borderRadius: 20,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 12,
    },
    catProgressRow: { gap: 6 },
    catProgressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    catProgressName: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    catProgressVal: {
      color: colors.text.secondary,
      fontSize: 11.5,
      fontWeight: '600',
    },
    catTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
    },
    catFill: { height: '100%', borderRadius: 3 },

    // Financial Utilities Hub
    toolsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    toolCard: {
      width: '48.5%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 18,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 10,
    },
    toolIconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
    },
    toolTextWrap: { flex: 1, gap: 2 },
    toolTitle: {
      color: colors.text.primary,
      fontSize: 12.5,
      fontWeight: '700',
    },
    toolSubtitle: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '500',
    },
  });
