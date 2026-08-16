import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SubscriptionIcon } from './SubscriptionIcon';
import { GlassBadge } from './GlassBadge';
import { Subscription } from '../hooks/useSubscriptions';
import { formatCurrency, formatDateRelative, getDaysRemaining, isExpired, isExpiringSoon, getProgressPercentage } from '../utils/dateHelpers';

interface SubscriptionCardProps {
  subscription: Subscription;
  onDelete?: () => void;
  onPress?: () => void;
  onRenew?: () => void;
  onToggleActive?: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onDelete,
  onPress,
  onRenew,
  onToggleActive,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const targetDate = subscription.isTrial && subscription.trialEndDate
    ? subscription.trialEndDate
    : subscription.expiryDate;

  const daysRemaining = getDaysRemaining(targetDate);
  const expired = isExpired(targetDate);
  const expiringSoon = isExpiringSoon(targetDate);
  const progress = getProgressPercentage(subscription.startDate, targetDate);

  let badgeVariant: 'active' | 'expiring' | 'expired' = 'active';
  if (expired) badgeVariant = 'expired';
  else if (expiringSoon) badgeVariant = 'expiring';

  const isPaused = !subscription.isActive || subscription.status === 'paused';
  const isTrial = subscription.isTrial || subscription.status === 'trial';

  // Compute display amount (individual share vs total)
  const displayAmount = subscription.isShared && subscription.myShareAmount
    ? subscription.myShareAmount
    : subscription.amount;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <SubscriptionIcon name={subscription.iconKey || subscription.name} size={42} />
        <View style={styles.titleBox}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{subscription.name}</Text>
            {isTrial && (
              <View style={styles.trialBadge}>
                <Ionicons name="timer-outline" size={11} color="#EA580C" />
                <Text style={styles.trialBadgeText}>Trial</Text>
              </View>
            )}
            {isPaused && (
              <View style={styles.pausedBadge}>
                <Ionicons name="pause-circle-outline" size={11} color={isDark ? '#9E9E9E' : '#64748B'} />
                <Text style={styles.pausedBadgeText}>Paused</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            {subscription.category && (
              <Text style={styles.category}>{subscription.category}</Text>
            )}
            {subscription.paymentMethod && (
              <View style={styles.paymentPill}>
                <Ionicons name="wallet-outline" size={10} color={isDark ? colors.text.muted : '#475569'} />
                <Text style={styles.paymentText}>{subscription.paymentMethod}</Text>
              </View>
            )}
            {subscription.isShared && (
              <View style={styles.sharedPill}>
                <Ionicons name="people-outline" size={10} color={colors.accent.purple || '#9333EA'} />
                <Text style={styles.sharedText}>Split {subscription.sharedWithCount || 2}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          {!isPaused && !isTrial && (
            <GlassBadge variant={badgeVariant} />
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDelete();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={16} color={colors.accent.red} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Details Row */}
      <View style={styles.details}>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>
            {formatCurrency(displayAmount, subscription.currency)}
          </Text>
          <Text style={styles.cycle}>
            /{isTrial ? 'trial' : subscription.billingCycle}
          </Text>
          {subscription.isShared && subscription.totalPlanAmount && (
            <Text style={styles.totalPlanText}>
              (Total: {formatCurrency(subscription.totalPlanAmount, subscription.currency)})
            </Text>
          )}
        </View>
        <View style={styles.datesBox}>
          <Text style={styles.dateText}>
            {isTrial
              ? (expired ? 'Trial ended' : 'Trial ends')
              : (expired ? 'Expired' : expiringSoon ? 'Due' : 'Renews')}{' '}
            {formatDateRelative(targetDate)}
          </Text>
          {!expired && daysRemaining > 0 && (
            <Text style={[styles.daysLeft, daysRemaining <= 3 && { color: colors.accent.amber, fontWeight: '700' }]}>
              {daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
            </Text>
          )}
        </View>
      </View>

      {/* Progress bar */}
      {!isPaused && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(progress, 100)}%` },
              expired && { backgroundColor: colors.accent.red },
              expiringSoon && !expired && { backgroundColor: colors.accent.amber },
              isTrial && { backgroundColor: '#F59E0B' },
            ]}
          />
        </View>
      )}

      {/* Notes / Description Section - Full multi-line visibility */}
      {subscription.description ? (
        <View style={styles.notesContainer}>
          <Ionicons name="document-text-outline" size={13} color={colors.accent.blue} style={{ marginTop: 2 }} />
          <Text style={styles.notesText}>{subscription.description}</Text>
        </View>
      ) : null}

      {/* Action Footer (Quick Renew / Pause toggle) */}
      <View style={styles.footerRow}>
        <View style={{ flex: 1 }} />
        <View style={styles.quickActionButtons}>
          {onToggleActive && (
            <TouchableOpacity
              style={styles.actionPill}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleActive();
              }}
            >
              <Ionicons
                name={isPaused ? 'play-circle-outline' : 'pause-circle-outline'}
                size={14}
                color={isPaused ? colors.accent.green : (isDark ? colors.text.muted : '#475569')}
              />
              <Text style={[styles.actionPillText, isPaused && { color: colors.accent.green }]}>
                {isPaused ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>
          )}

          {onRenew && (expiringSoon || expired || daysRemaining <= 7) && (
            <TouchableOpacity
              style={styles.renewPill}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onRenew();
              }}
            >
              <Ionicons name="refresh" size={13} color="#FFFFFF" />
              <Text style={styles.renewPillText}>Renew</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(18, 18, 28, 0.88)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    elevation: isDark ? 2 : 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.06,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleBox: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: isDark ? 'rgba(255,167,38,0.18)' : '#FFEDD5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: isDark ? 'rgba(255,167,38,0.4)' : '#FDBA74',
  },
  trialBadgeText: {
    color: isDark ? '#FFA726' : '#C2410C',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: isDark ? 'rgba(158,158,158,0.18)' : '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: isDark ? 'rgba(158,158,158,0.3)' : '#CBD5E1',
  },
  pausedBadgeText: {
    color: isDark ? '#BDBDBD' : '#475569',
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  category: {
    color: isDark ? colors.text.muted : '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  paymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
  },
  paymentText: {
    color: isDark ? colors.text.muted : '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  sharedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: isDark ? 'rgba(171,71,188,0.15)' : '#F3E8FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: isDark ? 'rgba(171,71,188,0.3)' : '#D8B4FE',
  },
  sharedText: {
    color: colors.accent.purple || '#9333EA',
    fontSize: 10,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    flex: 1,
  },
  amount: {
    color: colors.accent.blue,
    fontSize: 21,
    fontWeight: '800',
  },
  cycle: {
    color: isDark ? colors.text.muted : '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 2,
  },
  totalPlanText: {
    color: isDark ? colors.text.muted : '#64748B',
    fontSize: 11,
    marginLeft: 6,
  },
  datesBox: {
    alignItems: 'flex-end',
  },
  dateText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  daysLeft: {
    color: isDark ? colors.text.muted : '#64748B',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  progressBar: {
    height: 3.5,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
  },
  notesText: {
    color: isDark ? colors.text.secondary : '#334155',
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 2,
  },
  quickActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#CBD5E1',
  },
  actionPillText: {
    color: isDark ? colors.text.secondary : '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
  renewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: colors.accent.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  renewPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
