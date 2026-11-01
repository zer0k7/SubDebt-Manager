import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { useCurrency } from '../../hooks/useCurrency';
import { useAccounts, AccountType, ACCOUNT_COLORS, ACCOUNT_TYPE_ICONS } from '../../hooks/useAccounts';
import { BankLogo } from '../../components/banks/BankLogo';
import { INDIAN_BANKS } from '../../components/banks/bankRegistry';
import { GlassInput } from '../../components/GlassInput';
import { GlassButton } from '../../components/GlassButton';
import { AmbientBackground } from '../../components/AmbientBackground';

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: string }[] = [
  { type: 'bank', label: 'Bank Account', icon: ACCOUNT_TYPE_ICONS.bank },
  { type: 'wallet', label: 'Digital Wallet', icon: ACCOUNT_TYPE_ICONS.wallet },
  { type: 'cash', label: 'Cash in Hand', icon: ACCOUNT_TYPE_ICONS.cash },
  { type: 'savings', label: 'Savings Reserve', icon: ACCOUNT_TYPE_ICONS.savings },
];

export default function AddAccountModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { currencyCode } = useCurrency();
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();
  const { accounts, addAccount, editAccount } = useAccounts();

  const existingAccount = accounts.find((a) => a.id === accountId);
  const isEditing = Boolean(existingAccount);

  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [accountNumberMasked, setAccountNumberMasked] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingAccount) {
      setName(existingAccount.name);
      setAccountType(existingAccount.accountType);
      setAccountNumberMasked(existingAccount.accountNumberMasked || '');
      setSelectedColor(existingAccount.color || ACCOUNT_COLORS[0]);
    }
  }, [existingAccount]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please provide an account name');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isEditing && existingAccount) {
      await editAccount(existingAccount.id, {
        name: name.trim(),
        accountType,
        accountNumberMasked: accountNumberMasked.trim() || undefined,
        color: selectedColor,
      });
    } else {
      await addAccount({
        name: name.trim(),
        accountType,
        accountNumberMasked: accountNumberMasked.trim() || undefined,
        initialBalance: parseFloat(initialBalance) || 0,
        currency: currencyCode,
        color: selectedColor,
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
          {isEditing ? 'Edit Account' : 'Add Bank / Cash Account'}
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

          <Text style={styles.sectionLabel}>ACCOUNT TYPE</Text>
          <View style={styles.typeGrid}>
            {ACCOUNT_TYPES.map((t) => {
              const isSelected = accountType === t.type;
              return (
                <TouchableOpacity
                  key={t.type}
                  style={[styles.typeTile, isSelected && styles.typeTileSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAccountType(t.type);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={t.icon as any}
                    size={20}
                    color={isSelected ? colors.accent.blue : colors.text.tertiary}
                  />
                  <Text
                    style={[styles.typeTileText, isSelected && styles.typeTileTextSelected]}
                    numberOfLines={1}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {accountType === 'bank' && (
            <>
              <Text style={styles.sectionLabel}>QUICK SELECT BANK</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bankChipsRow}
              >
                {INDIAN_BANKS.map((b) => {
                  const isSelected = name.toLowerCase() === b.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.bankChip, isSelected && styles.bankChipSelected]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setName(b.name);
                        setSelectedColor(b.brandColor);
                        if (error) setError('');
                      }}
                      activeOpacity={0.7}
                    >
                      <BankLogo bankId={b.id} size={20} />
                      <Text style={[styles.bankChipText, isSelected && styles.bankChipTextSelected]}>
                        {b.shortName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          <GlassInput
            label="ACCOUNT / BANK NAME *"
            placeholder="e.g. HDFC Salary, SBI, Cash Wallet"
            value={name}
            onChangeText={(txt) => {
              setName(txt);
              if (error) setError('');
            }}
          />

          {name.trim().length > 0 && (
            <View style={styles.liveRecognizeRow}>
              <BankLogo name={name} fallbackColor={selectedColor} size={28} />
              <View style={{ flex: 1 }}>
                <Text style={styles.liveRecognizeTitle} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.liveRecognizeSub}>Recognized Account Badge</Text>
              </View>
            </View>
          )}

          {!isEditing && (
            <GlassInput
              label={`OPENING BALANCE (${currencyCode})`}
              placeholder="0.00"
              keyboardType="numeric"
              value={initialBalance}
              onChangeText={setInitialBalance}
            />
          )}

          {accountType === 'bank' && (
            <GlassInput
              label="ACCOUNT NUMBER / LAST 4 DIGITS"
              placeholder="e.g. •••• 5642"
              value={accountNumberMasked}
              onChangeText={setAccountNumberMasked}
            />
          )}

          <Text style={styles.sectionLabel}>CARD COLOR ACCENT</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorRow}
          >
            {ACCOUNT_COLORS.map((c) => {
              const isSelected = selectedColor === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    isSelected && styles.colorCircleSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedColor(c);
                  }}
                  activeOpacity={0.7}
                >
                  {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.btnRow}>
            <GlassButton
              title={isEditing ? 'Save Changes' : 'Create Account'}
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
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeTile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      minWidth: '47%',
      flex: 1,
    },
    typeTileSelected: {
      borderColor: colors.accent.blue,
      backgroundColor: `${colors.accent.blue}14`,
    },
    typeTileText: {
      color: colors.text.secondary,
      fontSize: 13,
      fontWeight: '600',
    },
    typeTileTextSelected: {
      color: colors.accent.blue,
      fontWeight: '800',
    },
    bankChipsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 2,
    },
    bankChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    bankChipSelected: {
      borderColor: colors.accent.blue,
      backgroundColor: `${colors.accent.blue}18`,
    },
    bankChipText: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '700',
    },
    bankChipTextSelected: {
      color: colors.text.primary,
      fontWeight: '800',
    },
    liveRecognizeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      marginTop: -4,
      marginBottom: 4,
    },
    liveRecognizeTitle: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    liveRecognizeSub: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '500',
      marginTop: 1,
    },
    colorRow: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 4,
    },
    colorCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorCircleSelected: {
      borderWidth: 3,
      borderColor: isDark ? '#FFFFFF' : '#0F172A',
    },
    btnRow: {
      gap: 8,
      marginTop: 16,
    },
    errorText: {
      color: colors.accent.red,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 4,
    },
  });
