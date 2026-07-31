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
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription, onDelete }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const daysRemaining = getDaysRemaining(subscription.expiryDate);
  const expired = isExpired(subscription.expiryDate);
  const expiringSoon = isExpiringSoon(subscription.expiryDate);
  const progress = getProgressPercentage(subscription.startDate, subscription.expiryDate);

  let badgeVariant: 'active' | 'expiring' | 'expired' = 'active';
  if (expired) badgeVariant = 'expired';
  else if (expiringSoon) badgeVariant = 'expiring';
  const displayStatus = !subscription.isActive ? 'expired' : badgeVariant;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <SubscriptionIcon name={subscription.name} size={40} />
        <View style={styles.titleBox}>
          <Text style={styles.name}>{subscription.name}</Text>
          {subscription.category && <Text style={styles.category}>{subscription.category}</Text>}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <GlassBadge variant={displayStatus} />
          {onDelete && (
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(); }} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <Ionicons name="trash-outline" size={17} color={colors.accent.red} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>{formatCurrency(subscription.amount, subscription.currency)}</Text>
          <Text style={styles.cycle}>/{subscription.billingCycle}</Text>
        </View>
        <View style={styles.datesBox}>
          <Text style={styles.dateText}>
            {expired ? 'Expired' : expiringSoon ? 'Expires' : 'Renews'} {formatDateRelative(subscription.expiryDate)}
          </Text>
          {!expired && daysRemaining > 0 && <Text style={styles.daysLeft}>{daysRemaining}d left</Text>}
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill, { width: `${Math.min(progress, 100)}%` },
          expired && { backgroundColor: colors.accent.red },
          expiringSoon && !expired && { backgroundColor: colors.accent.amber },
        ]} />
      </View>

      {subscription.description && <Text style={styles.desc} numberOfLines={2}>{subscription.description}</Text>}
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  titleBox: { flex: 1, marginLeft: 12 },
  name: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
  category: { color: colors.text.muted, fontSize: 11, marginTop: 2 },
  details: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline' },
  amount: { color: colors.accent.blue, fontSize: 20, fontWeight: '700' },
  cycle: { color: colors.text.muted, fontSize: 13, marginLeft: 2 },
  datesBox: { alignItems: 'flex-end' },
  dateText: { color: colors.text.secondary, fontSize: 13 },
  daysLeft: { color: colors.text.muted, fontSize: 11, marginTop: 2 },
  progressBar: { height: 3, backgroundColor: colors.glass.card, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#66BB6A', borderRadius: 2 },
  desc: { color: colors.text.muted, fontSize: 13, lineHeight: 18 },
});
