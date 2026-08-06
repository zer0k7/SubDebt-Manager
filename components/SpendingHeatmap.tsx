import { useTheme } from '../hooks/useTheme';
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SpendingEntry } from '../hooks/useDailySpending';
import { useSettings } from '../context/SettingsContext';

interface SpendingHeatmapProps {
  entries: SpendingEntry[];
  currencyCode: string;
  dailyAverage: number;
  convertAmount: (amount: number, fromCurrency: string) => number;
}

export const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({
  entries,
  currencyCode,
  dailyAverage,
  convertAmount,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const { formatCurrency, formatDate } = useSettings();

  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Generate 30-day timeline data
  const heatmapData = useMemo(() => {
    const days: { date: Date; dateStr: string; amount: number; level: 'zero' | 'low' | 'med' | 'high' }[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      const dayTotal = entries
        .filter((e) => {
          const spentDate = new Date(e.spentAt).toISOString().slice(0, 10);
          return spentDate === dateStr;
        })
        .reduce((sum, e) => sum + convertAmount(e.amount, e.currency), 0);

      let level: 'zero' | 'low' | 'med' | 'high' = 'zero';
      const avg = dailyAverage > 0 ? dailyAverage : 500;

      if (dayTotal > 0) {
        if (dayTotal <= avg * 0.6) {
          level = 'low';
        } else if (dayTotal <= avg * 1.3) {
          level = 'med';
        } else {
          level = 'high';
        }
      }

      days.push({ date: d, dateStr, amount: dayTotal, level });
    }

    const greenDays = days.filter((d) => d.level === 'low').length;
    const yellowDays = days.filter((d) => d.level === 'med').length;
    const redDays = days.filter((d) => d.level === 'high').length;
    const zeroDays = days.filter((d) => d.level === 'zero').length;

    return { days, greenDays, yellowDays, redDays, zeroDays };
  }, [entries, dailyAverage, convertAmount]);

  const activeDay = selectedDayIndex !== null ? heatmapData.days[selectedDayIndex] : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="grid-outline" size={16} color={colors.accent.purple} />
          <Text style={styles.cardTitle}>30-DAY SPENDING HEATMAP</Text>
        </View>
        <Text style={styles.summarySubText}>
          {heatmapData.zeroDays} Zero Spend Days 🟢
        </Text>
      </View>

      {/* 30 Blocks Grid */}
      <View style={styles.grid}>
        {heatmapData.days.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;

          let blockBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
          let borderColor = 'transparent';

          if (day.level === 'low') {
            blockBg = 'rgba(16, 185, 129, 0.85)'; // Green
          } else if (day.level === 'med') {
            blockBg = 'rgba(245, 158, 11, 0.85)'; // Yellow
          } else if (day.level === 'high') {
            blockBg = 'rgba(239, 68, 68, 0.9)'; // Red
          }

          if (isSelected) {
            borderColor = colors.text.primary;
          }

          return (
            <TouchableOpacity
              key={day.dateStr}
              style={[
                styles.block,
                { backgroundColor: blockBg, borderColor },
                isSelected && styles.blockSelected,
              ]}
              onPress={() => {
                setSelectedDayIndex(idx);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.85}
            />
          );
        })}
      </View>

      {/* Selected Day Info Badge */}
      {activeDay ? (
        <View style={styles.tooltipBox}>
          <Text style={styles.tooltipDate}>{formatDate(activeDay.dateStr)}</Text>
          <Text style={styles.tooltipAmount}>
            {activeDay.amount > 0 ? formatCurrency(activeDay.amount, currencyCode) : 'No expenses logged'}
          </Text>
        </View>
      ) : null}

      {/* Legend Strip */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />
          <Text style={styles.legendText}>$0</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: 'rgba(16, 185, 129, 0.85)' }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: 'rgba(245, 158, 11, 0.85)' }]} />
          <Text style={styles.legendText}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: 'rgba(239, 68, 68, 0.9)' }]} />
          <Text style={styles.legendText}>High</Text>
        </View>
      </View>
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    card: {
      padding: 16,
      borderRadius: 22,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 12,
      marginBottom: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    summarySubText: {
      color: colors.accent.green,
      fontSize: 11,
      fontWeight: '700',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'center',
    },
    block: {
      width: '12%',
      aspectRatio: 1,
      borderRadius: 8,
      borderWidth: 1,
    },
    blockSelected: {
      borderWidth: 2,
    },
    tooltipBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    tooltipDate: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '600',
    },
    tooltipAmount: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingTop: 6,
      borderTopWidth: 0.5,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendSquare: {
      width: 10,
      height: 10,
      borderRadius: 3,
    },
    legendText: {
      color: colors.text.secondary,
      fontSize: 10,
      fontWeight: '600',
    },
  });
