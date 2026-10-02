import { useTheme } from '../../hooks/useTheme';
import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';

import { useDebts } from '../../hooks/useDebts';
import { useCredits } from '../../hooks/useCredits';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { useDailySpending } from '../../hooks/useDailySpending';
import { useIncome } from '../../hooks/useIncome';
import { useCurrency } from '../../hooks/useCurrency';
import { useBudget } from '../../hooks/useBudget';
import { useSettings } from '../../context/SettingsContext';

type CardTheme = 'obsidian' | 'emerald' | 'sapphire';

export default function FinancialSnapshotModal() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const cardRef = useRef<View>(null);

  const { currencyCode, convertAmount } = useCurrency();
  const { formatCurrency } = useSettings();

  const [privacyMode, setPrivacyMode] = useState(true); // Default to true for user privacy safety
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('emerald');
  const [isSharing, setIsSharing] = useState(false);

  const { getTotalPendingAmount: getDebtTotal, debts } = useDebts();
  const { getTotalPendingAmount: getCreditTotal, credits } = useCredits();
  const { getTotalAmount: getSubTotal, subscriptions } = useSubscriptions();
  const { getTotalForMonth } = useDailySpending();
  const { getTotalIncomeForMonth } = useIncome();
  const { budget } = useBudget();

  const totalDebt = useMemo(() => getDebtTotal(), [getDebtTotal]);
  const totalCredit = useMemo(() => getCreditTotal(), [getCreditTotal]);
  const totalSubs = useMemo(() => getSubTotal(), [getSubTotal]);
  const activeSubsCount = useMemo(
    () => subscriptions.filter((s) => s.isActive).length,
    [subscriptions]
  );
  const monthlySpending = useMemo(() => getTotalForMonth(new Date()), [getTotalForMonth]);
  const monthlyIncome = useMemo(() => getTotalIncomeForMonth(new Date()), [getTotalIncomeForMonth]);

  // Cashflow & Savings Rate
  const savingsRate = useMemo(() => {
    if (monthlyIncome <= 0) return 0;
    const net = monthlyIncome - (monthlySpending + totalSubs);
    return Math.round((net / monthlyIncome) * 100);
  }, [monthlyIncome, monthlySpending, totalSubs]);

  // Debt Paid off percentage
  const debtPayoffProgress = useMemo(() => {
    const totalOriginalDebt = debts.reduce(
      (sum, d) => sum + convertAmount(d.amount, d.currency),
      0
    );
    if (totalOriginalDebt <= 0) return 100;
    const paid = totalOriginalDebt - totalDebt;
    return Math.min(100, Math.max(0, Math.round((paid / totalOriginalDebt) * 100)));
  }, [debts, totalDebt, convertAmount]);

  const monthYearLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, []);

  const maskValue = (formatted: string) => {
    if (!privacyMode) return formatted;
    // Keep currency symbol if possible, mask digits
    const match = formatted.match(/^([^\d\s]+)/);
    const prefix = match ? match[1] + ' ' : '';
    return `${prefix}••••••`;
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSharing(true);

    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Financial Snapshot',
          UTI: 'public.png',
        });
      }
    } catch (e) {
      console.error('Failed to share snapshot:', e);
    } finally {
      setIsSharing(false);
    }
  };

  // Card theme colors
  const cardThemeStyles = {
    emerald: {
      bg: '#042723',
      border: '#0D9488',
      accent: '#2DD4BF',
      glow: '#10B981',
      badgeBg: 'rgba(45, 212, 191, 0.15)',
      badgeText: '#5EEAD4',
    },
    obsidian: {
      bg: '#0F172A',
      border: '#334155',
      accent: '#38BDF8',
      glow: '#6366F1',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      badgeText: '#7DD3FC',
    },
    sapphire: {
      bg: '#08183A',
      border: '#1E40AF',
      accent: '#60A5FA',
      glow: '#3B82F6',
      badgeBg: 'rgba(96, 165, 250, 0.15)',
      badgeText: '#93C5FD',
    },
  }[selectedTheme];

  const styles = getStyles(colors, isDark, cardThemeStyles);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Financial Snapshot</Text>
        <TouchableOpacity
          style={[styles.privacyBtn, privacyMode && styles.privacyBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPrivacyMode(!privacyMode);
          }}
        >
          <Ionicons
            name={privacyMode ? 'eye-off' : 'eye'}
            size={18}
            color={privacyMode ? '#10B981' : colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageSubtitle}>
          {privacyMode
            ? 'Privacy Mode is ON. Balances are masked for social sharing.'
            : 'Privacy Mode is OFF. Raw values are visible.'}
        </Text>

        {/* ================= SNAPSHOT CARD VIEW ================= */}
        <View style={styles.cardWrapper}>
          <View ref={cardRef} style={styles.snapshotCard} collapsable={false}>
            {/* Ambient Corner Flare */}
            <View style={styles.cardCornerFlare} />

            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.brandRow}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={styles.brandName}>SubDebt</Text>
                  <Text style={styles.cardSubtitle}>Financial Overview</Text>
                </View>
              </View>

              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeText}>{monthYearLabel}</Text>
              </View>
            </View>

            {/* Primary Metrics Grid */}
            <View style={styles.metricsGrid}>
              {/* Metric 1: Subscriptions */}
              <View style={styles.metricBox}>
                <View style={styles.metricHeaderRow}>
                  <Ionicons name="card-outline" size={16} color={cardThemeStyles.accent} />
                  <Text style={styles.metricLabel}>Subscriptions</Text>
                </View>
                <Text style={styles.metricValue}>
                  {maskValue(formatCurrency(totalSubs, currencyCode))}
                </Text>
                <Text style={styles.metricSub}>{activeSubsCount} active services</Text>
              </View>

              {/* Metric 2: Net Debt */}
              <View style={styles.metricBox}>
                <View style={styles.metricHeaderRow}>
                  <Ionicons name="trending-down-outline" size={16} color="#EF4444" />
                  <Text style={styles.metricLabel}>Pending Debt</Text>
                </View>
                <Text style={styles.metricValue}>
                  {maskValue(formatCurrency(totalDebt, currencyCode))}
                </Text>
                <Text style={styles.metricSub}>{debts.length} active liabilities</Text>
              </View>

              {/* Metric 3: Credits Owed to You */}
              <View style={styles.metricBox}>
                <View style={styles.metricHeaderRow}>
                  <Ionicons name="trending-up-outline" size={16} color="#10B981" />
                  <Text style={styles.metricLabel}>Owed to You</Text>
                </View>
                <Text style={styles.metricValue}>
                  {maskValue(formatCurrency(totalCredit, currencyCode))}
                </Text>
                <Text style={styles.metricSub}>{credits.length} friends & claims</Text>
              </View>

              {/* Metric 4: Monthly Spending */}
              <View style={styles.metricBox}>
                <View style={styles.metricHeaderRow}>
                  <Ionicons name="wallet-outline" size={16} color="#F59E0B" />
                  <Text style={styles.metricLabel}>Monthly Spend</Text>
                </View>
                <Text style={styles.metricValue}>
                  {maskValue(formatCurrency(monthlySpending, currencyCode))}
                </Text>
                <Text style={styles.metricSub}>
                  {budget?.amount
                    ? `${Math.round((monthlySpending / budget.amount) * 100)}% of limit`
                    : 'Discretionary'}
                </Text>
              </View>
            </View>

            {/* Highlights Banner */}
            <View style={styles.highlightBanner}>
              <View style={styles.highlightCol}>
                <Text style={styles.highlightLabel}>Debt Payoff Progress</Text>
                <Text style={styles.highlightVal}>{debtPayoffProgress}% Cleared</Text>
              </View>
              <View style={styles.highlightDivider} />
              <View style={styles.highlightCol}>
                <Text style={styles.highlightLabel}>Net Savings Rate</Text>
                <Text style={styles.highlightVal}>
                  {savingsRate > 0 ? `+${savingsRate}% Rate` : 'Balanced'}
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.footerNote}>Consistency | Faith | Discipline</Text>
              <Text style={styles.watermark}>Built with SubDebt</Text>
            </View>
          </View>
        </View>

        {/* Theme Picker */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Card Theme</Text>
        </View>
        <View style={styles.themeRow}>
          {(['emerald', 'obsidian', 'sapphire'] as CardTheme[]).map((theme) => {
            const isSelected = selectedTheme === theme;
            const previewColor =
              theme === 'emerald' ? '#0D9488' : theme === 'obsidian' ? '#334155' : '#1E40AF';
            return (
              <TouchableOpacity
                key={theme}
                style={[styles.themeChip, isSelected && styles.themeChipSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTheme(theme);
                }}
              >
                <View style={[styles.themeDot, { backgroundColor: previewColor }]} />
                <Text style={[styles.themeChipText, isSelected && styles.themeChipTextActive]}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          disabled={isSharing}
          activeOpacity={0.8}
        >
          {isSharing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="share-social" size={18} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share Snapshot Image</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean, theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    closeBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    topBarTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text.primary,
    },
    privacyBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    privacyBtnActive: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    pageSubtitle: {
      fontSize: 12,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    cardWrapper: {
      borderRadius: 24,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 8,
      marginBottom: 20,
    },
    snapshotCard: {
      backgroundColor: theme.bg,
      borderRadius: 24,
      padding: 22,
      borderWidth: 1.5,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    cardCornerFlare: {
      position: 'absolute',
      top: -30,
      right: -30,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.glow,
      opacity: 0.18,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    brandLogo: {
      width: 44,
      height: 44,
      borderRadius: 12,
    },
    brandName: {
      fontSize: 20,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    cardSubtitle: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.6)',
      marginTop: 1,
    },
    dateBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: theme.badgeBg,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    dateBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.badgeText,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    metricBox: {
      width: '48%',
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    metricHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.7)',
    },
    metricValue: {
      fontSize: 17,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.2,
      marginBottom: 4,
    },
    metricSub: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.45)',
    },
    highlightBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
      marginBottom: 16,
    },
    highlightCol: {
      alignItems: 'center',
    },
    highlightLabel: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.5)',
      marginBottom: 2,
    },
    highlightVal: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.accent,
    },
    highlightDivider: {
      width: 1,
      height: 24,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.06)',
    },
    footerNote: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.4)',
      fontStyle: 'italic',
    },
    watermark: {
      fontSize: 10,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.6)',
    },
    sectionHeader: {
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    themeRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 24,
    },
    themeChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    themeChipSelected: {
      borderColor: colors.accent.blue,
      backgroundColor: isDark ? 'rgba(79, 195, 247, 0.12)' : '#E0F2FE',
    },
    themeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    themeChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    themeChipTextActive: {
      color: colors.text.primary,
      fontWeight: '700',
    },
    shareButton: {
      backgroundColor: '#0D9488',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 15,
      borderRadius: 16,
      shadowColor: '#0D9488',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 4,
    },
    shareButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
