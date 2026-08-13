import { useTheme } from '../../hooks/useTheme';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '../../components/AmbientBackground';
import { GlassButton } from '../../components/GlassButton';
import { useCurrency } from '../../hooks/useCurrency';
import { useSettings } from '../../context/SettingsContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AmortizationRow {
  period: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

export default function EmiCalculatorModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { currencyCode } = useCurrency();
  const { formatCurrency } = useSettings();

  const [principal, setPrincipal] = useState('100000');
  const [interestRate, setInterestRate] = useState('10.5');
  const [tenureYears, setTenureYears] = useState('3');
  const [tenureType, setTenureType] = useState<'years' | 'months'>('years');
  const [lenderName, setLenderName] = useState('');
  const [showAmortization, setShowAmortization] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'yearly' | 'monthly'>('yearly');

  // Math Calculations
  const calculation = useMemo(() => {
    const P = parseFloat(principal) || 0;
    const annualR = parseFloat(interestRate) || 0;
    const t = parseFloat(tenureYears) || 0;

    if (P <= 0 || annualR < 0 || t <= 0) {
      return {
        emi: 0,
        totalInterest: 0,
        totalPayable: 0,
        monthlySchedule: [],
        yearlySchedule: [],
        interestPercent: 0,
      };
    }

    const n = tenureType === 'years' ? Math.round(t * 12) : Math.round(t);
    if (n <= 0) {
      return { emi: 0, totalInterest: 0, totalPayable: 0, monthlySchedule: [], yearlySchedule: [], interestPercent: 0 };
    }

    const r = annualR / 12 / 100; // monthly rate
    let emi = 0;
    let totalPayable = 0;
    let totalInterest = 0;

    if (r === 0) {
      emi = P / n;
      totalPayable = P;
      totalInterest = 0;
    } else {
      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      totalPayable = emi * n;
      totalInterest = Math.max(0, totalPayable - P);
    }

    // Build Monthly Amortization
    let balance = P;
    const monthlySchedule: AmortizationRow[] = [];
    const yearlyMap: Record<number, { emi: number; principal: number; interest: number; balance: number }> = {};

    for (let m = 1; m <= n; m++) {
      const interestForMonth = balance * r;
      const principalForMonth = Math.min(balance, emi - interestForMonth);
      balance = Math.max(0, balance - principalForMonth);

      monthlySchedule.push({
        period: m,
        emi,
        principal: principalForMonth,
        interest: interestForMonth,
        balance,
      });

      const yearNum = Math.ceil(m / 12);
      if (!yearlyMap[yearNum]) {
        yearlyMap[yearNum] = { emi: 0, principal: 0, interest: 0, balance: 0 };
      }
      yearlyMap[yearNum].emi += emi;
      yearlyMap[yearNum].principal += principalForMonth;
      yearlyMap[yearNum].interest += interestForMonth;
      yearlyMap[yearNum].balance = balance;
    }

    const yearlySchedule: AmortizationRow[] = Object.keys(yearlyMap).map((yStr) => {
      const y = parseInt(yStr, 10);
      return {
        period: y,
        ...yearlyMap[y],
      };
    });

    const interestPercent = totalPayable > 0 ? Math.round((totalInterest / totalPayable) * 100) : 0;

    return {
      emi: isNaN(emi) ? 0 : emi,
      totalInterest: isNaN(totalInterest) ? 0 : totalInterest,
      totalPayable: isNaN(totalPayable) ? 0 : totalPayable,
      monthlySchedule,
      yearlySchedule,
      interestPercent,
    };
  }, [principal, interestRate, tenureYears, tenureType]);

  const toggleAmortization = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAmortization(!showAmortization);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveAsDebt = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const pVal = parseFloat(principal) || 0;
    const lender = lenderName.trim() || 'Bank Loan';
    router.push({
      pathname: '/modals/add-debt',
      params: {
        prefillPerson: lender,
        prefillAmount: pVal.toString(),
        prefillNotes: `EMI Loan: ${formatCurrency(calculation.emi, currencyCode)}/mo for ${tenureYears} ${tenureType} @ ${interestRate}% p.a.`,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LOAN & EMI CALCULATOR</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Input Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>LOAN PARAMETERS</Text>

          {/* Principal */}
          <Text style={styles.inputTitle}>Loan Principal Amount ({currencyCode})</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="cash-outline" size={20} color={colors.accent.purple} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={principal}
              onChangeText={setPrincipal}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
            />
          </View>

          {/* Interest Rate */}
          <Text style={styles.inputTitle}>Annual Interest Rate (% p.a.)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="stats-chart-outline" size={20} color={colors.accent.blue} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="decimal-pad"
              placeholder="10.5"
              placeholderTextColor={colors.text.muted}
            />
          </View>

          {/* Tenure */}
          <View style={styles.tenureHeaderRow}>
            <Text style={styles.inputTitle}>Loan Tenure</Text>
            <View style={styles.tenureToggleWrap}>
              <TouchableOpacity
                style={[styles.tenurePill, tenureType === 'years' && styles.tenurePillActive]}
                onPress={() => { setTenureType('years'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={[styles.tenurePillText, tenureType === 'years' && styles.tenurePillTextActive]}>Years</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tenurePill, tenureType === 'months' && styles.tenurePillActive]}
                onPress={() => { setTenureType('months'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={[styles.tenurePillText, tenureType === 'months' && styles.tenurePillTextActive]}>Months</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="calendar-outline" size={20} color={colors.accent.green} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={tenureYears}
              onChangeText={setTenureYears}
              keyboardType="number-pad"
              placeholder="3"
              placeholderTextColor={colors.text.muted}
            />
          </View>

          {/* Optional Lender Name */}
          <Text style={styles.inputTitle}>Lender / Bank Name (Optional)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="business-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={lenderName}
              onChangeText={setLenderName}
              placeholder="e.g. HDFC Bank, Chase, Friend"
              placeholderTextColor={colors.text.muted}
            />
          </View>
        </View>

        {/* Results Summary Card */}
        <View style={styles.resultCard}>
          <View style={styles.emiHighlightBox}>
            <Text style={styles.emiLabel}>MONTHLY EMI</Text>
            <Text style={styles.emiValue}>{formatCurrency(calculation.emi, currencyCode)}</Text>
            <Text style={styles.emiSub}>Per Month for {tenureYears} {tenureType}</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryBoxLabel}>Principal Amount</Text>
              <Text style={styles.summaryBoxValue}>
                {formatCurrency(parseFloat(principal) || 0, currencyCode)}
              </Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryBoxLabel}>Total Interest</Text>
              <Text style={[styles.summaryBoxValue, { color: colors.accent.amber }]}>
                {formatCurrency(calculation.totalInterest, currencyCode)}
              </Text>
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount Payable</Text>
            <Text style={styles.totalValue}>{formatCurrency(calculation.totalPayable, currencyCode)}</Text>
          </View>

          {/* Visual Ratio Bar */}
          <View style={styles.ratioBarWrap}>
            <View style={styles.ratioHeader}>
              <Text style={styles.ratioText}>Principal ({100 - calculation.interestPercent}%)</Text>
              <Text style={[styles.ratioText, { color: colors.accent.amber }]}>Interest ({calculation.interestPercent}%)</Text>
            </View>
            <View style={styles.ratioTrack}>
              <View
                style={[
                  styles.ratioFillPrincipal,
                  { width: `${Math.max(0, 100 - calculation.interestPercent)}%` },
                ]}
              />
              <View
                style={[
                  styles.ratioFillInterest,
                  { width: `${Math.min(100, calculation.interestPercent)}%`, backgroundColor: colors.accent.amber },
                ]}
              />
            </View>
          </View>

          {/* Save to Debt CTA */}
          <TouchableOpacity style={styles.saveDebtBtn} onPress={handleSaveAsDebt} activeOpacity={0.85}>
            <Ionicons name="journal-outline" size={18} color="#FFFFFF" />
            <Text style={styles.saveDebtBtnText}>Log to Debts Tracker</Text>
          </TouchableOpacity>
        </View>

        {/* Amortization Schedule Accordion */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.accordionHeader} onPress={toggleAmortization} activeOpacity={0.8}>
            <View style={styles.accordionTitleRow}>
              <Ionicons name="grid-outline" size={20} color={colors.accent.blue} />
              <Text style={styles.accordionTitle}>AMORTIZATION SCHEDULE</Text>
            </View>
            <Ionicons
              name={showAmortization ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {showAmortization && (
            <View style={styles.scheduleBody}>
              {/* Schedule Mode Switcher */}
              <View style={styles.scheduleSwitcher}>
                <TouchableOpacity
                  style={[styles.schedPill, scheduleMode === 'yearly' && styles.schedPillActive]}
                  onPress={() => { setScheduleMode('yearly'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.schedPillText, scheduleMode === 'yearly' && styles.schedPillTextActive]}>Yearly</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.schedPill, scheduleMode === 'monthly' && styles.schedPillActive]}
                  onPress={() => { setScheduleMode('monthly'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.schedPillText, scheduleMode === 'monthly' && styles.schedPillTextActive]}>Monthly</Text>
                </TouchableOpacity>
              </View>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCol, { flex: 0.8 }]}>{scheduleMode === 'yearly' ? 'Yr' : 'Mo'}</Text>
                <Text style={[styles.tableCol, { flex: 1.2 }]}>Principal</Text>
                <Text style={[styles.tableCol, { flex: 1.2 }]}>Interest</Text>
                <Text style={[styles.tableCol, { flex: 1.4, textAlign: 'right' }]}>Balance</Text>
              </View>

              {/* Table Rows */}
              {(scheduleMode === 'yearly' ? calculation.yearlySchedule : calculation.monthlySchedule).map((row) => (
                <View key={row.period} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.8, fontWeight: '700' }]}>#{row.period}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2, color: colors.text.primary }]}>
                    {formatCurrency(row.principal, currencyCode)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.2, color: colors.accent.amber }]}>
                    {formatCurrency(row.interest, currencyCode)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.4, textAlign: 'right', color: colors.text.secondary }]}>
                    {formatCurrency(row.balance, currencyCode)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
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
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 16,
    },
    card: {
      padding: 18,
      borderRadius: 22,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    cardLabel: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      marginBottom: 14,
    },
    inputTitle: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
      marginTop: 8,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      paddingHorizontal: 12,
      height: 46,
    },
    inputIcon: {
      marginRight: 10,
    },
    textInput: {
      flex: 1,
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '700',
    },
    tenureHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    tenureToggleWrap: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: 10,
      padding: 2,
    },
    tenurePill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    tenurePillActive: {
      backgroundColor: colors.accent.purple,
    },
    tenurePillText: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '600',
    },
    tenurePillTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    resultCard: {
      padding: 20,
      borderRadius: 24,
      backgroundColor: colors.accent.alpha(isDark ? 0.12 : 0.06),
      borderWidth: 1,
      borderColor: colors.accent.alpha(0.25),
      gap: 16,
    },
    emiHighlightBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.accent.alpha(0.18),
    },
    emiLabel: {
      color: colors.accent.purple,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
    },
    emiValue: {
      color: colors.text.primary,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -1,
      marginVertical: 4,
    },
    emiSub: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '500',
    },
    summaryGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    summaryBox: {
      flex: 1,
      padding: 12,
      borderRadius: 14,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    summaryBoxLabel: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '600',
      marginBottom: 4,
    },
    summaryBoxValue: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 4,
    },
    totalLabel: {
      color: colors.text.secondary,
      fontSize: 14,
      fontWeight: '700',
    },
    totalValue: {
      color: colors.text.primary,
      fontSize: 18,
      fontWeight: '800',
    },
    ratioBarWrap: {
      gap: 6,
    },
    ratioHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    ratioText: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '700',
    },
    ratioTrack: {
      height: 8,
      borderRadius: 4,
      flexDirection: 'row',
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    ratioFillPrincipal: {
      height: '100%',
      backgroundColor: colors.accent.purple,
    },
    ratioFillInterest: {
      height: '100%',
    },
    saveDebtBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.accent.purple,
      marginTop: 4,
    },
    saveDebtBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    accordionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    accordionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    accordionTitle: {
      color: colors.text.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    scheduleBody: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    scheduleSwitcher: {
      flexDirection: 'row',
      alignSelf: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: 12,
      padding: 3,
      marginBottom: 14,
    },
    schedPill: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 10,
    },
    schedPillActive: {
      backgroundColor: colors.accent.blue,
    },
    schedPillText: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '600',
    },
    schedPillTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    tableHeader: {
      flexDirection: 'row',
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    tableCol: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '700',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
    },
    tableCell: {
      fontSize: 12,
    },
  });
