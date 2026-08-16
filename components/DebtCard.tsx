import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassBadge } from './GlassBadge';
import { Debt } from '../hooks/useDebts';
import { formatCurrency, formatDate, getDaysRemaining, isExpired } from '../utils/dateHelpers';
import { getAvatarColor, hexToRgba } from '../utils/colorHelpers';
import { useSettings } from '../context/SettingsContext';

interface DebtCardProps {
  debt: Debt;
  onTogglePaid?: (id: string) => void;
  onPress?: (id: string) => void;
  onDelete?: () => void;
  onSharePress?: (debt: Debt) => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({ debt, onTogglePaid, onPress, onDelete, onSharePress }) => {
  const { colors, isDark } = useTheme();
  const { cardDensityMode, formatCurrency, formatDate } = useSettings();
  const isCompact = cardDensityMode === 'compact';

  const styles = getStyles(colors, isDark, isCompact);
  const overdue = debt.dueDate ? isExpired(debt.dueDate) && !debt.isPaid : false;
  const daysRemaining = debt.dueDate ? getDaysRemaining(debt.dueDate) : null;
  const avatarColor = getAvatarColor(debt.personName);

  const totalPaid = (debt.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const percentPaid = debt.amount > 0 ? Math.min(100, Math.round((totalPaid / debt.amount) * 100)) : 0;
  const isPartiallyPaid = percentPaid > 0 && percentPaid < 100;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(debt.id)}
      activeOpacity={0.88}
      style={[styles.card, debt.isPaid && styles.cardPaid, overdue && !debt.isPaid && styles.cardOverdue]}
    >
      {/* Overdue indicator strip */}
      {overdue && !debt.isPaid && <View style={styles.overdueStrip} />}

      {/* ── TOP ROW ── */}
      <View style={styles.topRow}>
        {/* Avatar */}
        <View style={[
          styles.avatar,
          { backgroundColor: hexToRgba(avatarColor, isDark ? 0.2 : 0.12), borderColor: hexToRgba(avatarColor, isDark ? 0.35 : 0.25) },
          debt.isPaid && { opacity: 0.55 },
        ]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>
            {debt.personName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Person info */}
        <View style={styles.personInfo}>
          <Text style={[styles.personName, debt.isPaid && styles.strike]} numberOfLines={1}>
            {debt.personName}
          </Text>
          {debt.phoneNumber && (
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={11} color={isDark ? colors.text.muted : '#64748B'} />
              <Text style={styles.phone}>{debt.phoneNumber}</Text>
            </View>
          )}
        </View>

        {/* Amount + badge */}
        <View style={styles.amountWrap}>
          <Text style={[
            styles.amount,
            debt.isPaid ? styles.amountPaid : overdue ? styles.amountOverdue : styles.amountPending,
            debt.isPaid && styles.strike,
          ]}>
            {formatCurrency(debt.amount, debt.currency)}
          </Text>
          <View style={styles.badgeWrap}>
            <GlassBadge
              variant={debt.isPaid ? 'paid' : 'pending'}
              text={isPartiallyPaid ? `Paid ${percentPaid}%` : undefined}
            />
          </View>
        </View>
      </View>

      {/* ── PARTIAL PAYMENT BAR ── */}
      {isPartiallyPaid && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Partial Payment</Text>
            <Text style={styles.progressValue}>
              {formatCurrency(totalPaid, debt.currency)} of {formatCurrency(debt.amount, debt.currency)}
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${percentPaid}%` }]} />
          </View>
        </View>
      )}

      {/* ── PURPOSE & NOTES (Full multi-line visibility) ── */}
      {(debt.purpose || debt.notes) && (
        <View style={styles.notesContainer}>
          {debt.purpose && (
            <View style={styles.purposeRow}>
              <Ionicons name="pricetag-outline" size={12} color={isDark ? '#FB7185' : '#E11D48'} style={{ marginTop: 2 }} />
              <Text style={styles.purposeText}>{debt.purpose}</Text>
            </View>
          )}
          {debt.notes && (
            <View style={[styles.notesRow, debt.purpose && { marginTop: 4 }]}>
              <Ionicons name="document-text-outline" size={12} color={isDark ? colors.text.muted : '#64748B'} style={{ marginTop: 2 }} />
              <Text style={styles.notesText}>{debt.notes}</Text>
            </View>
          )}
        </View>
      )}

      {/* ── DIVIDER ── */}
      <View style={styles.divider} />

      {/* ── BOTTOM ROW ── */}
      <View style={styles.bottomRow}>
        {/* Dates column */}
        <View style={styles.datesCol}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color={isDark ? colors.text.muted : '#64748B'} />
            <Text style={styles.dateText}>Taken {formatDate(debt.takenDate)}</Text>
          </View>
          {debt.dueDate && (
            <View style={styles.dateRow}>
              <Ionicons
                name={overdue ? 'alert-circle' : 'time-outline'}
                size={13}
                color={overdue ? colors.accent.red : (isDark ? colors.text.muted : '#64748B')}
              />
              <Text style={[styles.dateText, overdue && styles.overdueText]}>
                Due {formatDate(debt.dueDate)}
                {overdue && ` · ${Math.abs(daysRemaining || 0)}d overdue`}
              </Text>
            </View>
          )}
          {debt.isPaid && debt.paidDate && (
            <View style={styles.dateRow}>
              <Ionicons name="checkmark-circle" size={13} color={colors.accent.green} />
              <Text style={[styles.dateText, { color: colors.accent.green }]}>
                Paid {formatDate(debt.paidDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Mark Paid CTA */}
        {!debt.isPaid && onTogglePaid && (
          <TouchableOpacity
            style={styles.markPaidBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onTogglePaid(debt.id); }}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={15} color={colors.accent.green} />
            <Text style={styles.markPaidText}>Mark Paid</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── ACTION ROW (Share + Delete) ── */}
      {((debt.isPaid && onSharePress) || onDelete) && (
        <View style={styles.actionRow}>
          {debt.isPaid && onSharePress && (
            <TouchableOpacity
              style={styles.actionBtnShare}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSharePress(debt); }}
              activeOpacity={0.78}
            >
              <Ionicons name="share-social-outline" size={14} color={colors.accent.blue} />
              <Text style={styles.actionBtnShareText}>Share Receipt</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.actionBtnDelete}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(); }}
              activeOpacity={0.78}
            >
              <Ionicons name="trash-outline" size={14} color={colors.accent.red} />
              <Text style={styles.actionBtnDeleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (colors: any, isDark: boolean, isCompact: boolean = false) => StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: isCompact ? 6 : 10,
    paddingHorizontal: 16,
    paddingTop: isCompact ? 10 : 16,
    paddingBottom: isCompact ? 8 : 14,
    borderRadius: isCompact ? 14 : 20,
    backgroundColor: isDark ? 'rgba(18, 18, 28, 0.88)' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: 8,
      },
      android: { elevation: isDark ? 2 : 3 },
    }),
  },
  cardPaid: {
    opacity: isDark ? 0.6 : 0.65,
  },
  cardOverdue: {
    borderColor: isDark ? 'rgba(239,83,80,0.4)' : '#FCA5A5',
    backgroundColor: isDark ? 'rgba(239,83,80,0.06)' : '#FEF2F2',
  },
  overdueStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 3.5,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    backgroundColor: colors.accent.red,
  },

  // ── Top Row ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 0,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '800',
  },
  personInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
    paddingTop: 2,
  },
  personName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phone: {
    color: isDark ? colors.text.muted : '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  amountWrap: {
    alignItems: 'flex-end',
    gap: 5,
    paddingTop: 2,
    flexShrink: 0,
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  amountPending: {
    color: isDark ? '#FB7185' : '#E11D48',
  },
  amountPaid: {
    color: isDark ? '#66BB6A' : '#16a34a',
  },
  amountOverdue: {
    color: colors.accent.red,
  },
  strike: {
    textDecorationLine: 'line-through',
    color: isDark ? colors.text.muted : '#94A3B8',
  },
  badgeWrap: {
    alignSelf: 'flex-end',
  },

  // ── Purpose & Notes Container ──
  notesContainer: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 10,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
  },
  purposeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  purposeText: {
    color: isDark ? '#FB7185' : '#BE123C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  notesText: {
    color: isDark ? colors.text.secondary : '#334155',
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },

  // ── Progress Bar ──
  progressContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: isDark ? colors.text.muted : '#64748B',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? colors.text.secondary : '#334155',
  },
  progressBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: isDark ? '#FB7185' : '#E11D48',
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9',
    marginVertical: 12,
  },

  // ── Bottom Row ──
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  datesCol: {
    gap: 5,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    color: isDark ? colors.text.secondary : '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  overdueText: {
    color: colors.accent.red,
    fontWeight: '600',
  },

  // Mark Paid button
  markPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 13,
    backgroundColor: isDark ? 'rgba(102,187,106,0.12)' : '#DCFCE7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(102,187,106,0.28)' : '#86EFAC',
  },
  markPaidText: {
    color: isDark ? colors.accent.green : '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Action Row ──
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9',
  },
  actionBtnShare: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    backgroundColor: isDark ? 'rgba(79,195,247,0.08)' : '#E0F2FE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(79,195,247,0.2)' : '#BAE6FD',
  },
  actionBtnShareText: {
    color: isDark ? colors.accent.blue : '#0284C7',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnDelete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    backgroundColor: isDark ? 'rgba(239,83,80,0.08)' : '#FEE2E2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239,83,80,0.2)' : '#FECACA',
  },
  actionBtnDeleteText: {
    color: colors.accent.red,
    fontSize: 13,
    fontWeight: '600',
  },
});
