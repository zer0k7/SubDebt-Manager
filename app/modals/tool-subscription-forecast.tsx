import { useTheme } from '../../hooks/useTheme';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '../../components/AmbientBackground';
import { useSubscriptions, Subscription } from '../../hooks/useSubscriptions';
import { useCurrency } from '../../hooks/useCurrency';
import { useSettings } from '../../context/SettingsContext';

interface MonthForecast {
  monthName: string;
  year: number;
  totalCost: number;
  items: { sub: Subscription; cost: number }[];
}

export default function SubscriptionForecastModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { subscriptions } = useSubscriptions();
  const { currencyCode } = useCurrency();
  const { formatCurrency } = useSettings();

  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0);

  const forecast = useMemo(() => {
    const activeSubs = subscriptions.filter((s) => s.isActive);
    const months: MonthForecast[] = [];
    const now = new Date();

    for (let m = 0; m < 12; m++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const monthName = targetDate.toLocaleString('en-US', { month: 'short' });
      const year = targetDate.getFullYear();

      let monthTotal = 0;
      const items: { sub: Subscription; cost: number }[] = [];

      activeSubs.forEach((sub) => {
        const cycle = sub.billingCycle.toLowerCase();
        let chargeInMonth = false;
        let chargeAmount = sub.amount;

        if (cycle === 'monthly') {
          chargeInMonth = true;
        } else if (cycle === 'yearly') {
          const renewDate = new Date(sub.expiryDate || sub.startDate);
          if (renewDate.getMonth() === targetDate.getMonth()) {
            chargeInMonth = true;
          }
        } else if (cycle === 'weekly') {
          chargeInMonth = true;
          chargeAmount = sub.amount * 4; // approx 4 weeks/month
        } else {
          const renewDate = new Date(sub.expiryDate || sub.startDate);
          const diffMonths = (targetDate.getFullYear() - renewDate.getFullYear()) * 12 + (targetDate.getMonth() - renewDate.getMonth());
          if (diffMonths >= 0 && diffMonths % 3 === 0) {
            chargeInMonth = true;
          }
        }

        if (chargeInMonth) {
          monthTotal += chargeAmount;
          items.push({ sub, cost: chargeAmount });
        }
      });

      months.push({
        monthName: `${monthName} ${year.toString().slice(-2)}`,
        year,
        totalCost: monthTotal,
        items,
      });
    }

    const annualTotal = months.reduce((sum, m) => sum + m.totalCost, 0);
    const maxMonthCost = Math.max(...months.map((m) => m.totalCost), 1);

    return {
      months,
      annualTotal,
      monthlyAvg: Math.round(annualTotal / 12),
      maxMonthCost,
    };
  }, [subscriptions]);

  const activeMonthData = forecast.months[selectedMonthIndex] || forecast.months[0];

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>12-MONTH RENEWAL FORECAST</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total Annual Projection Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>PROJECTED 12-MONTH OUTFLOW</Text>
          <Text style={styles.heroAmount}>{formatCurrency(forecast.annualTotal, currencyCode)}</Text>
          <Text style={styles.heroSub}>
            ~{formatCurrency(forecast.monthlyAvg, currencyCode)}/month across {subscriptions.filter((s) => s.isActive).length} active subscriptions
          </Text>
        </View>

        {/* 12-Month Outflow Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>MONTHLY OUTFLOW TIMELINE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartContainer}>
            {forecast.months.map((m, idx) => {
              const isSelected = idx === selectedMonthIndex;
              const barHeightPct = Math.max((m.totalCost / forecast.maxMonthCost) * 100, 6);

              return (
                <TouchableOpacity
                  key={m.monthName}
                  style={styles.chartBarCol}
                  onPress={() => {
                    setSelectedMonthIndex(idx);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.barAmountText, isSelected && { color: colors.accent.purple, fontWeight: '800' }]}>
                    {m.totalCost > 0 ? `${Math.round(m.totalCost)}` : '0'}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${barHeightPct}%` },
                        isSelected ? { backgroundColor: colors.accent.purple } : { backgroundColor: colors.accent.blue },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isSelected && { color: colors.accent.purple, fontWeight: '800' }]}>
                    {m.monthName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Month Detail List */}
        <View style={styles.card}>
          <View style={styles.monthHeaderRow}>
            <Text style={styles.cardTitle}>EXPENSE BREAKDOWN ({activeMonthData.monthName})</Text>
            <Text style={styles.monthTotalVal}>{formatCurrency(activeMonthData.totalCost, currencyCode)}</Text>
          </View>

          {activeMonthData.items.length === 0 ? (
            <Text style={styles.emptyText}>No recurring charges projected for this month.</Text>
          ) : (
            activeMonthData.items.map(({ sub, cost }) => (
              <View key={sub.id} style={styles.subRow}>
                <View style={styles.subIconBox}>
                  <Ionicons name="refresh-circle-outline" size={22} color={colors.accent.purple} />
                </View>
                <View style={styles.subInfo}>
                  <Text style={styles.subName}>{sub.name}</Text>
                  <Text style={styles.subCycle}>
                    {sub.billingCycle} · {sub.category || 'General'}
                  </Text>
                </View>
                <Text style={styles.subPrice}>{formatCurrency(cost, currencyCode)}</Text>
              </View>
            ))
          )}
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
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.glass.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    headerTitle: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    content: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
    heroCard: {
      padding: 22,
      borderRadius: 24,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      alignItems: 'center',
    },
    heroLabel: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 6,
    },
    heroAmount: {
      color: colors.accent.purple,
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -1,
    },
    heroSub: {
      color: colors.text.secondary,
      fontSize: 13,
      fontWeight: '500',
      marginTop: 4,
    },
    card: {
      padding: 18,
      borderRadius: 22,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 14,
    },
    cardTitle: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    chartContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 14,
      paddingVertical: 10,
    },
    chartBarCol: {
      alignItems: 'center',
      gap: 6,
    },
    barAmountText: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '600',
    },
    barTrack: {
      width: 24,
      height: 120,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      borderRadius: 12,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    barFill: {
      width: '100%',
      borderRadius: 12,
    },
    barLabel: {
      color: colors.text.secondary,
      fontSize: 10,
      fontWeight: '600',
    },
    monthHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    monthTotalVal: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '800',
    },
    emptyText: {
      color: colors.text.muted,
      fontSize: 13,
      fontStyle: 'italic',
    },
    subRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    subIconBox: {
      marginRight: 12,
    },
    subInfo: { flex: 1 },
    subName: { color: colors.text.primary, fontSize: 14, fontWeight: '700' },
    subCycle: { color: colors.text.secondary, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
    subPrice: { color: colors.accent.purple, fontSize: 15, fontWeight: '800' },
  });
