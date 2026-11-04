import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { BankAccount } from '../hooks/useAccounts';
import { BankLogo } from './banks/BankLogo';
import { formatCurrency } from '../utils/dateHelpers';
import { GlassButton } from './GlassButton';
import {
  calculateDeductionBreakdown,
  calculateProjectedBalance,
  SplitFriendItem,
} from '../utils/bankDeductionHelper';

export interface BankDeductionConfirmModalProps {
  visible: boolean;
  account: BankAccount | null;
  amount: string | number;
  currency: string;
  isSplitEnabled: boolean;
  splitFriends?: SplitFriendItem[];
  onConfirmDeduct: (deductionAmount: number) => void;
  onConfirmSkipDeduct: () => void;
  onCancel: () => void;
}

export const BankDeductionConfirmModal: React.FC<BankDeductionConfirmModalProps> = ({
  visible,
  account,
  amount,
  currency,
  isSplitEnabled,
  splitFriends = [],
  onConfirmDeduct,
  onConfirmSkipDeduct,
  onCancel,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [show, setShow] = useState(visible);
  const scaleValue = useRef(new Animated.Value(0.92)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  const breakdown = calculateDeductionBreakdown(
    amount,
    account?.currentBalance || 0,
    isSplitEnabled,
    splitFriends
  );

  const [selectedDeductionType, setSelectedDeductionType] = useState<'full' | 'share'>('full');

  useEffect(() => {
    if (visible) {
      setSelectedDeductionType('full');
      setShow(true);
      Animated.parallel([
        Animated.timing(opacityValue, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleValue, { toValue: 1, friction: 6, tension: 45, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityValue, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(scaleValue, { toValue: 0.92, duration: 180, useNativeDriver: true }),
      ]).start(() => setShow(false));
    }
  }, [visible]);

  if (!show || !account) return null;

  const activeDeductionAmount =
    breakdown.canChooseSplitDeduction && selectedDeductionType === 'share'
      ? breakdown.userNetShare
      : breakdown.defaultDeductionAmount;

  const projectedBalance = calculateProjectedBalance(account.currentBalance, activeDeductionAmount);
  const isOverdraft = projectedBalance < 0;

  const handleDeduct = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirmDeduct(activeDeductionAmount);
  };

  const handleSkipDeduct = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirmSkipDeduct();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <Modal transparent visible={show} animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.overlayBg, { opacity: opacityValue }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.dialog,
            {
              opacity: opacityValue,
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.bankIdentityRow}>
              <BankLogo name={account.name} fallbackColor={account.color} size={36} />
              <View style={styles.bankNameCol}>
                <Text style={styles.bankName} numberOfLines={1}>
                  {account.name}
                </Text>
                <Text style={styles.bankSub} numberOfLines={1}>
                  {account.accountNumberMasked ? `${account.accountNumberMasked} · ` : ''}
                  {account.accountType.toUpperCase()}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Deduct from Bank Passbook?</Text>
          <Text style={styles.subtitle}>
            Choose whether to record this withdrawal in your bank account ledger or only log it in your daily spending.
          </Text>

          {breakdown.canChooseSplitDeduction && (
            <View style={styles.splitChoiceBox}>
              <Text style={styles.splitChoiceLabel}>AMOUNT TO WITHDRAW FROM BANK</Text>
              <View style={styles.splitChoiceRow}>
                <TouchableOpacity
                  style={[
                    styles.splitChoiceBtn,
                    selectedDeductionType === 'full' && styles.splitChoiceBtnActive,
                  ]}
                  onPress={() => setSelectedDeductionType('full')}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.splitChoiceBtnText,
                      selectedDeductionType === 'full' && styles.splitChoiceBtnTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    Full Bill: {formatCurrency(breakdown.totalBill, currency)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.splitChoiceBtn,
                    selectedDeductionType === 'share' && styles.splitChoiceBtnActive,
                  ]}
                  onPress={() => setSelectedDeductionType('share')}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.splitChoiceBtnText,
                      selectedDeductionType === 'share' && styles.splitChoiceBtnTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    My Share: {formatCurrency(breakdown.userNetShare, currency)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.calcCard}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Current Balance</Text>
              <Text style={styles.calcValueCurrent} numberOfLines={1}>
                {formatCurrency(account.currentBalance, account.currency)}
              </Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Withdrawal Amount</Text>
              <Text style={styles.calcValueDeduct} numberOfLines={1}>
                -{formatCurrency(activeDeductionAmount, currency)}
              </Text>
            </View>

            <View style={styles.calcDivider} />

            <View style={styles.calcRow}>
              <Text style={styles.calcLabelTotal}>Remaining Balance</Text>
              <Text
                style={[
                  styles.calcValueRemaining,
                  { color: isOverdraft ? colors.accent.red : colors.accent.green },
                ]}
                numberOfLines={1}
              >
                {formatCurrency(projectedBalance, account.currency)}
              </Text>
            </View>

            {isOverdraft ? (
              <View style={styles.overdraftAlert}>
                <Ionicons name="warning-outline" size={13} color={colors.accent.red} />
                <Text style={styles.overdraftAlertText} numberOfLines={1}>
                  Notice: Account balance will drop below zero
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actionCol}>
            <GlassButton
              title="Yes, Deduct & Record"
              variant="primary"
              size="medium"
              leftIcon={<Ionicons name="wallet-outline" size={18} color="#FFFFFF" />}
              onPress={handleDeduct}
            />

            <GlassButton
              title="Record Spending Only (Don't Deduct)"
              variant="secondary"
              size="medium"
              leftIcon={<Ionicons name="bookmark-outline" size={17} color={colors.text.primary} />}
              onPress={handleSkipDeduct}
            />

            <TouchableOpacity style={styles.cancelGhostBtn} onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.cancelGhostText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    overlayBg: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
    },
    dialog: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.background.primary,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    bankIdentityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },
    bankNameCol: {
      flex: 1,
      minWidth: 0,
    },
    bankName: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    bankSub: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '600',
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.glass.card,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    title: {
      color: colors.text.primary,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.2,
      marginBottom: 4,
    },
    subtitle: {
      color: colors.text.secondary,
      fontSize: 12.5,
      lineHeight: 18,
      marginBottom: 14,
    },
    splitChoiceBox: {
      backgroundColor: colors.glass.card,
      padding: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      marginBottom: 12,
      gap: 6,
    },
    splitChoiceLabel: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    splitChoiceRow: {
      flexDirection: 'row',
      gap: 8,
    },
    splitChoiceBtn: {
      flex: 1,
      paddingVertical: 7,
      paddingHorizontal: 8,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    splitChoiceBtnActive: {
      backgroundColor: `${colors.accent.blue}18`,
      borderColor: colors.accent.blue,
    },
    splitChoiceBtnText: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '600',
    },
    splitChoiceBtnTextActive: {
      color: colors.accent.blue,
      fontWeight: '800',
    },
    calcCard: {
      backgroundColor: colors.glass.card,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      marginBottom: 16,
      gap: 8,
    },
    calcRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    calcLabel: {
      color: colors.text.muted,
      fontSize: 12,
      fontWeight: '500',
    },
    calcLabelTotal: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    calcValueCurrent: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
      paddingRight: 2,
    },
    calcValueDeduct: {
      color: colors.accent.red,
      fontSize: 13,
      fontWeight: '700',
      paddingRight: 2,
    },
    calcValueRemaining: {
      fontSize: 15,
      fontWeight: '800',
      paddingRight: 2,
    },
    calcDivider: {
      height: 1,
      backgroundColor: colors.glass.cardBorder,
      marginVertical: 2,
    },
    overdraftAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: `${colors.accent.red}15`,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginTop: 2,
    },
    overdraftAlertText: {
      color: colors.accent.red,
      fontSize: 10.5,
      fontWeight: '600',
      flex: 1,
    },
    actionCol: {
      gap: 9,
    },
    cancelGhostBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      marginTop: 2,
    },
    cancelGhostText: {
      color: colors.text.muted,
      fontSize: 13,
      fontWeight: '600',
    },
  });
