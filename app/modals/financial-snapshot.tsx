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
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
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

export type CardThemeId =
  | 'emerald'
  | 'obsidian'
  | 'amethyst'
  | 'sunset'
  | 'sapphire'
  | 'titanium';

interface CardThemeConfig {
  id: CardThemeId;
  name: string;
  tagline: string;
  gradient: [string, string, string];
  border: string;
  accent: string;
  accentSub: string;
  glow1: string;
  glow2: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  metricBg: string;
  metricBorder: string;
  previewColor: string;
}

export const CARD_THEMES: Record<CardThemeId, CardThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Luxe',
    tagline: 'Forest & Mint Neon',
    gradient: ['#042622', '#021B18', '#011210'],
    border: '#0D9488',
    accent: '#2DD4BF',
    accentSub: '#10B981',
    glow1: '#10B981',
    glow2: '#14B8A6',
    badgeBg: 'rgba(45, 212, 191, 0.16)',
    badgeText: '#5EEAD4',
    badgeBorder: 'rgba(45, 212, 191, 0.35)',
    metricBg: 'rgba(4, 38, 34, 0.65)',
    metricBorder: 'rgba(45, 212, 191, 0.18)',
    previewColor: '#0D9488',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Neon',
    tagline: 'Midnight Slate & Cyan',
    gradient: ['#0B1120', '#070B14', '#030509'],
    border: '#2563EB',
    accent: '#38BDF8',
    accentSub: '#6366F1',
    glow1: '#38BDF8',
    glow2: '#6366F1',
    badgeBg: 'rgba(56, 189, 248, 0.16)',
    badgeText: '#7DD3FC',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    metricBg: 'rgba(15, 23, 42, 0.75)',
    metricBorder: 'rgba(56, 189, 248, 0.18)',
    previewColor: '#2563EB',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Royal Amethyst',
    tagline: 'Deep Purple & Violet',
    gradient: ['#1A0B2E', '#11061F', '#090212'],
    border: '#9333EA',
    accent: '#C084FC',
    accentSub: '#EC4899',
    glow1: '#A855F7',
    glow2: '#EC4899',
    badgeBg: 'rgba(192, 132, 252, 0.18)',
    badgeText: '#E9D5FF',
    badgeBorder: 'rgba(192, 132, 252, 0.35)',
    metricBg: 'rgba(26, 11, 46, 0.7)',
    metricBorder: 'rgba(192, 132, 252, 0.18)',
    previewColor: '#9333EA',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Crimson',
    tagline: 'Dark Ruby & Amber',
    gradient: ['#230914', '#17050D', '#0C0206'],
    border: '#E11D48',
    accent: '#FB7185',
    accentSub: '#F59E0B',
    glow1: '#F43F5E',
    glow2: '#F59E0B',
    badgeBg: 'rgba(251, 113, 133, 0.16)',
    badgeText: '#FECDD3',
    badgeBorder: 'rgba(251, 113, 133, 0.35)',
    metricBg: 'rgba(35, 9, 20, 0.7)',
    metricBorder: 'rgba(251, 113, 133, 0.18)',
    previewColor: '#E11D48',
  },
  sapphire: {
    id: 'sapphire',
    name: 'Sapphire Azure',
    tagline: 'Deep Abyss & Electric Blue',
    gradient: ['#071938', '#041026', '#020814'],
    border: '#1D4ED8',
    accent: '#60A5FA',
    accentSub: '#38BDF8',
    glow1: '#3B82F6',
    glow2: '#0EA5E9',
    badgeBg: 'rgba(96, 165, 250, 0.16)',
    badgeText: '#BFDBFE',
    badgeBorder: 'rgba(96, 165, 250, 0.35)',
    metricBg: 'rgba(7, 25, 56, 0.7)',
    metricBorder: 'rgba(96, 165, 250, 0.18)',
    previewColor: '#3B82F6',
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium Frost',
    tagline: 'Platinum Silver & Slate',
    gradient: ['#17202A', '#10161E', '#0A0E13'],
    border: '#475569',
    accent: '#E2E8F0',
    accentSub: '#94A3B8',
    glow1: '#94A3B8',
    glow2: '#CBD5E1',
    badgeBg: 'rgba(226, 232, 240, 0.14)',
    badgeText: '#F8FAFC',
    badgeBorder: 'rgba(226, 232, 240, 0.3)',
    metricBg: 'rgba(23, 32, 42, 0.75)',
    metricBorder: 'rgba(226, 232, 240, 0.15)',
    previewColor: '#64748B',
  },
};

