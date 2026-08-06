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
import { useCurrency } from '../../hooks/useCurrency';
import { useBudget } from '../../hooks/useBudget';
import { useSettings } from '../../context/SettingsContext';
import { storage } from '../../storage/mmkv';
import { getCategoryIcon } from '../../constants/categories';

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const { currencyCode, convertAmount, refresh: refreshCurrency } = useCurrency();
  const { formatCurrency, formatDate } = useSettings();

  const [refreshing, setRefreshing] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  const { debts, getTotalPendingAmount: getDebtTotal, refresh: refreshDebts } = useDebts();
  const { credits, getTotalPendingAmount: getCreditTotal, refresh: refreshCredits } = useCredits();
  const { subscriptions, getTotalAmount: getSubTotal, refresh: refreshSubs } = useSubscriptions();
  const { getDailyAverage, getTotalForMonth, refresh: refreshSpending, entries } = useDailySpending();
  const { budget, refresh: refreshBudget } = useBudget();

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const pMode = await storage.getString('privacy_mode_enabled');
      setPrivacyMode(pMode === 'true');
    } catch {}

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

  const togglePrivacyMode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextVal = !privacyMode;
    setPrivacyMode(nextVal);
    await storage.set('privacy_mode_enabled', nextVal ? 'true' : 'false');
  };

  const formatValue = (amount: number) => {
    if (privacyMode) return '••••••';
    return formatCurrency(amount, currencyCode);
  };

  // Metrics
  const totalDebt = getDebtTotal(convertAmount);
  const totalCredit = getCreditTotal(convertAmount);
  const totalSubs = getSubTotal(convertAmount);
  const monthlySpending = getTotalForMonth(new Date(), convertAmount);
  const dailyAvg = getDailyAverage('30d', convertAmount);

  // Net Cash Position: Credits Owed to You - Debts Owed
  const netPosition = totalCredit - totalDebt;

  // Upcoming Due Payments (Next 7 Days)
  const upcomingAlerts = useMemo(() => {
    const alerts: { id: string; title: string; subtitle: string; amount: number; type: 'debt' | 'sub'; date: string }[] = [];
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    debts.forEach((d) => {
      if (!d.isPaid && d.dueDate) {
        const dueTime = new Date(d.dueDate).getTime();
        const diff = dueTime - now;
        if (diff > 0 && diff <= sevenDays) {
          const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
          alerts.push({
            id: d.id,
            title: `Debt Due: ${d.personName}`,
            subtitle: `Due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
            amount: d.amount,
            type: 'debt',
            date: d.dueDate,
          });
        }
      }
    });

    subscriptions.forEach((s) => {
      if (s.isActive && s.expiryDate) {
        const expTime = new Date(s.expiryDate).getTime();
        const diff = expTime - now;
        if (diff > 0 && diff <= sevenDays) {
          const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
          alerts.push({
            id: s.id,
            title: `Renewal: ${s.name}`,
            subtitle: `Renews in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
            amount: s.amount,
            type: 'sub',
            date: s.expiryDate,
          });
        }
      }
    });

    return alerts;
  }, [debts, subscriptions]);

  // Category Outflow Progress
  const categoryProgress = useMemo(() => {
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

        const pct = limit > 0 ? Math.min(100, Math.round((catSpending / limit) * 100)) : 0;
        return { category: cat, spending: catSpending, limit, pct };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [budget.categoryLimits, entries, convertAmount]);

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Modern Executive Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingTitle}>Financial Dashboard</Text>
          <Text style={styles.greetingSub}>Real-Time Overview & Cash Flow</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={togglePrivacyMode} activeOpacity={0.8}>
            <Ionicons name={privacyMode ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/modals/settings')} activeOpacity={0.8}>
            <Ionicons name="settings-outline" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

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

          {/* Monthly Budget Meter */}
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

        {/* 1-Tap Quick Action Row */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modals/add-spending');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
              <Ionicons name="add-circle-outline" size={22} color={colors.accent.purple} />
            </View>
            <Text style={styles.actionText}>+ Expense</Text>
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
              <Ionicons name="hand-right-outline" size={20} color={colors.accent.red} />
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
              <Ionicons name="repeat-outline" size={20} color={colors.accent.blue} />
            </View>
            <Text style={styles.actionText}>+ Sub</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modals/tool-financial-calendar');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.accent.green} />
            </View>
            <Text style={styles.actionText}>Calendar</Text>
          </TouchableOpacity>
        </View>

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
            style={[styles.matrixCard, { borderColor: 'rgba(124, 58, 237, 0.25)' }]}
            onPress={() => router.push('/(tabs)/subscriptions')}
            activeOpacity={0.8}
          >
            <View style={styles.matrixCardTop}>
              <Ionicons name="refresh-circle-outline" size={20} color={colors.accent.purple} />
              <View style={[styles.pillBadge, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
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
              <Ionicons name="notifications-outline" size={18} color={colors.accent.amber} />
              <Text style={styles.alertsTitle}>UPCOMING PAYMENTS & RENEWALS</Text>
            </View>

            {upcomingAlerts.map((item) => (
              <View key={item.id} style={styles.alertRow}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertItemTitle}>{item.title}</Text>
                  <Text style={styles.alertItemSub}>{item.subtitle}</Text>
                </View>
                <Text style={[styles.alertItemVal, item.type === 'debt' ? { color: colors.accent.red } : { color: colors.accent.purple }]}>
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
              const barColor = item.pct >= 90 ? colors.accent.red : item.pct >= 70 ? colors.accent.amber : colors.accent.purple;

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
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 10,
    },
    greetingTitle: {
      color: colors.text.primary,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    greetingSub: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.glass.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 18,
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
    quickActionRow: {
      flexDirection: 'row',
      gap: 10,
    },
    actionTile: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    actionIconBox: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionText: {
      color: colors.text.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    sectionHeaderTitle: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginLeft: 2,
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
      fontSize: 12,
      fontWeight: '600',
    },
    alertsCard: {
      padding: 16,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.25)',
      gap: 10,
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
      paddingVertical: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    alertInfo: { flex: 1 },
    alertItemTitle: { color: colors.text.primary, fontSize: 13, fontWeight: '700' },
    alertItemSub: { color: colors.text.secondary, fontSize: 11, marginTop: 2 },
    alertItemVal: { fontSize: 13, fontWeight: '800' },
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
    catProgressName: { color: colors.text.primary, fontSize: 13, fontWeight: '700' },
    catProgressVal: { color: colors.text.secondary, fontSize: 12, fontWeight: '600' },
    catTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
    },
    catFill: { height: '100%', borderRadius: 3 },
    toolsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    toolCard: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 16,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    toolIconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolTextWrap: { flex: 1 },
    toolTitle: { color: colors.text.primary, fontSize: 12, fontWeight: '700' },
    toolSubtitle: { color: colors.text.secondary, fontSize: 10, marginTop: 1 },
  });
