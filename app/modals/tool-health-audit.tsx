import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { AmbientBackground } from '../../components/AmbientBackground';
import { useDebts } from '../../hooks/useDebts';
import { useCredits } from '../../hooks/useCredits';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { useDailySpending } from '../../hooks/useDailySpending';
import { useBudget } from '../../hooks/useBudget';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency } from '../../utils/dateHelpers';

export default function ToolHealthAuditModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const { debts, getTotalPendingAmount: getDebtTotal } = useDebts();
  const { credits, getTotalPendingAmount: getCreditTotal } = useCredits();
  const { subscriptions, getTotalAmount: getSubTotal } = useSubscriptions();
  const { getTotalForMonth, entries } = useDailySpending();
  const { budget } = useBudget();
  const { currencyCode, convertAmount } = useCurrency();

  const audit = useMemo(() => {
    const totalDebt = getDebtTotal(convertAmount);
    const totalCredit = getCreditTotal(convertAmount);
    const totalSubs = getSubTotal(convertAmount);
    const monthlySpending = getTotalForMonth(new Date(), convertAmount);

    let score = 100;
    const warnings: { id: string; title: string; desc: string; severity: 'critical' | 'warning' | 'good' }[] = [];
    const recommendations: { title: string; actionText: string; route?: string }[] = [];

    // 1. Budget Audit
    if (budget.amount > 0) {
      const budgetPct = (monthlySpending / budget.amount) * 100;
      if (budgetPct >= 100) {
        score -= 30;
        warnings.push({
          id: 'budget-exceeded',
          title: 'Monthly Budget Exceeded',
          desc: `You have spent ${formatCurrency(monthlySpending, currencyCode)}, exceeding your budget of ${formatCurrency(budget.amount, currencyCode)} by ${formatCurrency(monthlySpending - budget.amount, currencyCode)}.`,
          severity: 'critical',
        });
        recommendations.push({
          title: 'Review recent daily spending logs to identify high outflow entries.',
          actionText: 'Open Spending Logs',
          route: '/(tabs)/spending',
        });
      } else if (budgetPct >= 80) {
        score -= 15;
        warnings.push({
          id: 'budget-warning',
          title: 'Budget Near Capacity (80%+)',
          desc: `You are at ${Math.round(budgetPct)}% of your monthly spending limit.`,
          severity: 'warning',
        });
      } else {
        warnings.push({
          id: 'budget-ok',
          title: 'Healthy Monthly Outflow',
          desc: `You have consumed only ${Math.round(budgetPct)}% of your set limit.`,
          severity: 'good',
        });
      }
    }

    // 2. Subscription Bleed Audit
    const activeSubs = subscriptions.filter(s => s.isActive);
    const annualSubBleed = totalSubs * 12;
    if (totalSubs > 0) {
      if (annualSubBleed > 500) {
        score -= 15;
        warnings.push({
          id: 'sub-bleed-high',
          title: 'High Subscription Outflow',
          desc: `You spend ${formatCurrency(totalSubs, currencyCode)} monthly (${formatCurrency(annualSubBleed, currencyCode)}/yr) across ${activeSubs.length} active recurring services.`,
          severity: 'warning',
        });
        recommendations.push({
          title: 'Audit recurring subscriptions and cancel unused or duplicate services.',
          actionText: 'Manage Subscriptions',
          route: '/(tabs)/subscriptions',
        });
      } else {
        warnings.push({
          id: 'sub-bleed-ok',
          title: 'Optimized Recurring Expenses',
          desc: `Active subscriptions total ${formatCurrency(totalSubs, currencyCode)}/mo across ${activeSubs.length} items.`,
          severity: 'good',
        });
      }
    }

    // 3. Debt vs Credit Balance Audit
    const unpaidDebtsCount = debts.filter(d => !d.isPaid).length;
    const unpaidCreditsCount = credits.filter(c => !c.isReturned).length;

    if (totalDebt > totalCredit && totalDebt > 0) {
      score -= 20;
      warnings.push({
        id: 'debt-heavy',
        title: 'Net Debt Liability',
        desc: `You owe ${formatCurrency(totalDebt, currencyCode)} across ${unpaidDebtsCount} debts, which exceeds what is owed to you (${formatCurrency(totalCredit, currencyCode)}).`,
        severity: 'critical',
      });
      recommendations.push({
        title: 'Use the Debt Payoff Simulator to structure a repayment schedule.',
        actionText: 'Payoff Simulator',
        route: '/modals/tool-debt-payoff',
      });
    } else if (totalCredit > 0) {
      warnings.push({
        id: 'credit-positive',
        title: 'Positive Debt/Credit Balance',
        desc: `You are owed ${formatCurrency(totalCredit, currencyCode)} across ${unpaidCreditsCount} people.`,
        severity: 'good',
      });
      if (unpaidCreditsCount > 0) {
        recommendations.push({
          title: 'Send friendly payment reminder notes to individuals who owe you money.',
          actionText: 'Generate Reminders',
          route: '/modals/tool-reminder-generator',
        });
      }
    }

    // Clamp score
    const finalScore = Math.max(0, Math.min(100, score));
    let scoreColor = colors.accent.green;
    let scoreStatus = 'EXCELLENT';

    if (finalScore < 50) {
      scoreColor = colors.accent.red;
      scoreStatus = 'CRITICAL ATTENTION NEEDED';
    } else if (finalScore < 75) {
      scoreColor = colors.accent.amber;
      scoreStatus = 'MODERATE RISK';
    } else if (finalScore < 90) {
      scoreColor = colors.accent.blue;
      scoreStatus = 'GOOD HEALTH';
    }

    return {
      score: finalScore,
      scoreColor,
      scoreStatus,
      warnings,
      recommendations,
      totalDebt,
      totalCredit,
      totalSubs,
      monthlySpending,
    };
  }, [debts, credits, subscriptions, entries, budget, currencyCode, convertAmount, getDebtTotal, getCreditTotal, getSubTotal, getTotalForMonth, colors]);

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Financial Health Audit</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Score Badge Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>FINANCIAL HEALTH SCORE</Text>
          <View style={styles.scoreCircleContainer}>
            <Text style={[styles.scoreValue, { color: audit.scoreColor }]}>{audit.score}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: audit.scoreColor, backgroundColor: `${audit.scoreColor}15` }]}>
            <Text style={[styles.statusBadgeText, { color: audit.scoreColor }]}>{audit.scoreStatus}</Text>
          </View>
        </View>

        {/* Diagnostic Checks */}
        <Text style={styles.sectionTitle}>DIAGNOSTIC AUDIT RESULTS</Text>
        <View style={styles.warningsContainer}>
          {audit.warnings.length === 0 ? (
            <View style={styles.warningCard}>
              <View style={styles.warningHeader}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.accent.green} />
                <Text style={[styles.warningTitle, { color: colors.accent.green }]}>All Checks Passed</Text>
              </View>
              <Text style={styles.warningDesc}>No financial risks or budget warnings detected. Your cash flow is in great shape!</Text>
            </View>
          ) : (
            audit.warnings.map((item) => {
              const isCrit = item.severity === 'critical';
              const isWarn = item.severity === 'warning';
              const iconName = isCrit ? 'alert-circle' : isWarn ? 'warning-outline' : 'checkmark-circle-outline';
              const itemColor = isCrit ? colors.accent.red : isWarn ? colors.accent.amber : colors.accent.green;

              return (
                <View key={item.id} style={[styles.warningCard, { borderColor: `${itemColor}40` }]}>
                  <View style={styles.warningHeader}>
                    <Ionicons name={iconName as any} size={20} color={itemColor} />
                    <Text style={[styles.warningTitle, { color: itemColor }]}>{item.title}</Text>
                  </View>
                  <Text style={styles.warningDesc}>{item.desc}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Actionable Recommendations */}
        {audit.recommendations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>RECOMMENDED ACTIONS</Text>
            <View style={styles.recommendationsList}>
              {audit.recommendations.map((rec, idx) => (
                <View key={idx} style={styles.recCard}>
                  <View style={styles.recTextWrap}>
                    <Ionicons name="bulb-outline" size={18} color={colors.accent.amber} style={{ marginTop: 2 }} />
                    <Text style={styles.recText}>{rec.title}</Text>
                  </View>
                  {rec.route && (
                    <TouchableOpacity
                      style={styles.recBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.navigate(rec.route as any);
                      }}
                    >
                      <Text style={styles.recBtnText}>{rec.actionText}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.accent.blue} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  headerTitle: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },

  scoreCard: {
    backgroundColor: colors.glass.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    marginBottom: 24,
  },
  scoreLabel: { color: colors.text.tertiary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  scoreCircleContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  scoreValue: { fontSize: 54, fontWeight: '900', letterSpacing: -1 },
  scoreMax: { color: colors.text.muted, fontSize: 20, fontWeight: '700', marginLeft: 4 },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  sectionTitle: { color: colors.text.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  warningsContainer: { gap: 12, marginBottom: 24 },
  warningCard: {
    backgroundColor: colors.glass.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warningTitle: { fontSize: 14, fontWeight: '700' },
  warningDesc: { color: colors.text.secondary, fontSize: 13, lineHeight: 18 },

  recommendationsList: { gap: 12 },
  recCard: {
    backgroundColor: colors.glass.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    gap: 12,
  },
  recTextWrap: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  recText: { color: colors.text.primary, fontSize: 13, lineHeight: 18, flex: 1, fontWeight: '500' },
  recBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.glass.cardBorder,
  },
  recBtnText: { color: colors.accent.blue, fontSize: 12, fontWeight: '700' },
});
