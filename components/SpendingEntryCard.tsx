import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SpendingEntry } from '../hooks/useDailySpending';
import { formatCurrency, formatDate } from '../utils/dateHelpers';

interface SpendingEntryCardProps {
  entry: SpendingEntry;
  onPress?: (id: string) => void;
  onDelete?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Food: 'restaurant-outline',
  Groceries: 'cart-outline',
  Travel: 'bus-outline',
  Shopping: 'bag-outline',
  Bills: 'receipt-outline',
  Recharge: 'flash-outline',
  Study: 'book-outline',
  Health: 'medkit-outline',
  'Personal Care': 'color-wand-outline',
  Home: 'home-outline',
  Entertainment: 'film-outline',
  Gifts: 'gift-outline',
  Other: 'ellipsis-horizontal-outline',
};

export const SpendingEntryCard: React.FC<SpendingEntryCardProps> = ({ entry, onPress, onDelete }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const icon = CATEGORY_ICONS[entry.category] || CATEGORY_ICONS.Other;

  return (
    <TouchableOpacity onPress={() => onPress?.(entry.id)} activeOpacity={0.85} style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon as any} size={22} color={colors.accent.purple} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{entry.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>{entry.category} • {formatDate(entry.spentAt)}</Text>
        {entry.notes && <Text style={styles.notes} numberOfLines={1}>{entry.notes}</Text>}
      </View>
      <View style={styles.amountWrap}>
        <Text style={styles.amount}>{formatCurrency(entry.amount, entry.currency)}</Text>
        {onDelete && (
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(); }} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <Ionicons name="trash-outline" size={17} color={colors.accent.red} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1, marginRight: 10 },
  title: { color: colors.text.primary, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.text.secondary, fontSize: 12, marginTop: 3 },
  notes: { color: colors.text.muted, fontSize: 12, marginTop: 3, fontStyle: 'italic' },
  amountWrap: { alignItems: 'flex-end', gap: 8 },
  amount: { color: colors.accent.purple, fontSize: 17, fontWeight: '800' },
});
