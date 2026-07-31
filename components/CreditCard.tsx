import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassBadge } from './GlassBadge';
import { Credit } from '../hooks/useCredits';
import { formatCurrency, formatDate, getDaysRemaining, isExpired } from '../utils/dateHelpers';
import { getAvatarColor, hexToRgba } from '../utils/colorHelpers';

interface CreditCardProps {
  credit: Credit;
  onMarkReturned?: (id: string) => void;
  onPress?: (id: string) => void;
  onDelete?: () => void;
  onSharePress?: (credit: Credit) => void;
}

export const CreditCard: React.FC<CreditCardProps> = ({ credit, onMarkReturned, onPress, onDelete, onSharePress }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const overdue = credit.expectedReturnDate ? isExpired(credit.expectedReturnDate) && !credit.isReturned : false;
  const daysRemaining = credit.expectedReturnDate ? getDaysRemaining(credit.expectedReturnDate) : null;
  const avatarColor = getAvatarColor(credit.personName);

  const totalReturned = (credit.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const percentReturned = credit.amount > 0 ? Math.min(100, Math.round((totalReturned / credit.amount) * 100)) : 0;
  const isPartiallyReturned = percentReturned > 0 && percentReturned < 100;

  return (
    <TouchableOpacity onPress={() => onPress?.(credit.id)} activeOpacity={0.85} style={[styles.card, credit.isReturned && styles.cardReturned]}>
      <View style={styles.topRow}>
        <View style={styles.personRow}>
          <View style={[
            styles.avatar,
            {
              backgroundColor: hexToRgba(avatarColor, 0.15),
              borderColor: hexToRgba(avatarColor, 0.3)
            },
            credit.isReturned && { opacity: 0.6 }
          ]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>
              {credit.personName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.personInfo}>
            <Text style={[styles.personName, credit.isReturned && styles.strike]}>{credit.personName}</Text>
            {credit.phoneNumber && <Text style={styles.phone}>{credit.phoneNumber}</Text>}
          </View>
        </View>

        <View style={styles.amountWrap}>
          <Text style={[styles.amount, credit.isReturned ? styles.amountReturned : styles.amountPending, credit.isReturned && styles.strike]}>
            {formatCurrency(credit.amount, credit.currency)}
          </Text>
          <View style={styles.badgeRow}>
            <GlassBadge 
              variant={credit.isReturned ? 'paid' : 'active'} 
              text={isPartiallyReturned ? `Returned ${percentReturned}%` : undefined}
            />
          </View>
        </View>
      </View>

      {(credit.purpose || credit.notes) && (
        <View style={styles.middleSection}>
          {credit.purpose && <Text style={styles.purpose} numberOfLines={1}>{credit.purpose}</Text>}
          {credit.notes && <Text style={styles.notes} numberOfLines={2}>{credit.notes}</Text>}
        </View>
      )}

      {isPartiallyReturned && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Partial Return Progress</Text>
            <Text style={styles.progressValue}>
              {formatCurrency(totalReturned, credit.currency)} / {formatCurrency(credit.amount, credit.currency)}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${percentReturned}%` }]} />
          </View>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.datesCol}>
          <View style={styles.dateRow}>
            <Ionicons name="cash-outline" size={14} color={colors.text.muted} />
            <Text style={styles.dateText}>Given: {formatDate(credit.lentDate)}</Text>
          </View>
          {credit.expectedReturnDate && (
            <View style={styles.dateRow}>
              <Ionicons name={overdue ? "alert-circle" : "time-outline"} size={14} color={overdue ? colors.accent.red : colors.text.muted} />
              <Text style={[styles.dateText, overdue && { color: colors.accent.red }]}>
                Expected: {formatDate(credit.expectedReturnDate)}{overdue && ` (${Math.abs(daysRemaining || 0)}d overdue)`}
              </Text>
            </View>
          )}
          {credit.isReturned && credit.returnedDate && (
            <View style={styles.dateRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.accent.green} />
              <Text style={[styles.dateText, { color: colors.accent.green }]}>Returned: {formatDate(credit.returnedDate)}</Text>
            </View>
          )}
        </View>

        {!credit.isReturned && onMarkReturned && (
          <TouchableOpacity style={styles.markBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onMarkReturned(credit.id); }}>
            <Ionicons name="checkmark-circle" size={20} color={colors.accent.green} />
            <Text style={styles.markText}>Mark Returned</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons Row — Share & Delete */}
      {((credit.isReturned && onSharePress) || onDelete) && (
        <View style={styles.actionButtonsRow}>
          {credit.isReturned && onSharePress && (
            <TouchableOpacity
              style={styles.actionBtnShare}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSharePress(credit); }}
              activeOpacity={0.75}
            >
              <Ionicons name="share-social-outline" size={14} color={colors.accent.blue} />
              <Text style={styles.actionBtnShareText}>Share Receipt</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.actionBtnDelete}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(); }}
              activeOpacity={0.75}
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

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  card: {
    marginHorizontal: 20, marginBottom: 12, padding: 16,
    borderRadius: 20, backgroundColor: colors.glass.card,
    borderWidth: 0.5, borderColor: colors.glass.cardBorder,
  },
  cardReturned: { opacity: 0.65 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  personRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  personInfo: { marginLeft: 12, flex: 1 },
  personName: { color: colors.text.primary, fontSize: 16, fontWeight: '700' },
  phone: { color: colors.text.muted, fontSize: 12, marginTop: 2 },
  amountWrap: { alignItems: 'flex-end' },
  amount: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  amountPending: { color: colors.accent.green },
  amountReturned: { color: colors.text.muted },
  strike: { textDecorationLine: 'line-through', color: colors.text.muted },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10, alignSelf: 'flex-end' },
  middleSection: { marginTop: 16 },
  purpose: { color: colors.text.primary, fontSize: 14, fontWeight: '500', marginBottom: 4 },
  notes: { color: colors.text.muted, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },

  // Progress Bar Styles
  progressContainer: {
    marginTop: 14,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent.green,
  },

  divider: { height: 1, backgroundColor: colors.glass.card, marginVertical: 14 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  datesCol: { gap: 6, flex: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { color: colors.text.secondary, fontSize: 13, fontWeight: '500' },
  markBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, 
    backgroundColor: 'rgba(102,187,106,0.1)', borderRadius: 16, 
    borderWidth: 1, borderColor: 'rgba(102,187,106,0.3)' 
  },
  markText: { color: colors.accent.green, fontSize: 13, fontWeight: '700' },

  // Action Pill Buttons (Share & Delete)
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  },
  actionBtnShare: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: isDark ? 'rgba(79,195,247,0.08)' : 'rgba(79,195,247,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(79,195,247,0.2)' : 'rgba(79,195,247,0.25)',
  },
  actionBtnShareText: {
    color: colors.accent.blue,
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
    paddingHorizontal: 14,
    backgroundColor: isDark ? 'rgba(239,83,80,0.08)' : 'rgba(239,83,80,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239,83,80,0.2)' : 'rgba(239,83,80,0.25)',
  },
  actionBtnDeleteText: {
    color: colors.accent.red,
    fontSize: 13,
    fontWeight: '600',
  },
});
