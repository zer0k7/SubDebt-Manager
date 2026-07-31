import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { AmbientBackground } from '../../components/AmbientBackground';
import { useDebts, Debt } from '../../hooks/useDebts';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency } from '../../utils/dateHelpers';

type Strategy = 'snowball' | 'avalanche';

export default function ToolDebtPayoffModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const { debts } = useDebts();
  const { currencyCode, convertAmount } = useCurrency();

  const unpaidDebts = useMemo(() => debts.filter((d) => !d.isPaid), [debts]);
  const [strategy, setStrategy] = useState<Strategy>('snowball');
  const [extraPayment, setExtraPayment] = useState<number>(100);

  const plan = useMemo(() => {
    if (unpaidDebts.length === 0) {
      return {
        sortedDebts: [],
        totalDebt: 0,
        estimatedMonths: 0,
      };
    }

    const items = unpaidDebts.map((d) => {
      const paidSum = (d.payments || []).reduce((sum, p) => sum + p.amount, 0);
      const remaining = convertAmount(Math.max(0, d.amount - paidSum), d.currency);
      return { ...d, remainingAmount: remaining };
    });

    const totalDebt = items.reduce((sum, d) => sum + d.remainingAmount, 0);

    // Sort strategy
    if (strategy === 'snowball') {
      // Smallest balance first
      items.sort((a, b) => a.remainingAmount - b.remainingAmount);
    } else {
      // Highest balance first (Avalanche)
      items.sort((a, b) => b.remainingAmount - a.remainingAmount);
    }

    // Estimate months assuming minimum payments + extra payment
    const monthlyCapacity = Math.max(50, extraPayment);
    const estimatedMonths = Math.ceil(totalDebt / monthlyCapacity);

    return {
      sortedDebts: items,
      totalDebt,
      estimatedMonths,
    };
  }, [unpaidDebts, strategy, extraPayment, convertAmount]);

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Debt Payoff Simulator</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Total Debt Banner */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>TOTAL UNPAID DEBT LIABILITY</Text>
          <Text style={styles.heroAmount}>{formatCurrency(plan.totalDebt, currencyCode)}</Text>
          <Text style={styles.heroSub}>
            {plan.totalDebt > 0
              ? `Estimated debt-free in ~${plan.estimatedMonths} months with selected payoff plan.`
              : 'You have zero unpaid debts! Outstanding debt load is cleared. 🎉'}
          </Text>
        </View>

        {unpaidDebts.length > 0 && (
          <>
            {/* Step 1: Strategy Picker */}
            <Text style={styles.sectionTitle}>1. SELECT PAYOFF METHODOLOGY</Text>
            <View style={styles.strategyRow}>
              <TouchableOpacity
                style={[styles.strategyCard, strategy === 'snowball' && styles.strategyCardActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStrategy('snowball');
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="snow-outline"
                  size={22}
                  color={strategy === 'snowball' ? colors.accent.amber : colors.text.secondary}
                />
                <Text style={[styles.strategyTitle, strategy === 'snowball' && styles.strategyTitleActive]}>
                  Debt Snowball
                </Text>
                <Text style={styles.strategyDesc}>Pay smallest balance first to build quick momentum & wins.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.strategyCard, strategy === 'avalanche' && styles.strategyCardActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStrategy('avalanche');
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="flame-outline"
                  size={22}
                  color={strategy === 'avalanche' ? colors.accent.red : colors.text.secondary}
                />
                <Text style={[styles.strategyTitle, strategy === 'avalanche' && styles.strategyTitleActive]}>
                  Debt Avalanche
                </Text>
                <Text style={styles.strategyDesc}>Pay largest balance first to eliminate major total liabilities.</Text>
              </TouchableOpacity>
            </View>

            {/* Step 2: Extra Monthly Repayment Capacity */}
            <Text style={styles.sectionTitle}>2. EXTRA MONTHLY PAYMENT CAPACITY</Text>
            <View style={styles.amountPresets}>
              {[50, 100, 250, 500].map((amt) => {
                const isActive = extraPayment === amt;
                return (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.presetChip, isActive && styles.presetChipActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setExtraPayment(amt);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetText, isActive && styles.presetTextActive]}>
                      +{formatCurrency(amt, currencyCode)}/mo
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Step 3: Priority Target List */}
            <Text style={styles.sectionTitle}>3. STEP-BY-STEP PAYOFF SEQUENCE</Text>
            <View style={styles.sequenceList}>
              {plan.sortedDebts.map((item, idx) => (
                <View key={item.id} style={styles.stepCard}>
                  <View style={styles.badgeStep}>
                    <Text style={styles.badgeStepText}>Target #{idx + 1}</Text>
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepTitle}>{item.personName}</Text>
                    <Text style={styles.stepNotes}>{item.purpose || item.notes || 'No description notes'}</Text>
                  </View>
                  <View style={styles.stepAmountBox}>
                    <Text style={styles.stepAmount}>{formatCurrency(item.remainingAmount, currencyCode)}</Text>
                    <Text style={styles.stepSub}>Remaining</Text>
                  </View>
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

  heroCard: {
    backgroundColor: colors.glass.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    marginBottom: 24,
  },
  heroLabel: { color: colors.text.tertiary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  heroAmount: { color: colors.text.primary, fontSize: 36, fontWeight: '800', letterSpacing: -1, marginBottom: 4 },
  heroSub: { color: colors.text.muted, fontSize: 13, textAlign: 'center' },

  sectionTitle: { color: colors.text.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },

  strategyRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  strategyCard: {
    flex: 1,
    backgroundColor: colors.glass.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    gap: 8,
  },
  strategyCardActive: {
    backgroundColor: isDark ? 'rgba(255,167,38,0.12)' : 'rgba(255,167,38,0.08)',
    borderColor: colors.accent.amber,
  },
  strategyTitle: { color: colors.text.primary, fontSize: 14, fontWeight: '700' },
  strategyTitleActive: { color: colors.accent.amber },
  strategyDesc: { color: colors.text.secondary, fontSize: 11, lineHeight: 16 },

  amountPresets: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  presetChip: {
    flex: 1,
    backgroundColor: colors.glass.card,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  presetChipActive: {
    backgroundColor: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)',
    borderColor: colors.accent.purple,
  },
  presetText: { color: colors.text.secondary, fontSize: 12, fontWeight: '600' },
  presetTextActive: { color: colors.accent.purple, fontWeight: '700' },

  sequenceList: { gap: 12 },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    gap: 12,
  },
  badgeStep: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeStepText: { color: colors.text.secondary, fontSize: 11, fontWeight: '700' },
  stepInfo: { flex: 1 },
  stepTitle: { color: colors.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  stepNotes: { color: colors.text.muted, fontSize: 12 },
  stepAmountBox: { alignItems: 'flex-end' },
  stepAmount: { color: colors.accent.red, fontSize: 15, fontWeight: '700' },
  stepSub: { color: colors.text.tertiary, fontSize: 10 },
});
