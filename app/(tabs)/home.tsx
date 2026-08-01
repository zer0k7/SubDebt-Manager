import { useTheme } from '../../hooks/useTheme';
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { AmbientBackground } from '../../components/AmbientBackground';

import { useDebts } from '../../hooks/useDebts';
import { useCredits } from '../../hooks/useCredits';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { useDailySpending } from '../../hooks/useDailySpending';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency } from '../../utils/dateHelpers';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBudget } from '../../hooks/useBudget';
import { RadialGauge } from '../../components/RadialGauge';
import { storage } from '../../storage/mmkv';

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { currencyCode, convertAmount, refresh: refreshCurrency } = useCurrency();
  const [refreshing, setRefreshing] = React.useState(false);

  const { debts, getTotalPendingAmount: getDebtTotal, refresh: refreshDebts } = useDebts();
  const { credits, getTotalPendingAmount: getCreditTotal, refresh: refreshCredits } = useCredits();
  const { subscriptions, getTotalAmount: getSubTotal, refresh: refreshSubs } = useSubscriptions();
  const { getDailyAverage, getTotalForMonth, refresh: refreshSpending, entries, getCategoryTotals } = useDailySpending();
  const { budget, refresh: refreshBudget } = useBudget();
  const [privacyMode, setPrivacyMode] = React.useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const pMode = await storage.getString('privacy_mode_enabled');
      setPrivacyMode(pMode === 'true');
    } catch (e) {}

    await Promise.all([
      refreshCurrency(),
      refreshDebts(),
      refreshCredits(),
      refreshSubs(),
      refreshSpending(),
      refreshBudget(),
    ]);
    setRefreshing(false);
  }, [refreshCurrency, refreshDebts, refreshCredits, refreshSubs, refreshSpending, refreshBudget]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const formatValue = (amount: number) => {
    if (privacyMode) return '₹ •••••';
    return formatCurrency(amount, currencyCode);
  };

  const totalDebt = getDebtTotal(convertAmount);
  const totalCredit = getCreditTotal(convertAmount);
  const totalSubs = getSubTotal(convertAmount);
  const monthlySpending = getTotalForMonth(new Date(), convertAmount);
  const dailyAvg = getDailyAverage('30d', convertAmount);

  // Net Liability = (Debts + Subs + Expected Monthly Spending) - Credits
  const projectedLiability = totalDebt + totalSubs + (dailyAvg * 30) - totalCredit;

  // Insights computations
  const activeSubs = subscriptions.filter(s => s.isActive);
  const monthlyBleed = activeSubs.reduce((sum, s) => sum + convertAmount(s.amount, s.currency), 0);
  const annualBleed = monthlyBleed * 12;

  const paidDebts = debts.filter(d => d.isPaid && d.paidDate);
  const avgVelocity = useMemo(() => {
    if (paidDebts.length === 0) return 0;
    const deltas = paidDebts.map(d => {
      const taken = new Date(d.takenDate);
      const paid = new Date(d.paidDate!);
      return (paid.getTime() - taken.getTime()) / (1000 * 60 * 60 * 24);
    });
    return deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
  }, [paidDebts]);

  const { peakWeekday, categoryTotals, topCatPct } = useMemo(() => {
    const weekdayAmounts = [0, 0, 0, 0, 0, 0, 0];
    entries.forEach(e => {
      const day = new Date(e.spentAt).getDay();
      weekdayAmounts[day] += convertAmount(e.amount, e.currency);
    });
    const maxWeekdayAmount = Math.max(...weekdayAmounts);
    const peakWeekdayIndex = weekdayAmounts.indexOf(maxWeekdayAmount);
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peak = maxWeekdayAmount > 0 ? weekdayNames[peakWeekdayIndex] : null;

    const catTotals = getCategoryTotals('30d', convertAmount);
    const topPct = monthlySpending > 0 && catTotals.length > 0 ? Math.round((catTotals[0].total / monthlySpending) * 100) : 0;

    return { peakWeekday: peak, categoryTotals: catTotals, topCatPct: topPct };
  }, [entries, convertAmount, getCategoryTotals, monthlySpending]);

  const categoryGaugesData = useMemo(() => {
    if (!budget.categoryLimits) return [];
    return Object.keys(budget.categoryLimits)
      .map((cat) => {
        const limit = budget.categoryLimits[cat];
        if (limit <= 0) return null;
        
        const catSpending = entries
          .filter((e) => {
            const spent = new Date(e.spentAt);
            const now = new Date();
            return e.category === cat && spent.getMonth() === now.getMonth() && spent.getFullYear() === now.getFullYear();
          })
          .reduce((sum, e) => sum + convertAmount(e.amount, e.currency), 0);
          
        const percentage = limit > 0 ? (catSpending / limit) * 100 : 0;
        
        let gaugeColor = colors.accent.blue;
        if (percentage >= 100) {
          gaugeColor = colors.accent.red;
        } else if (percentage >= 80) {
          gaugeColor = colors.accent.amber;
        }
        
        return {
          category: cat,
          spending: catSpending,
          limit,
          percentage,
          color: gaugeColor,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [budget.categoryLimits, entries, convertAmount, colors]);

  const healthAlerts = useMemo(() => {
    return categoryGaugesData
      .filter(item => item.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage);
  }, [categoryGaugesData]);

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Overview</Text>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => router.push('/modals/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.accent.blue} />
        }
      >
        {/* Net Liability Score */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>PROJECTED MONTHLY LIABILITY</Text>
          <Text style={[styles.heroAmount, projectedLiability < 0 && { color: colors.accent.green }]}>
            {formatValue(Math.abs(projectedLiability))}
          </Text>
          <Text style={styles.heroSub}>
            {projectedLiability > 0 ? 'You owe/spend more than you are owed' : 'You are owed more than your expected liabilities'}
          </Text>
        </View>

        {/* Monthly Budget Card */}
        {budget.amount > 0 && (
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <View>
                <Text style={styles.budgetCardLabel}>MONTHLY BUDGET LIMIT</Text>
                <Text style={styles.budgetAmountText}>
                  {formatCurrency(monthlySpending, currencyCode)} / {formatCurrency(budget.amount, currencyCode)}
                </Text>
              </View>
              {monthlySpending > budget.amount ? (
                <View style={[styles.badge, styles.badgeRed]}>
                  <Text style={[styles.badgeText, styles.badgeTextRed]}>OVERLIMIT</Text>
                </View>
              ) : monthlySpending > budget.amount * 0.9 ? (
                <View style={[styles.badge, styles.badgeCrimson]}>
                  <Text style={[styles.badgeText, styles.badgeTextCrimson]}>CRITICAL (90%+)</Text>
                </View>
              ) : monthlySpending > budget.amount * 0.7 ? (
                <View style={[styles.badge, styles.badgeOrange]}>
                  <Text style={[styles.badgeText, styles.badgeTextOrange]}>WARNING (70%+)</Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.badgeGreen]}>
                  <Text style={[styles.badgeText, styles.badgeTextGreen]}>ON TRACK</Text>
                </View>
              )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBg}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(100, Math.round((monthlySpending / budget.amount) * 100))}%`,
                    backgroundColor: monthlySpending > budget.amount 
                      ? colors.accent.red 
                      : monthlySpending > budget.amount * 0.7 
                        ? colors.accent.amber 
                        : '#26A69A'
                  }
                ]} 
              />
            </View>
            <Text style={styles.budgetSubText}>
              {monthlySpending > budget.amount 
                ? `You have exceeded your monthly limit by ${formatCurrency(monthlySpending - budget.amount, currencyCode)}!`
                : `${Math.max(0, Math.round(((budget.amount - monthlySpending) / budget.amount) * 100))}% of your budget remaining.`
              }
            </Text>

            {/* Category Budgets Grid */}
            {categoryGaugesData.length > 0 && (
              <View style={styles.categoryLimitsGrid}>
                <Text style={styles.categoryLimitsTitle}>Category Spending Progress</Text>
                <View style={styles.radialGaugesGrid}>
                  {categoryGaugesData.map((item) => (
                    <View key={item.category} style={styles.radialGaugeCard}>
                      <RadialGauge
                        percentage={item.percentage}
                        color={item.color}
                        label={item.category}
                        valueText={`${formatCurrency(item.spending, currencyCode)} / ${formatCurrency(item.limit, currencyCode)}`}
                        size={64}
                        strokeWidth={5}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Smart Health Alerts Panel */}
        {healthAlerts.length > 0 && (
          <View 
            style={[
              styles.healthAlertsCard, 
              { 
                borderColor: healthAlerts[0].percentage >= 100 
                  ? colors.accent.red 
                  : colors.accent.amber 
              }
            ]}
          >
            <View style={styles.healthAlertsHeader}>
              <Ionicons 
                name={healthAlerts[0].percentage >= 100 ? "alert-circle" : "warning"} 
                size={18} 
                color={healthAlerts[0].percentage >= 100 ? colors.accent.red : colors.accent.amber} 
              />
              <Text style={[styles.healthAlertsTitle, { color: healthAlerts[0].percentage >= 100 ? colors.accent.red : colors.accent.amber }]}>
                BUDGET HEALTH ALERTS
              </Text>
            </View>
            <View style={styles.healthAlertsList}>
              {healthAlerts.map((alert) => {
                const isCritical = alert.percentage >= 100;
                return (
                  <View key={alert.category} style={styles.healthAlertRow}>
                    <Ionicons 
                      name={isCritical ? "flame-outline" : "trending-up-outline"} 
                      size={16} 
                      color={isCritical ? colors.accent.red : colors.accent.amber} 
                      style={styles.healthAlertIcon}
                    />
                    <View style={styles.healthAlertInfo}>
                      <Text style={styles.healthAlertText}>
                        <Text style={styles.healthAlertBold}>{alert.category}</Text>: {
                          isCritical 
                            ? `Over-limit by ${formatCurrency(alert.spending - alert.limit, currencyCode)}!`
                            : `Approaching limit! Only ${formatCurrency(alert.limit - alert.spending, currencyCode)} left.`
                        }
                      </Text>
                      <Text style={styles.healthAlertSub}>
                        {isCritical 
                          ? `Action Required: Freeze spending in ${alert.category} immediately.`
                          : `Recommendation: Reduce unnecessary expenses in ${alert.category} this week.`
                        }
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick Stats Grid */}
        <View style={styles.grid}>
          <View style={[styles.gridItem, { borderColor: isDark ? 'rgba(239,83,80,0.3)' : 'rgba(239,83,80,0.2)' }]}>
            <Ionicons name="wallet-outline" size={20} color={colors.accent.red} />
            <Text style={styles.gridAmount}>{formatValue(totalDebt)}</Text>
            <Text style={styles.gridLabel}>Pending Debts</Text>
          </View>
          <View style={[styles.gridItem, { borderColor: isDark ? 'rgba(102,187,106,0.3)' : 'rgba(102,187,106,0.2)' }]}>
            <Ionicons name="cash-outline" size={20} color={colors.accent.green} />
            <Text style={styles.gridAmount}>{formatValue(totalCredit)}</Text>
            <Text style={styles.gridLabel}>Owed to You</Text>
          </View>
          <View style={[styles.gridItem, { borderColor: colors.accent.alpha ? colors.accent.alpha(isDark ? 0.3 : 0.2) : (isDark ? 'rgba(79,195,247,0.3)' : 'rgba(79,195,247,0.2)') }]}>
            <Ionicons name="card-outline" size={20} color={colors.accent.blue} />
            <Text style={styles.gridAmount}>{formatValue(totalSubs)}</Text>
            <Text style={styles.gridLabel}>Monthly Subs</Text>
          </View>
          <View style={[styles.gridItem, { borderColor: isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)' }]}>
            <Ionicons name="receipt-outline" size={20} color={colors.accent.purple} />
            <Text style={styles.gridAmount}>{formatValue(monthlySpending)}</Text>
            <Text style={styles.gridLabel}>Spent This Month</Text>
          </View>
        </View>

        {/* Financial Tools Suite */}
        <Text style={styles.sectionTitle}>FINANCIAL TOOLS & UTILITIES</Text>
        <View style={styles.toolsGrid}>
          {[
            { id: 'health-audit', title: 'Health Audit', subtitle: 'Diagnostic & Score', icon: 'pulse-outline', color: colors.accent.green, route: '/modals/tool-health-audit' },
            { id: 'reminder-gen', title: 'Reminders', subtitle: 'WhatsApp / SMS', icon: 'paper-plane-outline', color: colors.accent.blue, route: '/modals/tool-reminder-generator' },
            { id: 'debt-payoff', title: 'Debt Payoff', subtitle: 'Snowball vs Avalanche', icon: 'calculator-outline', color: colors.accent.amber, route: '/modals/tool-debt-payoff' },
            { id: 'currency-converter', title: 'Converter', subtitle: 'Offline FX Rates', icon: 'swap-horizontal-outline', color: colors.accent.purple, route: '/modals/tool-currency-converter' },
            { id: 'export-statement', title: 'PDF & Statements', subtitle: 'Custom Reports', icon: 'document-text-outline', color: '#26A69A', route: '/modals/export-pdf' },
            { id: 'security-vault', title: 'Data Vault', subtitle: 'Backup & Restore', icon: 'shield-checkmark-outline', color: '#EC4899', route: '/modals/tool-data-vault' },
          ].map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(tool.route as any);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIconBox, { backgroundColor: `${tool.color}15`, borderColor: `${tool.color}40` }]}>
                <Ionicons name={tool.icon as any} size={22} color={tool.color} />
              </View>
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity Summary */}
        <Text style={styles.sectionTitle}>APP HEALTH</Text>
        <View style={styles.healthCard}>
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Active Subscriptions</Text>
            <Text style={styles.healthValue}>{subscriptions.filter(s => s.isActive).length}</Text>
          </View>
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Unpaid Debts</Text>
            <Text style={styles.healthValue}>{debts.filter(d => !d.isPaid).length}</Text>
          </View>
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Unreturned Credits</Text>
            <Text style={styles.healthValue}>{credits.filter(c => !c.isReturned).length}</Text>
          </View>
          <View style={[styles.healthRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.healthLabel}>Total Spending Entries</Text>
            <Text style={styles.healthValue}>{entries.length}</Text>
          </View>
        </View>

        {/* Financial Insights Engine */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>FINANCIAL INSIGHTS</Text>
        <View style={styles.insightsCard}>
          {/* Bleed */}
          <View style={styles.insightRow}>
            <View style={styles.insightIconBox}>
              <Ionicons name="trending-down-outline" size={20} color={colors.accent.red} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Annual Subscription Bleed</Text>
              <Text style={styles.insightDesc}>
                {annualBleed > 0 
                  ? `You are losing ${formatCurrency(annualBleed, currencyCode)} annually to active recurring subscriptions. Review them to optimize cash flow.`
                  : 'No active subscriptions detected. You have zero subscription leak! 💡'
                }
              </Text>
            </View>
          </View>

          {/* Velocity */}
          <View style={styles.insightRow}>
            <View style={styles.insightIconBox}>
              <Ionicons name="speedometer-outline" size={20} color={colors.accent.blue} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Debt Clearance Velocity</Text>
              <Text style={styles.insightDesc}>
                {paidDebts.length > 0 
                  ? `Average clearance speed: ${avgVelocity.toFixed(1)} days. ${
                      avgVelocity < 7 
                        ? '⚡ Lightning Fast! You settle outstanding balances immediately.' 
                        : avgVelocity < 21 
                          ? ' Steady and consistent pacing in clearing your debts.' 
                          : ' Slower pacing. Try setting earlier reminders to clear debts.'
                    }`
                  : 'No cleared debts found yet. Clearance metrics will appear once you settle pending bills.'
                }
              </Text>
            </View>
          </View>

          {/* Peak Spending Day & Category */}
          <View style={[styles.insightRow, { borderBottomWidth: 0 }]}>
            <View style={styles.insightIconBox}>
              <Ionicons name="pie-chart-outline" size={20} color={colors.accent.purple} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Peak Spending Patterns</Text>
              <Text style={styles.insightDesc}>
                {peakWeekday 
                  ? `🛍️ Most active spending day is ${peakWeekday}. `
                  : 'Accumulating weekday patterns... '
                }
                {categoryTotals.length > 0 && categoryTotals[0].total > 0
                  ? `🍔 Top category this month is ${categoryTotals[0].category}, accounting for ${topCatPct}% of monthly outflow.`
                  : 'Add categorized spending entries to analyze peak categories.'
                }
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  title: { color: colors.text.primary, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  content: { padding: 20, paddingBottom: 120 },
  
  heroCard: {
    backgroundColor: colors.glass.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroLabel: { color: colors.text.tertiary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  heroAmount: { color: colors.text.primary, fontSize: 36, fontWeight: '800', letterSpacing: -1, marginBottom: 4 },
  heroSub: { color: colors.text.muted, fontSize: 13, textAlign: 'center' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: '48%',
    backgroundColor: colors.glass.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  gridAmount: { color: colors.text.primary, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  gridLabel: { color: colors.text.secondary, fontSize: 12, fontWeight: '500' },

  sectionTitle: { color: colors.text.primary, fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  healthCard: {
    backgroundColor: colors.glass.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
  },
  healthLabel: { color: colors.text.secondary, fontSize: 14 },
  healthValue: { color: colors.text.primary, fontSize: 16, fontWeight: '700' },

  // Budget Card Styles
  budgetCard: {
    backgroundColor: colors.glass.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    marginBottom: 20,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCardLabel: {
    color: colors.text.tertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  budgetAmountText: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeRed: {
    backgroundColor: 'rgba(239, 83, 80, 0.15)',
    borderColor: 'rgba(239, 83, 80, 0.3)',
  },
  badgeTextRed: {
    color: colors.accent.red,
  },
  badgeCrimson: {
    backgroundColor: 'rgba(244, 67, 54, 0.12)',
    borderColor: 'rgba(244, 67, 54, 0.25)',
  },
  badgeTextCrimson: {
    color: colors.accent.red,
  },
  badgeOrange: {
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
    borderColor: 'rgba(255, 167, 38, 0.3)',
  },
  badgeTextOrange: {
    color: colors.accent.amber,
  },
  badgeGreen: {
    backgroundColor: 'rgba(38, 166, 154, 0.15)',
    borderColor: 'rgba(38, 166, 154, 0.3)',
  },
  badgeTextGreen: {
    color: '#26A69A',
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetSubText: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Category limits inside budget card
  categoryLimitsGrid: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderStyle: 'solid',
    borderTopColor: colors.glass.cardBorder,
  },
  categoryLimitsTitle: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  categoryLimitBarRow: {
    marginBottom: 12,
  },
  categoryLimitBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryLimitBarLabel: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryLimitBarVal: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  radialGaugesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  radialGaugeCard: {
    width: '48%',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.glass.cardBorder,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthAlertsCard: {
    backgroundColor: colors.glass.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glass.cardBorder,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  healthAlertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  healthAlertsTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  healthAlertsList: {
    gap: 12,
  },
  healthAlertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  healthAlertIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  healthAlertInfo: {
    flex: 1,
  },
  healthAlertText: {
    color: colors.text.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  healthAlertBold: {
    fontWeight: '700',
  },
  healthAlertSub: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },

  // Insights Card Styles
  insightsCard: {
    backgroundColor: colors.glass.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    marginBottom: 30,
  },
  insightRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
  },
  insightIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  insightDesc: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  toolCard: {
    width: '48%',
    backgroundColor: colors.glass.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    gap: 6,
  },
  toolIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  toolTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  toolSubtitle: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: '500',
  },
});
