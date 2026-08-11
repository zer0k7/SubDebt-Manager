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

interface DayData {
  date: Date;
  dateStr: string;
  dayNumber: number;
  amount: number;
  entries: SpendingEntry[];
  level: 'zero' | 'low' | 'med' | 'high';
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({
  entries,
  currencyCode,
  dailyAverage,
  convertAmount,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const { formatCurrency, formatDate, weekStartDay } = useSettings();

  // Reorder weekdays according to user preference (Monday vs Sunday vs Saturday)
  const weekdays = useMemo(() => {
    if (weekStartDay === 'monday') {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
    if (weekStartDay === 'saturday') {
      return ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    }
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }, [weekStartDay]);

  // Generate 30-day timeline data (with timezone-safe YYYY-MM-DD matching)
  const heatmapData = useMemo(() => {
    const days: DayData[] = [];
    const now = new Date();

    const avg = dailyAverage > 0 ? dailyAverage : 500;

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dateNum}`;

      const dayEntries = entries.filter((e) => {
        const ed = new Date(e.spentAt);
        const ey = ed.getFullYear();
        const em = String(ed.getMonth() + 1).padStart(2, '0');
        const eday = String(ed.getDate()).padStart(2, '0');
        return `${ey}-${em}-${eday}` === dateStr;
      });

      const dayTotal = dayEntries.reduce(
        (sum, e) => sum + convertAmount(e.amount, e.currency),
        0
      );

      let level: 'zero' | 'low' | 'med' | 'high' = 'zero';
      if (dayTotal > 0) {
        if (dayTotal <= avg * 0.7) {
          level = 'low';
        } else if (dayTotal <= avg * 1.4) {
          level = 'med';
        } else {
          level = 'high';
        }
      }

      days.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        amount: dayTotal,
        entries: dayEntries,
        level,
      });
    }

    const greenDays = days.filter((d) => d.level === 'low').length;
    const yellowDays = days.filter((d) => d.level === 'med').length;
    const redDays = days.filter((d) => d.level === 'high').length;
    const zeroDays = days.filter((d) => d.level === 'zero').length;

    return { days, greenDays, yellowDays, redDays, zeroDays };
  }, [entries, dailyAverage, convertAmount]);

  // Default selected day is today (last item in array)
  const [selectedIdx, setSelectedIdx] = useState<number>(heatmapData.days.length - 1);

  const activeDay = heatmapData.days[selectedIdx] || heatmapData.days[heatmapData.days.length - 1];

  // Break 30 days into 7-column rows
  const gridRows = useMemo(() => {
    const rows: DayData[][] = [];
    for (let i = 0; i < heatmapData.days.length; i += 7) {
      rows.push(heatmapData.days.slice(i, i + 7));
    }
    return rows;
  }, [heatmapData.days]);

  return (
    <View style={styles.card}>
      {/* Header & KPI Summary */}
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="grid-outline" size={16} color={colors.accent.purple} />
          <Text style={styles.cardTitle}>30-DAY SPENDING HEATMAP</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="checkmark-circle-outline" size={13} color={colors.accent.green} />
          <Text style={styles.headerBadgeText}>{heatmapData.zeroDays} Zero-Spend Days</Text>
        </View>
      </View>

      {/* Weekday Column Labels */}
      <View style={styles.weekdayRow}>
        {weekdays.map((w) => (
          <Text key={w} style={styles.weekdayText}>
            {w}
          </Text>
        ))}
      </View>

      {/* Grid Rows */}
      <View style={styles.gridContainer}>
        {gridRows.map((row, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.gridRow}>
            {row.map((day) => {
              const globalIdx = heatmapData.days.findIndex((d) => d.dateStr === day.dateStr);
              const isSelected = selectedIdx === globalIdx;

              let bg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
              let textColor = colors.text.muted;
              let borderClr = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

              if (day.level === 'low') {
                bg = 'rgba(16, 185, 129, 0.85)';
                textColor = '#FFFFFF';
                borderClr = 'rgba(16, 185, 129, 0.9)';
              } else if (day.level === 'med') {
                bg = 'rgba(245, 158, 11, 0.9)';
                textColor = '#0F172A';
                borderClr = 'rgba(245, 158, 11, 1)';
              } else if (day.level === 'high') {
                bg = 'rgba(239, 68, 68, 0.9)';
                textColor = '#FFFFFF';
                borderClr = 'rgba(239, 68, 68, 1)';
              }

              if (isSelected) {
                borderClr = colors.accent.blue;
              }

              return (
                <TouchableOpacity
                  key={day.dateStr}
                  style={[
                    styles.dayCell,
                    { backgroundColor: bg, borderColor: borderClr },
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => {
                    setSelectedIdx(globalIdx);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayNumberText, { color: textColor }]}>
                    {day.dayNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {/* Pad remaining row slots if row has < 7 items */}
            {row.length < 7 &&
              Array.from({ length: 7 - row.length }).map((_, padIdx) => (
                <View key={`pad-${padIdx}`} style={styles.dayCellEmpty} />
              ))}
          </View>
        ))}
      </View>

      {/* Selected Day Expanded Detail Card */}
      {activeDay && (
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar-outline" size={14} color={colors.accent.purple} />
              <Text style={styles.detailDateText}>{formatDate(activeDay.dateStr)}</Text>
            </View>
            <Text style={styles.detailAmountText}>
              {activeDay.amount > 0
                ? formatCurrency(activeDay.amount, currencyCode)
                : 'No Expenses'}
            </Text>
          </View>

          {activeDay.entries.length > 0 ? (
            <View style={styles.entryList}>
              {activeDay.entries.slice(0, 3).map((e) => (
                <View key={e.id} style={styles.entryPill}>
                  <Text style={styles.entryTitle} numberOfLines={1}>
                    {e.title}
                  </Text>
                  <Text style={styles.entryVal}>
                    {formatCurrency(e.amount, e.currency)}
                  </Text>
                </View>
              ))}
              {activeDay.entries.length > 3 && (
                <Text style={styles.moreEntriesText}>
                  +{activeDay.entries.length - 3} more transaction
                  {activeDay.entries.length - 3 > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.noSpendingSub}>
              Zero spending recorded for this date 🎉
            </Text>
          )}
        </View>
      )}

      {/* Legend Bar */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />
          <Text style={styles.legendText}>$0 Zero</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: 'rgba(16, 185, 129, 0.85)' }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: 'rgba(245, 158, 11, 0.9)' }]} />
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
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cardTitle: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
    },
    headerBadgeText: {
      color: colors.accent.green,
      fontSize: 11,
      fontWeight: '700',
    },
    weekdayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
      marginBottom: 2,
    },
    weekdayText: {
      flex: 1,
      textAlign: 'center',
      color: colors.text.tertiary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    gridContainer: {
      gap: 6,
    },
    gridRow: {
      flexDirection: 'row',
      gap: 6,
    },
    dayCell: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCellSelected: {
      borderWidth: 2,
    },
    dayCellEmpty: {
      flex: 1,
      aspectRatio: 1,
    },
    dayNumberText: {
      fontSize: 12,
      fontWeight: '800',
    },
    detailCard: {
      padding: 12,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 8,
    },
    detailCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailDateText: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    detailAmountText: {
      color: colors.accent.purple,
      fontSize: 14,
      fontWeight: '800',
    },
    entryList: {
      gap: 4,
    },
    entryPill: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    entryTitle: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '600',
      flex: 1,
      marginRight: 8,
    },
    entryVal: {
      color: colors.text.primary,
      fontSize: 11,
      fontWeight: '700',
    },
    moreEntriesText: {
      color: colors.text.muted,
      fontSize: 10,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 2,
    },
    noSpendingSub: {
      color: colors.text.secondary,
      fontSize: 11,
      fontStyle: 'italic',
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendSquare: {
      width: 12,
      height: 12,
      borderRadius: 3,
    },
    legendText: {
      color: colors.text.secondary,
      fontSize: 10,
      fontWeight: '600',
    },
  });
