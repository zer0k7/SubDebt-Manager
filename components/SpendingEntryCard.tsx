import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SpendingEntry } from '../hooks/useDailySpending';
import { formatCurrency, formatDate } from '../utils/dateHelpers';

import { getCategoryIcon, getCategoryColor } from '../constants/categories';

import { useSettings } from '../context/SettingsContext';

interface SpendingEntryCardProps {
  entry: SpendingEntry;
  onPress?: (id: string) => void;
  onDelete?: () => void;
}

export const SpendingEntryCard: React.FC<SpendingEntryCardProps> = ({ entry, onPress, onDelete }) => {
  const { colors } = useTheme();
  const { cardDensityMode, formatCurrency, formatDate } = useSettings();
  const isCompact = cardDensityMode === 'compact';

  const styles = getStyles(colors, isCompact);
  const icon = getCategoryIcon(entry.category);
  const color = getCategoryColor(entry.category);

  return (
    <TouchableOpacity onPress={() => onPress?.(entry.id)} activeOpacity={0.85} style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}18`, borderColor: `${color}35` }]}>
        <Ionicons name={icon as any} size={isCompact ? 16 : 22} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{entry.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>{entry.category} • {formatDate(entry.spentAt)}</Text>
        {!isCompact && entry.notes && <Text style={styles.notes} numberOfLines={1}>{entry.notes}</Text>}
      </View>
      <View style={styles.amountWrap}>
        <Text style={[styles.amount, { color }]}>{formatCurrency(entry.amount, entry.currency)}</Text>
        {onDelete && (
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(); }} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <Ionicons name="trash-outline" size={isCompact ? 14 : 17} color={colors.accent.red} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (colors: any, isCompact: boolean = false) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: isCompact ? 6 : 12,
    padding: isCompact ? 9 : 14,
    borderRadius: isCompact ? 14 : 18,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  iconWrap: {
    width: isCompact ? 34 : 44,
    height: isCompact ? 34 : 44,
    borderRadius: isCompact ? 17 : 22,
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isCompact ? 10 : 12,
  },
  info: { flex: 1, marginRight: 10 },
  title: { color: colors.text.primary, fontSize: isCompact ? 14 : 15, fontWeight: '700' },
  meta: { color: colors.text.secondary, fontSize: isCompact ? 11 : 12, marginTop: isCompact ? 1 : 3 },
  notes: { color: colors.text.muted, fontSize: 12, marginTop: 3, fontStyle: 'italic' },
  amountWrap: { alignItems: 'flex-end', gap: isCompact ? 4 : 8 },
  amount: { color: colors.accent.purple, fontSize: isCompact ? 15 : 17, fontWeight: '800' },
});