export default function FinancialSnapshotModal() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const cardRef = useRef<View>(null);

  const { currencyCode, convertAmount } = useCurrency();
  const { formatCurrency } = useSettings();

  const [privacyMode, setPrivacyMode] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>('emerald');
  const [isSharing, setIsSharing] = useState(false);

  const { debts } = useDebts();
  const { credits } = useCredits();
  const { subscriptions } = useSubscriptions();
  const { getTotalForMonth, entries } = useDailySpending();
  const { getTotalIncomeForMonth, incomes } = useIncome();
  const { budget } = useBudget();

  // Current month key (YYYY-MM)
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Collect all available historical months from local database
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add(currentMonthKey);

    const registerDate = (dateStr?: string | null) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthSet.add(k);
      }
    };

    entries.forEach((e) => registerDate(e.spentAt));
    incomes.forEach((i) => registerDate(i.receivedAt));
    debts.forEach((d) => {
      registerDate(d.takenDate);
      registerDate(d.createdAt);
      if (d.paidDate) registerDate(d.paidDate);
      if (d.payments) {
        d.payments.forEach((p) => registerDate(p.paidDate));
      }
    });
    credits.forEach((c) => {
      registerDate(c.lentDate);
      registerDate(c.createdAt);
      if (c.returnedDate) registerDate(c.returnedDate);
      if (c.payments) {
        c.payments.forEach((p) => registerDate(p.returnedDate));
      }
    });

    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [currentMonthKey, entries, incomes, debts, credits]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);

  const isCurrentMonth = selectedMonthKey === currentMonthKey;

  const selectedDate = useMemo(() => {
    const [y, m] = selectedMonthKey.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }, [selectedMonthKey]);

  const monthYearLabel = useMemo(() => {
    return selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [selectedDate]);

  // Historical / Active filtering for selected month
  const displayDebts = useMemo(() => {
    if (isCurrentMonth) {
      return debts.filter((d) => !d.isPaid);
    }
    const endOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    return debts.filter((d) => {
      const taken = new Date(d.takenDate || d.createdAt);
      if (taken > endOfMonth) return false;
      if (d.isPaid && d.paidDate) {
        const paid = new Date(d.paidDate);
        if (paid <= endOfMonth) return false;
      }
      return true;
    });
  }, [debts, isCurrentMonth, selectedDate]);

  const totalDebt = useMemo(() => {
    return displayDebts.reduce((sum, d) => sum + convertAmount(d.amount, d.currency), 0);
  }, [displayDebts, convertAmount]);

  const displayCredits = useMemo(() => {
    if (isCurrentMonth) {
      return credits.filter((c) => !c.isReturned);
    }
    const endOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    return credits.filter((c) => {
      const lent = new Date(c.lentDate || c.createdAt);
      if (lent > endOfMonth) return false;
      if (c.isReturned && c.returnedDate) {
        const ret = new Date(c.returnedDate);
        if (ret <= endOfMonth) return false;
      }
      return true;
    });
  }, [credits, isCurrentMonth, selectedDate]);

  const totalCredit = useMemo(() => {
    return displayCredits.reduce((sum, c) => sum + convertAmount(c.amount, c.currency), 0);
  }, [displayCredits, convertAmount]);

  const displaySubs = useMemo(() => {
    if (isCurrentMonth) {
      return subscriptions.filter((s) => s.isActive);
    }
    const endOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    return subscriptions.filter((s) => {
      const created = new Date(s.createdAt);
      return created <= endOfMonth && s.isActive;
    });
  }, [subscriptions, isCurrentMonth, selectedDate]);

  const totalSubs = useMemo(() => {
    return displaySubs.reduce((sum, s) => sum + convertAmount(s.amount, s.currency), 0);
  }, [displaySubs, convertAmount]);

  const activeSubsCount = displaySubs.length;

  const monthlySpending = useMemo(
    () => getTotalForMonth(selectedDate, convertAmount),
    [getTotalForMonth, selectedDate, convertAmount]
  );

  const monthlyIncome = useMemo(
    () => getTotalIncomeForMonth(selectedDate, convertAmount),
    [getTotalIncomeForMonth, selectedDate, convertAmount]
  );

  // Cashflow & Savings Rate
  const savingsRate = useMemo(() => {
    if (monthlyIncome <= 0) return 0;
    const net = monthlyIncome - (monthlySpending + totalSubs);
    return Math.round((net / monthlyIncome) * 100);
  }, [monthlyIncome, monthlySpending, totalSubs]);

  // Debt Paid off percentage
  const debtPayoffProgress = useMemo(() => {
    const endOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    const relevantDebts = isCurrentMonth
      ? debts
      : debts.filter((d) => new Date(d.takenDate || d.createdAt) <= endOfMonth);

    const totalOriginalDebt = relevantDebts.reduce(
      (sum, d) => sum + convertAmount(d.amount, d.currency),
      0
    );
    if (totalOriginalDebt <= 0) return 100;
    const paid = totalOriginalDebt - totalDebt;
    return Math.min(100, Math.max(0, Math.round((paid / totalOriginalDebt) * 100)));
  }, [debts, isCurrentMonth, selectedDate, totalDebt, convertAmount]);

  const maskValue = (formatted: string) => {
    if (!privacyMode) return formatted;
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
          dialogTitle: `Financial Snapshot - ${monthYearLabel}`,
          UTI: 'public.png',
        });
      }
    } catch (e) {
      console.error('Failed to share snapshot:', e);
    } finally {
      setIsSharing(false);
    }
  };

  const cardThemeStyles = CARD_THEMES[selectedTheme];
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

        {/* ================= STATEMENT MONTH SELECTOR ================= */}
        <View style={styles.monthSection}>
          <View style={styles.monthHeaderRow}>
            <View style={styles.monthTitleWrapper}>
              <Ionicons name="calendar" size={14} color={colors.accent.blue} />
              <Text style={styles.sectionTitle}>Statement Period</Text>
            </View>
            <View style={styles.monthCountBadge}>
              <Text style={styles.monthCountText}>
                {availableMonths.length} {availableMonths.length === 1 ? 'Month' : 'Months'}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthScrollContent}
            style={styles.monthScroll}
          >
            {availableMonths.map((mKey) => {
              const isSelected = mKey === selectedMonthKey;
              const isCurrent = mKey === currentMonthKey;
              const [yStr, mStr] = mKey.split('-');
              const d = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, 1);
              const label = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

              return (
                <TouchableOpacity
                  key={mKey}
                  style={[
                    styles.monthPill,
                    isSelected && styles.monthPillSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMonthKey(mKey);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : isCurrent ? 'time-outline' : 'calendar-outline'}
                    size={13}
                    color={isSelected ? '#FFFFFF' : isCurrent ? colors.accent.blue : colors.text.tertiary}
                  />
                  <Text
                    style={[
                      styles.monthPillText,
                      isSelected && styles.monthPillTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                  {isCurrent && (
                    <View style={[styles.nowBadge, isSelected && styles.nowBadgeSelected]}>
                      <Text style={[styles.nowBadgeText, isSelected && styles.nowBadgeTextSelected]}>
                        Now
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ================= SNAPSHOT CARD VIEW ================= */}
        <View style={styles.cardWrapper}>
          <View ref={cardRef} collapsable={false} style={styles.captureContainer}>
            <LinearGradient
              colors={cardThemeStyles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.snapshotCard}
            >
              {/* Ambient Glowing Orbs */}
              <View
                style={[
                  styles.cardCornerFlare,
                  { backgroundColor: cardThemeStyles.glow1 },
                ]}
              />
              <View
                style={[
                  styles.cardBottomFlare,
                  { backgroundColor: cardThemeStyles.glow2 },
                ]}
              />

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

                <View
                  style={[
                    styles.dateBadge,
                    {
                      backgroundColor: cardThemeStyles.badgeBg,
                      borderColor: cardThemeStyles.badgeBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={11}
                    color={cardThemeStyles.badgeText}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.dateBadgeText,
                      { color: cardThemeStyles.badgeText },
                    ]}
                  >
                    {monthYearLabel}
                  </Text>
                </View>
              </View>

              {/* Primary Metrics Grid */}
              <View style={styles.metricsGrid}>
                {/* Metric 1: Subscriptions */}
                <View
                  style={[
                    styles.metricBox,
                    {
                      backgroundColor: cardThemeStyles.metricBg,
                      borderColor: cardThemeStyles.metricBorder,
                    },
                  ]}
                >
                  <View style={styles.metricHeaderRow}>
                    <Ionicons name="card-outline" size={15} color={cardThemeStyles.accent} />
                    <Text style={styles.metricLabel}>Subscriptions</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {maskValue(formatCurrency(totalSubs, currencyCode))}
                  </Text>
                  <Text style={styles.metricSub}>{activeSubsCount} active services</Text>
                </View>

                {/* Metric 2: Net Debt */}
                <View
                  style={[
                    styles.metricBox,
                    {
                      backgroundColor: cardThemeStyles.metricBg,
                      borderColor: cardThemeStyles.metricBorder,
                    },
                  ]}
                >
                  <View style={styles.metricHeaderRow}>
                    <Ionicons name="trending-down-outline" size={15} color="#EF4444" />
                    <Text style={styles.metricLabel}>Pending Debt</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {maskValue(formatCurrency(totalDebt, currencyCode))}
                  </Text>
                  <Text style={styles.metricSub}>{displayDebts.length} active liabilities</Text>
                </View>

                {/* Metric 3: Credits Owed */}
                <View
                  style={[
                    styles.metricBox,
                    {
                      backgroundColor: cardThemeStyles.metricBg,
                      borderColor: cardThemeStyles.metricBorder,
                    },
                  ]}
                >
                  <View style={styles.metricHeaderRow}>
                    <Ionicons name="trending-up-outline" size={15} color="#10B981" />
                    <Text style={styles.metricLabel}>Owed to You</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {maskValue(formatCurrency(totalCredit, currencyCode))}
                  </Text>
                  <Text style={styles.metricSub}>{displayCredits.length} claims</Text>
                </View>

                {/* Metric 4: Monthly Spend */}
                <View
                  style={[
                    styles.metricBox,
                    {
                      backgroundColor: cardThemeStyles.metricBg,
                      borderColor: cardThemeStyles.metricBorder,
                    },
                  ]}
                >
                  <View style={styles.metricHeaderRow}>
                    <Ionicons name="wallet-outline" size={15} color="#F59E0B" />
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
                  <Text style={[styles.highlightVal, { color: cardThemeStyles.accent }]}>
                    {debtPayoffProgress}% Cleared
                  </Text>
                </View>
                <View style={styles.highlightDivider} />
                <View style={styles.highlightCol}>
                  <Text style={styles.highlightLabel}>Net Savings Rate</Text>
                  <Text style={[styles.highlightVal, { color: cardThemeStyles.accent }]}>
                    {monthlyIncome > 0
                      ? savingsRate >= 0
                        ? `+${savingsRate}% Saved`
                        : `${savingsRate}% Deficit`
                      : monthlySpending > 0
                      ? 'Discretionary'
                      : 'Zero Net'}
                  </Text>
                </View>
              </View>

              {/* Footer: Clean Verified Bar (No "Consistency | Faith | Discipline") */}
              <View style={styles.cardFooter}>
                <View style={styles.footerVerified}>
                  <Ionicons name="shield-checkmark" size={12} color={cardThemeStyles.accent} />
                  <Text style={[styles.footerVerifiedText, { color: cardThemeStyles.accent }]}>
                    Verified Financial Snapshot
                  </Text>
                </View>
                <View style={styles.footerBrand}>
                  <Ionicons name="sparkles" size={10} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.watermark}>Built with SubDebt</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* ================= THEME PICKER ================= */}
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.sectionTitle}>Card Visual Theme</Text>
        </View>
        <View style={styles.themeGrid}>
          {(Object.keys(CARD_THEMES) as CardThemeId[]).map((themeKey) => {
            const theme = CARD_THEMES[themeKey];
            const isSelected = selectedTheme === themeKey;
            return (
              <TouchableOpacity
                key={themeKey}
                style={[
                  styles.themeChip,
                  isSelected && [styles.themeChipSelected, { borderColor: theme.accent }],
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTheme(themeKey);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.themeDot, { backgroundColor: theme.previewColor }]} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.themeChipText,
                    isSelected && styles.themeChipTextActive,
                  ]}
                >
                  {theme.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: cardThemeStyles.border }]}
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

const getStyles = (colors: any, isDark: boolean, theme: CardThemeConfig) =>
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
      marginBottom: 14,
    },
    monthSection: {
      marginBottom: 16,
    },
    monthHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    monthTitleWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    monthCountBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    },
    monthCountText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    monthScroll: {
      marginHorizontal: -20,
    },
    monthScrollContent: {
      paddingHorizontal: 20,
      gap: 8,
    },
    monthPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    monthPillSelected: {
      backgroundColor: colors.accent.blue,
      borderColor: colors.accent.blue,
    },
    monthPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    monthPillTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    nowBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(79, 195, 247, 0.2)' : '#E0F2FE',
    },
    nowBadgeSelected: {
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    nowBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.accent.blue,
      textTransform: 'uppercase',
    },
    nowBadgeTextSelected: {
      color: '#FFFFFF',
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
    captureContainer: {
      borderRadius: 24,
      overflow: 'hidden',
    },
    snapshotCard: {
      borderRadius: 24,
      padding: 22,
      borderWidth: 1.5,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    cardCornerFlare: {
      position: 'absolute',
      top: -45,
      right: -45,
      width: 160,
      height: 160,
      borderRadius: 80,
      opacity: 0.22,
    },
    cardBottomFlare: {
      position: 'absolute',
      bottom: -45,
      left: -45,
      width: 140,
      height: 140,
      borderRadius: 70,
      opacity: 0.16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
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
      color: 'rgba(255,255,255,0.65)',
      marginTop: 1,
    },
    dateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 11,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
    },
    dateBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    metricBox: {
      width: '48%',
      borderRadius: 16,
      padding: 13,
      borderWidth: 1,
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
      color: 'rgba(255,255,255,0.72)',
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
      color: 'rgba(255,255,255,0.48)',
    },
    highlightBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      marginBottom: 16,
    },
    highlightCol: {
      alignItems: 'center',
    },
    highlightLabel: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.52)',
      marginBottom: 2,
    },
    highlightVal: {
      fontSize: 14,
      fontWeight: '800',
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
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.08)',
    },
    footerVerified: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    footerVerifiedText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    footerBrand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    watermark: {
      fontSize: 10,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.5)',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 24,
    },
    themeChip: {
      width: '48.5%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    themeChipSelected: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
    },
    themeDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    themeChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
      flex: 1,
    },
    themeChipTextActive: {
      color: colors.text.primary,
      fontWeight: '700',
    },
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 15,
      borderRadius: 16,
      shadowColor: '#000000',
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
