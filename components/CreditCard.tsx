import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassBadge } from './GlassBadge';
import { Credit } from '../hooks/useCredits';
import { formatCurrency, formatDate, getDaysRemaining, isExpired } from '../utils/dateHelpers';
import { getAvatarColor, hexToRgba } from '../utils/colorHelpers';
import { useSettings } from '../context/SettingsContext';

interface CreditCardProps {
  credit: Credit;
  onMarkReturned?: (id: string) => void;
  onPress?: (id: string) => void;
  onDelete?: () => void;
  onSharePress?: (credit: Credit) => void;
}

export const CreditCard: React.FC<CreditCardProps> = ({ credit, onMarkReturned, onPress, onDelete, onSharePress }) => {
  const { colors, isDark } = useTheme();
  const { cardDensityMode, formatCurrency, formatDate } = useSettings();
  const isCompact = cardDensityMode === 'compact';

  const styles = getStyles(colors, isDark, isCompact);
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
              backgroundColor: hexToRgba(avatarColor, isDark ? 0.2 : 0.12),
              borderColor: hexToRgba(avatarColor, isDark ? 0.35 : 0.25)
            },
            credit.isReturned && { opacity: 0.6 }
          ]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>
              {credit.personName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.personInfo}>
            <Text style={[styles.personName, credit.isReturned && styles.strike]}>{credit.personName}</Text>
            {credit.phoneNumber && (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={11} color={isDark ? colors.text.muted : '#64748B'} />
                <Text style={styles.phone}>{credit.phoneNumber}</Text>
              </View>
            )}
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

      {/* Purpose & Notes Container (Full multi-line visibility) */}
      {(credit.purpose || credit.notes) && (
        <View style={styles.notesContainer}>
          {credit.purpose && (
            <View style={styles.purposeRow}>
              <Ionicons name="pricetag-outline" size={12} color={colors.accent.green} style={{ marginTop: 2 }} />
              <Text style={styles.purposeText}>{credit.purpose}</Text>
            </View>
          )}
          {credit.notes && (
            <View style={[styles.notesRow, credit.purpose && { marginTop: 4 }]}>
              <Ionicons name="document-text-outline" size={12} color={isDark ? colors.text.muted : '#64748B'} style={{ marginTop: 2 }} />
              <Text style={styles.notesText}>{credit.notes}</Text>
            </View>
          )}
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
            <Ionicons name="cash-outline" size={13} color={isDark ? colors.text.muted : '#64748B'} />
            <Text style={styles.dateText}>Given {formatDate(credit.lentDate)}</Text>
          </View>
          {credit.expectedReturnDate && (
            <View style={styles.dateRow}>
              <Ionicons name={overdue ? "alert-circle" : "time-outline"} size={13} color={overdue ? colors.accent.red : (isDark ? colors.text.muted : '#64748B')} />
              <Text style={[styles.dateText, overdue && { color: colors.accent.red }]}>
                Expected {formatDate(credit.expectedReturnDate)}{overdue && ` (${Math.abs(daysRemaining || 0)}d overdue)`}
              </Text>
            </View>
          )}
          {credit.isReturned && credit.returnedDate && (
            <View style={styles.dateRow}>
              <Ionicons name="checkmark-circle" size={13} color={colors.accent.green} />
              <Text style={[styles.dateText, { color: colors.accent.green }]}>Returned {formatDate(credit.returnedDate)}</Text>
            </View>
          )}
        </View>

        {!credit.isReturned && onMarkReturned && (
          <TouchableOpacity style={styles.markBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onMarkReturned(credit.id); }}>
            <Ionicons name="checkmark-circle" size={16} color={isDark ? colors.accent.green : '#15803D'} />
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
  cardReturned: { opacity: 0.65 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  personRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  personInfo: { marginLeft: 12, flex: 1 },
  personName: { color: colors.text.primary, fontSize: 16, fontWeight: '700' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  phone: { color: isDark ? colors.text.muted : '#64748B', fontSize: 12 },
  amountWrap: { alignItems: 'flex-end' },
  amount: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  amountPending: { color: isDark ? colors.accent.green : '#059669' },
  amountReturned: { color: isDark ? colors.text.muted : '#94A3B8' },
  strike: { textDecorationLine: 'line-through', color: isDark ? colors.text.muted : '#94A3B8' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10, alignSelf: 'flex-end' },
  
  // Purpose & Notes Container
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
    color: isDark ? colors.accent.green : '#047857',
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

  // Progress Bar Styles
  progressContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.09)' : '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent.green,
  },

  divider: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9', marginVertical: 12 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  datesCol: { gap: 5, flex: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { color: isDark ? colors.text.secondary : '#64748B', fontSize: 12, fontWeight: '500' },
  markBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: 13, 
    backgroundColor: isDark ? 'rgba(102,187,106,0.12)' : '#DCFCE7',
    borderRadius: 14, 
    borderWidth: 1,
    borderColor: isDark ? 'rgba(102,187,106,0.28)' : '#86EFAC' 
  },
  markText: { color: isDark ? colors.accent.green : '#15803D', fontSize: 12, fontWeight: '700' },

  // Action Pill Buttons (Share & Delete)
  actionButtonsRow: {
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
