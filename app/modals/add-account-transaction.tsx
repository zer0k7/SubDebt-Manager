import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useAccounts, AccountTxType } from '../../hooks/useAccounts';
import { storage } from '../../storage/mmkv';
import { STORAGE_KEYS } from '../../storage/keys';
import { GlassInput } from '../../components/GlassInput';
import { GlassButton } from '../../components/GlassButton';
import { AmbientBackground } from '../../components/AmbientBackground';
import { AppDatePicker } from '../../components/AppDatePicker';
import { BankLogo } from '../../components/banks/BankLogo';
import { formatCurrency } from '../../utils/dateHelpers';

const QUICK_CATEGORIES: Record<AccountTxType, string[]> = {
  deposit: ['Salary', 'Client Payment', 'Cash Deposit', 'Investment Return', 'Gift / Bonus', 'General Deposit'],
  withdrawal: ['ATM Cash', 'Rent', 'Online Shopping', 'Card Bill', 'Groceries', 'Personal Expense'],
  transfer: ['Self Transfer', 'Emergency Transfer', 'Savings Move', 'Bill Payment Transfer'],
};

export default function AddAccountTransactionModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { transactionId, initialAccountId, initialType } = useLocalSearchParams<{
    transactionId?: string;
    initialAccountId?: string;
    initialType?: string;
  }>();
  const { accounts, transactions, addTransaction, editTransaction } = useAccounts();

  const isEditing = Boolean(transactionId);
  const existingTx = transactionId ? transactions.find((t) => t.id === transactionId) : undefined;

  const [txType, setTxType] = useState<AccountTxType>(
    initialType === 'withdrawal' || initialType === 'transfer' ? (initialType as AccountTxType) : 'deposit'
  );
  const [selectedAccountId, setSelectedAccountId] = useState(
    initialAccountId || (accounts.length > 0 ? accounts[0].id : '')
  );
  const [toAccountId, setToAccountId] = useState(
    accounts.find((a) => a.id !== (initialAccountId || (accounts[0]?.id || '')))?.id || ''
  );
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(QUICK_CATEGORIES.deposit[0]);
  const [reasonNotes, setReasonNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');

  const [customTags, setCustomTags] = useState<string[]>([]);
  const [isAddingCustomTag, setIsAddingCustomTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const activeAccount = accounts.find((a) => a.id === selectedAccountId);

  useEffect(() => {
    const loadCustomTags = async () => {
      try {
        const raw = await storage.getString(STORAGE_KEYS.ACCOUNT_CUSTOM_CATEGORIES);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setCustomTags(parsed);
        }
      } catch {}
    };
    loadCustomTags();
  }, []);

  useEffect(() => {
    if (existingTx) {
      setTxType(existingTx.type);
      setSelectedAccountId(existingTx.accountId);
      if (existingTx.toAccountId) setToAccountId(existingTx.toAccountId);
      setAmount(existingTx.amount.toString());
      setCategory(existingTx.category);
      setReasonNotes(existingTx.reasonNotes || '');
      setDate(existingTx.date);
    }
  }, [existingTx]);

  useEffect(() => {
    if (!isEditing && !selectedAccountId && accounts.length > 0) {
      const defaultAcc = initialAccountId ? accounts.find((a) => a.id === initialAccountId) : accounts[0];
      if (defaultAcc) {
        setSelectedAccountId(defaultAcc.id);
        const other = accounts.find((a) => a.id !== defaultAcc.id);
        if (other) setToAccountId(other.id);
      }
    }
  }, [accounts, selectedAccountId, initialAccountId, isEditing]);

  const handleTypeSelect = (type: AccountTxType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTxType(type);
    setCategory(QUICK_CATEGORIES[type][0]);
    if (error) setError('');
  };

  const handleSaveCustomTag = async () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (!customTags.includes(trimmed)) {
      const updated = [...customTags, trimmed];
      setCustomTags(updated);
      await storage.set(STORAGE_KEYS.ACCOUNT_CUSTOM_CATEGORIES, JSON.stringify(updated));
    }
    setCategory(trimmed);
    setNewTagInput('');
    setIsAddingCustomTag(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDeleteCustomTag = async (tagToDelete: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = customTags.filter((t) => t !== tagToDelete);
    setCustomTags(updated);
    await storage.set(STORAGE_KEYS.ACCOUNT_CUSTOM_CATEGORIES, JSON.stringify(updated));
    if (category === tagToDelete) {
      setCategory(QUICK_CATEGORIES[txType][0]);
    }
  };

  const handleSave = async () => {
    if (!selectedAccountId) {
      setError('Please select an account');
      return;
    }
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (txType === 'transfer') {
      if (!toAccountId) {
        setError('Please select destination account');
        return;
      }
      if (toAccountId === selectedAccountId) {
        setError('From and To account cannot be the same');
        return;
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isEditing && transactionId) {
      await editTransaction(transactionId, {
        accountId: selectedAccountId,
        toAccountId: txType === 'transfer' ? toAccountId : undefined,
        type: txType,
        amount: numAmt,
        category,
        reasonNotes: reasonNotes.trim() || undefined,
        date,
      });
    } else {
      await addTransaction({
        accountId: selectedAccountId,
        toAccountId: txType === 'transfer' ? toAccountId : undefined,
        type: txType,
        amount: numAmt,
        category,
        reasonNotes: reasonNotes.trim() || undefined,
        date,
      });
    }

    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {isEditing
            ? `Edit ${txType === 'deposit' ? 'Deposit' : txType === 'withdrawal' ? 'Withdrawal' : 'Transfer'}`
            : txType === 'deposit'
            ? 'Record Deposit'
            : txType === 'withdrawal'
            ? 'Record Withdrawal'
            : 'Transfer Funds'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.typeSegment}>
            <TouchableOpacity
              style={[styles.segmentBtn, txType === 'deposit' && styles.segmentBtnDeposit]}
              onPress={() => handleTypeSelect('deposit')}
            >
              <Text style={[styles.segmentText, txType === 'deposit' && styles.segmentTextActive]}>
                Deposit In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, txType === 'withdrawal' && styles.segmentBtnWithdraw]}
              onPress={() => handleTypeSelect('withdrawal')}
            >
              <Text style={[styles.segmentText, txType === 'withdrawal' && styles.segmentTextActive]}>
                Withdraw Out
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, txType === 'transfer' && styles.segmentBtnTransfer]}
              onPress={() => handleTypeSelect('transfer')}
            >
              <Text style={[styles.segmentText, txType === 'transfer' && styles.segmentTextActive]}>
                Transfer
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>{txType === 'transfer' ? 'FROM ACCOUNT' : 'SELECT ACCOUNT'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accChipsRow}>
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <TouchableOpacity
                  key={acc.id}
                  style={[
                    styles.accChip,
                    isSelected && { borderColor: acc.color, backgroundColor: `${acc.color}15` },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedAccountId(acc.id);
                  }}
                  activeOpacity={0.7}
                >
                  <BankLogo name={acc.name} fallbackColor={acc.color} size={18} />
                  <Text style={[styles.accChipText, isSelected && { color: colors.text.primary, fontWeight: '800' }]}>
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {activeAccount && (
            <View style={styles.balanceBadgeRow}>
              <Ionicons name="wallet-outline" size={13} color={colors.accent.blue} style={{ flexShrink: 0 }} />
              <Text style={styles.balanceBadgeText} numberOfLines={1} ellipsizeMode="tail">
                {activeAccount.name} Live Balance: {formatCurrency(activeAccount.currentBalance, activeAccount.currency)}
              </Text>
            </View>
          )}

          {txType === 'transfer' && (
            <>
              <Text style={styles.sectionLabel}>TO ACCOUNT (DESTINATION)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accChipsRow}>
                {accounts
                  .filter((a) => a.id !== selectedAccountId)
                  .map((acc) => {
                    const isSelected = toAccountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[
                          styles.accChip,
                          isSelected && { borderColor: acc.color, backgroundColor: `${acc.color}15` },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setToAccountId(acc.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <BankLogo name={acc.name} fallbackColor={acc.color} size={18} />
                        <Text
                          style={[
                            styles.accChipText,
                            isSelected && { color: colors.text.primary, fontWeight: '800' },
                          ]}
                        >
                          {acc.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </>
          )}

          <GlassInput
            label="TRANSACTION AMOUNT *"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(txt) => {
              setAmount(txt);
              if (error) setError('');
            }}
          />

          <GlassInput
            label="REASON / DESCRIPTION (WHY)"
            placeholder="e.g. Salary credited, Grocery run, ATM withdrawal"
            value={reasonNotes}
            onChangeText={setReasonNotes}
          />

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>CATEGORY / TAG</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsAddingCustomTag(!isAddingCustomTag);
              }}
              style={styles.addTagHeaderBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isAddingCustomTag ? 'close-circle-outline' : 'add-circle-outline'}
                size={14}
                color={colors.accent.blue}
              />
              <Text style={styles.addTagHeaderText}>
                {isAddingCustomTag ? 'Cancel' : 'New Tag'}
              </Text>
            </TouchableOpacity>
          </View>

          {isAddingCustomTag && (
            <View style={styles.newTagInputBox}>
              <View style={styles.newTagInputInner}>
                <Ionicons name="pricetag-outline" size={16} color={colors.accent.blue} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Tag name (e.g. Crypto, SIP, Rent)"
                  placeholderTextColor={colors.text.placeholder}
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  style={styles.newTagInput}
                  onSubmitEditing={handleSaveCustomTag}
                  returnKeyType="done"
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.saveTagBtn,
                  { backgroundColor: colors.accent.blue, opacity: newTagInput.trim() ? 1 : 0.5 },
                ]}
                onPress={handleSaveCustomTag}
                disabled={!newTagInput.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.saveTagBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsRow}>
            {QUICK_CATEGORIES[txType].map((c) => {
              const isSelected = category === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, isSelected && styles.catChipSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(c);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catChipText, isSelected && styles.catChipTextSelected]}>{c}</Text>
                </TouchableOpacity>
              );
            })}

            {customTags.map((t) => {
              const isSelected = category === t;
              return (
                <View
                  key={t}
                  style={[
                    styles.catChip,
                    styles.customCatChip,
                    isSelected && styles.catChipSelected,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.customCatChipTouch}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCategory(t);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="pricetag"
                      size={12}
                      color={isSelected ? colors.accent.blue : colors.text.muted}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.catChipText, isSelected && styles.catChipTextSelected]}>{t}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteCustomTag(t)}
                    style={styles.delTagBtn}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="close" size={12} color={colors.text.muted} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {isEditing && !QUICK_CATEGORIES[txType].includes(category) && !customTags.includes(category) && (
              <TouchableOpacity
                key="current-tag"
                style={[styles.catChip, styles.catChipSelected]}
                activeOpacity={0.7}
              >
                <Ionicons name="pricetag" size={12} color={colors.accent.blue} style={{ marginRight: 4 }} />
                <Text style={[styles.catChipText, styles.catChipTextSelected]}>{category}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.catChip, styles.addCustomChip]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsAddingCustomTag(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={14} color={colors.accent.blue} style={{ marginRight: 4 }} />
              <Text style={[styles.catChipText, { color: colors.accent.blue, fontWeight: '700' }]}>Custom</Text>
            </TouchableOpacity>
          </ScrollView>

          <Text style={styles.sectionLabel}>TRANSACTION DATE</Text>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.accent.blue} />
            <Text style={styles.dateBtnText}>
              {new Date(date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>

          <View style={styles.btnRow}>
            <GlassButton
              title={
                isEditing
                  ? 'Update Transaction'
                  : txType === 'deposit'
                  ? 'Confirm Deposit'
                  : txType === 'withdrawal'
                  ? 'Confirm Withdrawal'
                  : 'Execute Transfer'
              }
              onPress={handleSave}
              size="large"
            />
            <GlassButton
              title="Cancel"
              variant="ghost"
              onPress={() => router.back()}
              size="large"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppDatePicker
        visible={showDatePicker}
        date={new Date(date)}
        onConfirm={(d: Date) => {
          setDate(d.toISOString());
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.glass.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      color: colors.text.primary,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 60,
      gap: 12,
    },
    sectionLabel: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: 4,
    },
    typeSegment: {
      flexDirection: 'row',
      backgroundColor: colors.glass.card,
      padding: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      marginBottom: 4,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    segmentBtnDeposit: {
      backgroundColor: `${colors.accent.green}20`,
    },
    segmentBtnWithdraw: {
      backgroundColor: `${colors.accent.red}20`,
    },
    segmentBtnTransfer: {
      backgroundColor: `${colors.accent.blue}20`,
    },
    segmentText: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '600',
    },
    segmentTextActive: {
      color: colors.text.primary,
      fontWeight: '800',
    },
    accChipsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 2,
    },
    accChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    accDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    accChipText: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '600',
    },
    balanceBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
      marginBottom: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    balanceBadgeText: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '600',
      flexShrink: 1,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    addTagHeaderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: `${colors.accent.blue}15`,
    },
    addTagHeaderText: {
      color: colors.accent.blue,
      fontSize: 11,
      fontWeight: '700',
    },
    newTagInputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.glass.card,
      padding: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.accent.blue,
    },
    newTagInputInner: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    newTagInput: {
      flex: 1,
      color: colors.text.primary,
      fontSize: 13,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    saveTagBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveTagBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    catChipsRow: {
      flexDirection: 'row',
      gap: 6,
      paddingVertical: 2,
    },
    catChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    customCatChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 6,
    },
    customCatChipTouch: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    delTagBtn: {
      marginLeft: 6,
      padding: 2,
    },
    addCustomChip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderStyle: 'dashed',
      borderColor: colors.accent.blue,
    },
    catChipSelected: {
      backgroundColor: `${colors.accent.blue}20`,
      borderColor: colors.accent.blue,
    },
    catChipText: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '600',
    },
    catChipTextSelected: {
      color: colors.accent.blue,
      fontWeight: '800',
    },
    dateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.glass.input,
      borderWidth: 1,
      borderColor: colors.glass.inputBorder,
    },
    dateBtnText: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    btnRow: {
      gap: 8,
      marginTop: 14,
    },
    errorText: {
      color: colors.accent.red,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 4,
    },
  });
