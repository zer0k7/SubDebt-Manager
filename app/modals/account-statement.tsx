import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAccounts, AccountTxType } from '../../hooks/useAccounts';
import { formatCurrency } from '../../utils/dateHelpers';
import { exportAccountStatementToPDF } from '../../utils/accountStatementExporter';
import { exportAccountPassbookToCSV } from '../../utils/csvExporter';
import { AppPopup } from '../../components/AppPopup';
import { BankLogo } from '../../components/banks/BankLogo';

export default function AccountStatementModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const { accounts, getAccountTransactions, deleteTransaction, deleteAccount } = useAccounts();

  const [filterType, setFilterType] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'month' | 'last_month' | '90d'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [showDeleteAccountPopup, setShowDeleteAccountPopup] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  const account = useMemo(() => accounts.find((a) => a.id === accountId), [accounts, accountId]);
  const allTxs = useMemo(() => (accountId ? getAccountTransactions(accountId) : []), [getAccountTransactions, accountId]);

  const filteredTxs = useMemo(() => {
    let list = allTxs;
    if (filterType !== 'all') {
      list = list.filter((t) => t.type === filterType);
    }
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const curYear = now.getFullYear();
      const curMonth = now.getMonth();

      if (dateRangeFilter === 'month') {
        list = list.filter((t) => {
          const d = new Date(t.date);
          return d.getFullYear() === curYear && d.getMonth() === curMonth;
        });
      } else if (dateRangeFilter === 'last_month') {
        const lastMonthYear = curMonth === 0 ? curYear - 1 : curYear;
        const lastMonth = curMonth === 0 ? 11 : curMonth - 1;
        list = list.filter((t) => {
          const d = new Date(t.date);
          return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
        });
      } else if (dateRangeFilter === '90d') {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        list = list.filter((t) => new Date(t.date) >= ninetyDaysAgo);
      }
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const matchCat = t.category?.toLowerCase().includes(q);
        const matchReason = t.reasonNotes?.toLowerCase().includes(q);
        const matchAmt = t.amount.toString().includes(q);
        let matchTransfer = false;
        if (t.type === 'transfer') {
          const fromAcc = accounts.find((a) => a.id === t.accountId);
          const toAcc = accounts.find((a) => a.id === t.toAccountId);
          matchTransfer =
            (fromAcc && fromAcc.name.toLowerCase().includes(q)) ||
            (toAcc && toAcc.name.toLowerCase().includes(q)) ||
            false;
        }
        return matchCat || matchReason || matchAmt || matchTransfer;
      });
    }
    return list;
  }, [allTxs, filterType, dateRangeFilter, searchQuery, accounts]);

  const monthlyCashFlow = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentMonthTxs = allTxs.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const inflow = currentMonthTxs
      .filter((t) => t.type === 'deposit' || (t.type === 'transfer' && t.toAccountId === accountId))
      .reduce((sum, t) => sum + t.amount, 0);

    const outflow = currentMonthTxs
      .filter((t) => t.type === 'withdrawal' || (t.type === 'transfer' && t.accountId === accountId))
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = inflow - outflow;
    const totalVol = inflow + outflow;
    const inflowPercent = totalVol > 0 ? Math.round((inflow / totalVol) * 100) : 50;
    const outflowPercent = totalVol > 0 ? 100 - inflowPercent : 50;
    const monthLabel = now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    return {
      inflow,
      outflow,
      netFlow,
      inflowPercent,
      outflowPercent,
      monthLabel,
      hasEntries: currentMonthTxs.length > 0,
    };
  }, [allTxs, accountId]);

  const stats = useMemo(() => {
    const totalDeposits = allTxs
      .filter((t) => t.type === 'deposit' || (t.type === 'transfer' && t.toAccountId === accountId))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = allTxs
      .filter((t) => t.type === 'withdrawal' || (t.type === 'transfer' && t.accountId === accountId))
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalDeposits, totalWithdrawals };
  }, [allTxs, accountId]);

  if (!account) {
    return (
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.notFoundText}>Account not found</Text>
          <TouchableOpacity style={styles.closeFullBtn} onPress={() => router.back()}>
            <Text style={styles.closeFullBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleExportPDF = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);
    try {
      await exportAccountStatementToPDF({
        account,
        transactions: filteredTxs,
        pdfTheme: isDark ? 'dark' : 'light',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExportingCSV(true);
    try {
      await exportAccountPassbookToCSV(account, filteredTxs, accounts);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteTxId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await deleteTransaction(deleteTxId);
      setDeleteTxId(null);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await deleteAccount(account.id);
    setShowDeleteAccountPopup(false);
    router.back();
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => router.back()} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BankLogo name={account.name} fallbackColor={account.color} size={42} />
            <View style={{ flex: 1 }}>
              <Text style={styles.accName} numberOfLines={1}>
                {account.name}
              </Text>
              <Text style={styles.accSub} numberOfLines={1}>
                {account.accountNumberMasked ? `${account.accountNumberMasked} · ` : ''}
                {account.accountType.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/modals/add-account',
                  params: { accountId: account.id },
                });
              }}
            >
              <Ionicons name="pencil-outline" size={17} color={colors.accent.blue} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={handleExportPDF}
              disabled={isExporting}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="document-text-outline" size={17} color={colors.accent.blue} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={handleExportCSV}
              disabled={isExportingCSV}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="grid-outline" size={16} color={colors.accent.purple} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => setShowDeleteAccountPopup(true)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.accent.red} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.heroCard, { borderColor: `${account.color}30` }]}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
              <Text style={styles.heroLabel} numberOfLines={1}>CURRENT LIVE BALANCE</Text>
              <Text
                style={styles.heroBalance}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.55}
              >
                {formatCurrency(account.currentBalance, account.currency)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.quickAddTxBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/modals/add-account-transaction',
                  params: { initialAccountId: account.id },
                });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.quickAddTxText}>Entry</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Total Deposits</Text>
              <Text
                style={[styles.statBoxVal, { color: colors.accent.green }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                +{formatCurrency(stats.totalDeposits, account.currency)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Total Withdrawals</Text>
              <Text
                style={[styles.statBoxVal, { color: colors.accent.red }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                -{formatCurrency(stats.totalWithdrawals, account.currency)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cashFlowCard}>
          <View style={styles.cashFlowHeader}>
            <View style={styles.cashFlowTitleGroup}>
              <Ionicons name="bar-chart-outline" size={14} color={colors.accent.blue} />
              <Text style={styles.cashFlowSectionTitle} numberOfLines={1}>
                CASH FLOW ({monthlyCashFlow.monthLabel.toUpperCase()})
              </Text>
            </View>
            <View
              style={[
                styles.netBadge,
                {
                  backgroundColor:
                    monthlyCashFlow.netFlow >= 0
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(239, 68, 68, 0.12)',
                },
              ]}
            >
              <Ionicons
                name={monthlyCashFlow.netFlow >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
                size={12}
                color={monthlyCashFlow.netFlow >= 0 ? colors.accent.green : colors.accent.red}
              />
              <Text
                style={[
                  styles.netBadgeText,
                  {
                    color: monthlyCashFlow.netFlow >= 0 ? colors.accent.green : colors.accent.red,
                  },
                ]}
                numberOfLines={1}
              >
                Net: {monthlyCashFlow.netFlow >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(monthlyCashFlow.netFlow), account.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.cashFlowMetricsRow}>
            <View style={styles.cashFlowMetric}>
              <Text style={styles.cashFlowMetricLabel}>Inflow (In)</Text>
              <Text
                style={[styles.cashFlowMetricVal, { color: colors.accent.green }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                +{formatCurrency(monthlyCashFlow.inflow, account.currency)}
              </Text>
            </View>
            <View style={styles.cashFlowMetricDivider} />
            <View style={styles.cashFlowMetric}>
              <Text style={styles.cashFlowMetricLabel}>Outflow (Out)</Text>
              <Text
                style={[styles.cashFlowMetricVal, { color: colors.accent.red }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                -{formatCurrency(monthlyCashFlow.outflow, account.currency)}
              </Text>
            </View>
          </View>

          {monthlyCashFlow.hasEntries ? (
            <View style={styles.ratioBarContainer}>
              <View
                style={[
                  styles.ratioBarInflow,
                  { flex: Math.max(monthlyCashFlow.inflowPercent, 5), backgroundColor: colors.accent.green },
                ]}
              />
              <View style={styles.ratioBarSpacer} />
              <View
                style={[
                  styles.ratioBarOutflow,
                  { flex: Math.max(monthlyCashFlow.outflowPercent, 5), backgroundColor: colors.accent.red },
                ]}
              />
            </View>
          ) : (
            <View style={styles.ratioBarEmpty}>
              <Text style={styles.ratioBarEmptyText}>No transactions this month</Text>
            </View>
          )}
        </View>

        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={16} color={colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search category, notes, amount..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dateFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {[
              { key: 'all', label: 'All Dates' },
              { key: 'month', label: 'This Month' },
              { key: 'last_month', label: 'Last Month' },
              { key: '90d', label: 'Last 90 Days' },
            ].map((d) => {
              const isSelected = dateRangeFilter === d.key;
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.dateFilterPill, isSelected && styles.dateFilterPillSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDateRangeFilter(d.key as any);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateFilterPillText, isSelected && styles.dateFilterPillTextSelected]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {[
              { key: 'all', label: 'All History' },
              { key: 'deposit', label: 'Deposits In' },
              { key: 'withdrawal', label: 'Withdrawals Out' },
              { key: 'transfer', label: 'Transfers' },
            ].map((f) => {
              const isSelected = filterType === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterType(f.key);
                  }}
                >
                  <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.resultsBadge}>
            <Text style={styles.resultsBadgeText}>
              {filteredTxs.length} {filteredTxs.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>
        </View>

        <FlatList
          data={filteredTxs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons
                name={searchQuery ? 'search-outline' : 'reader-outline'}
                size={36}
                color={colors.text.muted}
              />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching transactions' : 'No transactions recorded'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No entry matches "${searchQuery}"`
                  : 'Log money in, money out, or bank transfers'}
              </Text>
              {searchQuery ? (
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchBtnText}>Clear Search</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const isDeposit = item.type === 'deposit';
            const isTransferIn = item.type === 'transfer' && item.toAccountId === account.id;
            const fromAccount = isTransferIn ? accounts.find((a) => a.id === item.accountId) : null;
            const toAccount =
              item.type === 'transfer' && item.accountId === account.id && item.toAccountId
                ? accounts.find((a) => a.id === item.toAccountId)
                : null;

            const runningBalance = isTransferIn
              ? (item.toAccountBalanceAfter ?? item.balanceAfter)
              : item.balanceAfter;

            const txDate = new Date(item.date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            const displayTitle = isTransferIn
              ? `Transfer from ${fromAccount?.name || 'Account'}`
              : item.type === 'transfer' && toAccount
              ? `Transfer to ${toAccount.name}`
              : item.category;

            return (
              <View style={styles.txItem}>
                <View
                  style={[
                    styles.txIconBox,
                    {
                      backgroundColor:
                        isDeposit || isTransferIn
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      isDeposit
                        ? 'arrow-down-outline'
                        : isTransferIn
                        ? 'swap-horizontal-outline'
                        : item.type === 'transfer'
                        ? 'swap-horizontal-outline'
                        : 'arrow-up-outline'
                    }
                    size={16}
                    color={isDeposit || isTransferIn ? colors.accent.green : colors.accent.red}
                  />
                </View>

                <View style={styles.txInfo}>
                  <Text style={styles.txCat} numberOfLines={1}>
                    {displayTitle}
                  </Text>
                  {item.reasonNotes ? (
                    <Text style={styles.txReason} numberOfLines={1}>
                      {item.reasonNotes}
                    </Text>
                  ) : null}
                  <Text style={styles.txMeta}>
                    {txDate} · Balance: {formatCurrency(runningBalance, account.currency)}
                  </Text>
                </View>

                <View style={styles.txRight}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isDeposit || isTransferIn ? colors.accent.green : colors.accent.red },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {isDeposit || isTransferIn ? '+' : '-'}
                    {formatCurrency(item.amount, account.currency)}
                  </Text>

                  <View style={styles.txRowActions}>
                    <TouchableOpacity
                      style={styles.txActionBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push({
                          pathname: '/modals/add-account-transaction',
                          params: {
                            transactionId: item.id,
                            initialAccountId: item.accountId,
                          },
                        });
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="pencil-outline" size={14} color={colors.accent.blue} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.txActionBtn}
                      onPress={() => setDeleteTxId(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.accent.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>

      <AppPopup
        visible={!!deleteTxId}
        title="Delete Transaction"
        message="Are you sure you want to delete this passbook entry? Account balance will be restored accordingly."
        icon="trash-outline"
        iconColor={colors.accent.red}
        cancelText="Cancel"
        confirmText="Delete"
        isDestructive={true}
        onCancel={() => setDeleteTxId(null)}
        onConfirm={handleDeleteConfirm}
      />

      <AppPopup
        visible={showDeleteAccountPopup}
        title="Delete Bank Account"
        message="Permanently remove this account and all its transaction history from your device?"
        icon="trash-outline"
        iconColor={colors.accent.red}
        cancelText="Cancel"
        confirmText="Delete Account"
        isDestructive={true}
        onCancel={() => setShowDeleteAccountPopup(false)}
        onConfirm={handleDeleteAccountConfirm}
      />
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      backgroundColor: colors.background.primary,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 16,
      paddingTop: 12,
      maxHeight: '92%',
      height: '92%',
      borderTopWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.16)',
      alignSelf: 'center',
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },
    accColorBadge: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accName: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '800',
    },
    accSub: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '600',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    actionIconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroCard: {
      backgroundColor: colors.glass.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      marginBottom: 12,
      gap: 12,
    },
    heroRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroLabel: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    heroBalance: {
      color: colors.text.primary,
      fontSize: 26,
      fontWeight: '800',
      marginTop: 2,
      paddingRight: 2,
    },
    quickAddTxBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accent.blue,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      flexShrink: 0,
    },
    quickAddTxText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    statsRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderColor: colors.glass.cardBorder,
      paddingTop: 10,
    },
    statBox: {
      flex: 1,
    },
    statBoxLabel: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '600',
    },
    statBoxVal: {
      fontSize: 13,
      fontWeight: '700',
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.glass.cardBorder,
      marginHorizontal: 10,
    },
    cashFlowCard: {
      backgroundColor: colors.glass.card,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      marginBottom: 10,
      gap: 8,
    },
    cashFlowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cashFlowTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },
    cashFlowSectionTitle: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    netBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      flexShrink: 0,
    },
    netBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
    },
    cashFlowMetricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cashFlowMetric: {
      flex: 1,
    },
    cashFlowMetricLabel: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '500',
    },
    cashFlowMetricVal: {
      fontSize: 12.5,
      fontWeight: '700',
      marginTop: 1,
    },
    cashFlowMetricDivider: {
      width: 1,
      height: 20,
      backgroundColor: colors.glass.cardBorder,
      marginHorizontal: 8,
    },
    ratioBarContainer: {
      flexDirection: 'row',
      height: 5,
      borderRadius: 3,
      overflow: 'hidden',
      marginTop: 2,
    },
    ratioBarInflow: {
      borderTopLeftRadius: 3,
      borderBottomLeftRadius: 3,
    },
    ratioBarSpacer: {
      width: 2,
    },
    ratioBarOutflow: {
      borderTopRightRadius: 3,
      borderBottomRightRadius: 3,
    },
    ratioBarEmpty: {
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
    },
    ratioBarEmptyText: {
      color: colors.text.muted,
      fontSize: 9.5,
      fontWeight: '500',
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 38,
      marginBottom: 8,
    },
    searchInput: {
      flex: 1,
      color: colors.text.primary,
      fontSize: 12,
      paddingVertical: 0,
    },
    dateFilterContainer: {
      marginBottom: 6,
    },
    dateFilterPill: {
      paddingHorizontal: 9,
      paddingVertical: 4.5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    dateFilterPillSelected: {
      backgroundColor: `${colors.accent.purple}18`,
      borderColor: colors.accent.purple,
    },
    dateFilterPillText: {
      color: colors.text.muted,
      fontSize: 10.5,
      fontWeight: '600',
    },
    dateFilterPillTextSelected: {
      color: colors.accent.purple,
      fontWeight: '800',
    },
    filtersWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      gap: 6,
    },
    filtersRow: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    resultsBadge: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    resultsBadgeText: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '700',
    },
    clearSearchBtn: {
      marginTop: 6,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: `${colors.accent.blue}18`,
    },
    clearSearchBtnText: {
      color: colors.accent.blue,
      fontSize: 12,
      fontWeight: '700',
    },
    filterPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    filterPillSelected: {
      backgroundColor: `${colors.accent.blue}18`,
      borderColor: colors.accent.blue,
    },
    filterPillText: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '600',
    },
    filterPillTextSelected: {
      color: colors.accent.blue,
      fontWeight: '800',
    },
    listContent: {
      paddingBottom: 20,
      gap: 8,
    },
    txItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.glass.card,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      gap: 10,
    },
    txIconBox: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txInfo: {
      flex: 1,
      minWidth: 0,
    },
    txCat: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    txReason: {
      color: colors.text.secondary,
      fontSize: 11,
      marginTop: 1,
    },
    txMeta: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '500',
      marginTop: 2,
    },
    txRight: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      flexShrink: 0,
      paddingRight: 2,
      gap: 4,
    },
    txAmount: {
      fontSize: 14,
      fontWeight: '800',
      paddingRight: 3,
      letterSpacing: -0.2,
    },
    txRowActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 2,
    },
    txActionBtn: {
      padding: 4,
    },
    emptyWrap: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 6,
    },
    emptyTitle: {
      color: colors.text.secondary,
      fontSize: 14,
      fontWeight: '700',
    },
    emptySubtitle: {
      color: colors.text.muted,
      fontSize: 12,
    },
    notFoundText: {
      color: colors.text.primary,
      fontSize: 16,
      textAlign: 'center',
      marginVertical: 40,
    },
    closeFullBtn: {
      backgroundColor: colors.accent.blue,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    closeFullBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
