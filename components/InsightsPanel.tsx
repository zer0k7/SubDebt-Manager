import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/dateHelpers';
import { SpendingEntry } from '../hooks/useDailySpending';

interface InsightsPanelProps {
  noSpendDaysMonth: number;
  savingMessage: string;
  dailyAvg: number;
  topExpenses: SpendingEntry[];
  currencyCode: string;
  budgetAmount: number;
  monthTotal: number;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  noSpendDaysMonth,
  savingMessage,
  dailyAvg,
  topExpenses,
  currencyCode,
  budgetAmount,
  monthTotal,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const today = new Date();
  const daysLeftInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
  const projectedMonthEnd = monthTotal + dailyAvg * daysLeftInMonth;
  const dailyAllowance = budgetAmount > 0 && daysLeftInMonth > 0
    ? Math.max(0, (budgetAmount - monthTotal) / daysLeftInMonth)
    : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>SMART INSIGHTS</Text>

      <View style={styles.insightRow}>
        <View style={[styles.insightIcon, { backgroundColor: isDark ? 'rgba(102,187,106,0.12)' : 'rgba(22,163,74,0.08)' }]}>
          <Ionicons name="leaf-outline" size={16} color={colors.accent.green} />
        </View>
        <View style={styles.insightInfo}>
          <Text style={styles.insightLabel}>{savingMessage}</Text>
          <Text style={styles.insightSub}>{noSpendDaysMonth} no-spend days this month</Text>
        </View>
      </View>

      {budgetAmount > 0 && daysLeftInMonth > 0 && (
        <View style={styles.insightRow}>
          <View style={[styles.insightIcon, { backgroundColor: isDark ? 'rgba(79,195,247,0.12)' : 'rgba(2,132,199,0.08)' }]}>
            <Ionicons name="wallet-outline" size={16} color={colors.accent.blue} />
          </View>
          <View style={styles.insightInfo}>
            <Text style={styles.insightLabel}>
              Daily allowance: {formatCurrency(dailyAllowance, currencyCode)}
            </Text>
            <Text style={styles.insightSub}>{daysLeftInMonth} days left in month</Text>
          </View>
        </View>
      )}

      {dailyAvg > 0 && (
        <View style={styles.insightRow}>
          <View style={[styles.insightIcon, { backgroundColor: isDark ? 'rgba(255,183,77,0.12)' : 'rgba(245,158,11,0.08)' }]}>
            <Ionicons name="trending-up-outline" size={16} color={colors.accent.amber} />
          </View>
          <View style={styles.insightInfo}>
            <Text style={styles.insightLabel}>
              Projected month-end: {formatCurrency(projectedMonthEnd, currencyCode)}
            </Text>
            <Text style={styles.insightSub}>
              Based on {formatCurrency(dailyAvg, currencyCode)}/day avg
            </Text>
          </View>
        </View>
      )}

      {topExpenses.length > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.subTitle}>TOP EXPENSES</Text>
          {topExpenses.slice(0, 3).map((expense, i) => (
            <View key={expense.id} style={styles.topRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{i + 1}</Text>
              </View>
              <Text style={styles.topName} numberOfLines={1}>{expense.title}</Text>
              <Text style={styles.topAmount}>
                {formatCurrency(expense.amount, expense.currency)}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 20,
      marginBottom: 14,
      padding: 18,
      borderRadius: 22,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    title: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.8,
      marginBottom: 14,
    },
    subTitle: {
      color: colors.text.tertiary,
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.6,
      marginBottom: 10,
    },
    insightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    insightIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    insightInfo: {
      flex: 1,
    },
    insightLabel: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    insightSub: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '500',
      marginTop: 1,
    },
    divider: {
      height: 0.5,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      marginVertical: 12,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    rankBadge: {
      width: 22,
      height: 22,
      borderRadius: 7,
      backgroundColor: isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    rankText: {
      color: colors.accent.purple,
      fontSize: 11,
      fontWeight: '700',
    },
    topName: {
      flex: 1,
      color: colors.text.secondary,
      fontSize: 13,
      fontWeight: '500',
      marginRight: 8,
    },
    topAmount: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
  });
