import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { AmbientBackground } from '../../components/AmbientBackground';
import { FloatingTopHeader } from '../../components/FloatingTopHeader';
import { useAccounts, BankAccount, ACCOUNT_TYPE_ICONS } from '../../hooks/useAccounts';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency } from '../../utils/dateHelpers';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { BankLogo } from '../../components/banks/BankLogo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AccountsScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { currencyCode } = useCurrency();
  const { accounts, totalLiquidBalance, isLoaded, refresh, transactions } = useAccounts();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.isArchived), [accounts]);

  const monthlyFlow = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const totalInflow = monthTxs
      .filter((t) => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOutflow = monthTxs
      .filter((t) => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = totalInflow - totalOutflow;
    const totalVolume = totalInflow + totalOutflow;
    const inflowPercent = totalVolume > 0 ? Math.round((totalInflow / totalVolume) * 100) : 50;
    const outflowPercent = totalVolume > 0 ? 100 - inflowPercent : 50;
    const monthName = now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    return {
      totalInflow,
      totalOutflow,
      netFlow,
      inflowPercent,
      outflowPercent,
      monthName,
      hasEntries: monthTxs.length > 0,
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 10);
  }, [transactions]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AmbientBackground />

      <FloatingTopHeader
        title="Bank Accounts"
        subtitle="Passbook & Multi-Account Ledger"
        rightActions={
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/modals/add-account-transaction');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-vertical-outline" size={18} color={colors.accent.blue} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.accent.blue }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/modals/add-account');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      {!isLoaded ? (
        <SkeletonLoader variant="debts" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.blue}
            />
          }
        >
          <View style={styles.totalCard}>
            <View style={styles.totalHeader}>
              <View style={styles.totalBadge}>
                <Ionicons name="shield-checkmark-outline" size={12} color={colors.accent.green} />
                <Text style={styles.totalBadgeText}>TOTAL LIQUID RESERVE</Text>
              </View>
              <Text style={styles.accCountText}>{activeAccounts.length} Active Accounts</Text>
            </View>

            <Text
              style={styles.totalBalance}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {formatCurrency(totalLiquidBalance, currencyCode)}
            </Text>

            <View style={styles.quickActionRow}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: '/modals/add-account-transaction',
                    params: { initialType: 'deposit' },
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="arrow-down-outline" size={16} color={colors.accent.green} />
                </View>
                <Text style={styles.quickActionLabel}>+ Money In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: '/modals/add-account-transaction',
                    params: { initialType: 'withdrawal' },
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Ionicons name="arrow-up-outline" size={16} color={colors.accent.red} />
                </View>
                <Text style={styles.quickActionLabel}>- Money Out</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: '/modals/add-account-transaction',
                    params: { initialType: 'transfer' },
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${colors.accent.blue}18` }]}>
                  <Ionicons name="swap-horizontal-outline" size={16} color={colors.accent.blue} />
                </View>
                <Text style={styles.quickActionLabel}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.monthlyFlowCard}>
            <View style={styles.flowCardHeader}>
              <View style={styles.flowCardTitleGroup}>
                <Ionicons name="stats-chart-outline" size={14} color={colors.accent.blue} />
                <Text style={styles.flowCardTitle}>
                  MONTHLY CASH FLOW ({monthlyFlow.monthName.toUpperCase()})
                </Text>
              </View>
              <View
                style={[
                  styles.netPill,
                  {
                    backgroundColor:
                      monthlyFlow.netFlow >= 0
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(239, 68, 68, 0.12)',
                  },
                ]}
              >
                <Ionicons
                  name={monthlyFlow.netFlow >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
                  size={12}
                  color={monthlyFlow.netFlow >= 0 ? colors.accent.green : colors.accent.red}
                />
                <Text
                  style={[
                    styles.netPillText,
                    {
                      color: monthlyFlow.netFlow >= 0 ? colors.accent.green : colors.accent.red,
                    },
                  ]}
                  numberOfLines={1}
                >
                  Net: {monthlyFlow.netFlow >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(monthlyFlow.netFlow), currencyCode)}
                </Text>
              </View>
            </View>

            <View style={styles.flowMetricsRow}>
              <View style={styles.flowMetricCol}>
                <Text style={styles.flowMetricLabel}>Deposits In</Text>
                <Text
                  style={[styles.flowMetricValue, { color: colors.accent.green }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  +{formatCurrency(monthlyFlow.totalInflow, currencyCode)}
                </Text>
              </View>
              <View style={styles.flowDivider} />
              <View style={styles.flowMetricCol}>
                <Text style={styles.flowMetricLabel}>Withdrawals Out</Text>
                <Text
                  style={[styles.flowMetricValue, { color: colors.accent.red }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  -{formatCurrency(monthlyFlow.totalOutflow, currencyCode)}
                </Text>
              </View>
            </View>

            {monthlyFlow.hasEntries ? (
              <View style={styles.flowRatioTrack}>
                <View
                  style={[
                    styles.flowRatioInflow,
                    { flex: Math.max(monthlyFlow.inflowPercent, 5), backgroundColor: colors.accent.green },
                  ]}
                />
                <View style={styles.flowRatioGap} />
                <View
                  style={[
                    styles.flowRatioOutflow,
                    { flex: Math.max(monthlyFlow.outflowPercent, 5), backgroundColor: colors.accent.red },
                  ]}
                />
              </View>
            ) : (
              <View style={styles.flowEmptyTrack}>
                <Text style={styles.flowEmptyText}>No account transactions recorded this month</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>YOUR ACCOUNTS</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/modals/add-account');
              }}
            >
              <Text style={styles.sectionActionText}>+ New Bank</Text>
            </TouchableOpacity>
          </View>

          {activeAccounts.length === 0 ? (
            <View style={styles.emptyAccountCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="business-outline" size={32} color={colors.text.muted} />
              </View>
              <Text style={styles.emptyTitle}>No Bank Accounts Added</Text>
              <Text style={styles.emptySubtitle}>
                Add your bank accounts, savings, and wallets to see live balances and passbook records.
              </Text>
              <TouchableOpacity
                style={styles.addAccountBtn}
                onPress={() => router.push('/modals/add-account')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.addAccountBtnText}>Add Your First Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.accountsDeck}>
              {activeAccounts.map((acc) => {
                const iconName = ACCOUNT_TYPE_ICONS[acc.accountType] || 'business-outline';
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[styles.accountCard, { borderColor: `${acc.color}35` }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: '/modals/account-statement',
                        params: { accountId: acc.id },
                      });
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.accCardTop}>
                      <View style={styles.accCardBrand}>
                        <BankLogo name={acc.name} fallbackColor={acc.color} size={38} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.accCardName} numberOfLines={1}>
                            {acc.name}
                          </Text>
                          <Text style={styles.accCardType} numberOfLines={1}>
                            {acc.accountNumberMasked ? `${acc.accountNumberMasked} · ` : ''}
                            {acc.accountType.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <Ionicons name="chevron-forward" size={18} color={colors.text.muted} style={{ flexShrink: 0 }} />
                    </View>

                    <View style={styles.accCardBottom}>
                      <View style={styles.accBalanceWrap}>
                        <Text style={styles.accBalanceLabel}>Current Balance</Text>
                        <Text
                          style={styles.accBalanceVal}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.55}
                        >
                          {formatCurrency(acc.currentBalance, acc.currency)}
                        </Text>
                      </View>

                      <View style={styles.statementTag}>
                        <Ionicons name="receipt-outline" size={13} color={colors.accent.blue} />
                        <Text style={styles.statementTagText}>Passbook</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {recentTransactions.length > 0 && (
            <View style={styles.timelineSection}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>RECENT PASSBOOK ACTIVITY</Text>
                <Text style={styles.sectionSubCount}>{recentTransactions.length} entries</Text>
              </View>

              {recentTransactions.map((tx) => {
                const acc = accounts.find((a) => a.id === tx.accountId);
                const toAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
                const isDeposit = tx.type === 'deposit';
                const isTransfer = tx.type === 'transfer';

                const txDate = new Date(tx.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                });

                return (
                  <TouchableOpacity
                    key={tx.id}
                    style={styles.txRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: '/modals/add-account-transaction',
                        params: {
                          transactionId: tx.id,
                          initialAccountId: tx.accountId,
                        },
                      });
                    }}
                  >
                    <View
                      style={[
                        styles.txIconWrap,
                        {
                          backgroundColor: isDeposit
                            ? 'rgba(16, 185, 129, 0.12)'
                            : isTransfer
                            ? `${colors.accent.blue}18`
                            : 'rgba(239, 68, 68, 0.12)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          isDeposit
                            ? 'arrow-down-outline'
                            : isTransfer
                            ? 'swap-horizontal-outline'
                            : 'arrow-up-outline'
                        }
                        size={16}
                        color={isDeposit ? colors.accent.green : isTransfer ? colors.accent.blue : colors.accent.red}
                      />
                    </View>

                    <View style={styles.txMeta}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {tx.category}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <BankLogo name={acc?.name} fallbackColor={acc?.color} size={14} />
                        <Text style={styles.txAccountContext} numberOfLines={1}>
                          {acc?.name || 'Account'}
                          {isTransfer && toAcc ? ` → ${toAcc.name}` : ''}
                          {tx.reasonNotes ? ` · ${tx.reasonNotes}` : ''}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.txRight}>
                      <Text
                        style={[
                          styles.txAmountText,
                          { color: isDeposit ? colors.accent.green : isTransfer ? colors.accent.blue : colors.text.primary },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {isDeposit ? '+' : isTransfer ? '⇄ ' : '-'}
                        {formatCurrency(tx.amount, acc?.currency || currencyCode)}
                      </Text>
                      <Text style={styles.txDateText} numberOfLines={1}>{txDate}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 110,
      gap: 16,
    },
    totalCard: {
      backgroundColor: colors.glass.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      gap: 12,
    },
    totalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    totalBadgeText: {
      color: colors.accent.green,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    accCountText: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '600',
    },
    totalBalance: {
      color: colors.text.primary,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    quickActionRow: {
      flexDirection: 'row',
      gap: 8,
      borderTopWidth: 1,
      borderColor: colors.glass.cardBorder,
      paddingTop: 12,
    },
    quickActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
      paddingVertical: 9,
      borderRadius: 12,
    },
    quickActionIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionLabel: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '700',
    },
    monthlyFlowCard: {
      backgroundColor: colors.glass.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      gap: 12,
    },
    flowCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    flowCardTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },
    flowCardTitle: {
      color: colors.text.muted,
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    netPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      flexShrink: 0,
    },
    netPillText: {
      fontSize: 11,
      fontWeight: '700',
    },
    flowMetricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    flowMetricCol: {
      flex: 1,
    },
    flowMetricLabel: {
      color: colors.text.muted,
      fontSize: 10.5,
      fontWeight: '500',
    },
    flowMetricValue: {
      fontSize: 14,
      fontWeight: '800',
      marginTop: 2,
    },
    flowDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.glass.cardBorder,
      marginHorizontal: 12,
    },
    flowRatioTrack: {
      flexDirection: 'row',
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    flowRatioInflow: {
      borderTopLeftRadius: 3,
      borderBottomLeftRadius: 3,
    },
    flowRatioGap: {
      width: 2,
    },
    flowRatioOutflow: {
      borderTopRightRadius: 3,
      borderBottomRightRadius: 3,
    },
    flowEmptyTrack: {
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
    },
    flowEmptyText: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '500',
    },
    sectionTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    sectionTitle: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    sectionActionText: {
      color: colors.accent.blue,
      fontSize: 12,
      fontWeight: '700',
    },
    sectionSubCount: {
      color: colors.text.muted,
      fontSize: 11,
    },
    accountsDeck: {
      gap: 10,
    },
    accountCard: {
      backgroundColor: colors.glass.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      gap: 14,
    },
    accCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    accCardBrand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    accIconBox: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accCardName: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '800',
    },
    accCardType: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },
    accCardBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      borderTopWidth: 1,
      borderColor: colors.glass.cardBorder,
      paddingTop: 10,
    },
    accBalanceWrap: {
      flex: 1,
      minWidth: 0,
      marginRight: 10,
    },
    accBalanceLabel: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '600',
    },
    accBalanceVal: {
      color: colors.text.primary,
      fontSize: 18,
      fontWeight: '800',
      marginTop: 2,
      paddingRight: 2,
    },
    statementTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: `${colors.accent.blue}15`,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      flexShrink: 0,
    },
    statementTagText: {
      color: colors.accent.blue,
      fontSize: 11,
      fontWeight: '700',
    },
    emptyAccountCard: {
      backgroundColor: colors.glass.card,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      gap: 10,
    },
    emptyIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    emptyTitle: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    emptySubtitle: {
      color: colors.text.muted,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 10,
    },
    addAccountBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.accent.blue,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 14,
      marginTop: 6,
    },
    addAccountBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    timelineSection: {
      marginTop: 6,
      gap: 8,
    },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.glass.card,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      gap: 10,
    },
    txIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    txMeta: {
      flex: 1,
      minWidth: 0,
    },
    txTitle: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    txAccountContext: {
      color: colors.text.muted,
      fontSize: 11,
      marginTop: 2,
    },
    txRight: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      flexShrink: 0,
      paddingRight: 2,
      gap: 2,
    },
    txAmountText: {
      fontSize: 13.5,
      fontWeight: '800',
      paddingRight: 3,
      letterSpacing: -0.2,
    },
    txDateText: {
      color: colors.text.muted,
      fontSize: 10,
      paddingRight: 3,
    },
  });
