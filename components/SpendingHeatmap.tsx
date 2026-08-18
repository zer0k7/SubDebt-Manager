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
  isFuture: boolean;
  isToday: boolean;
}

export const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({
  entries,
  currencyCode,
  dailyAverage,
  convertAmount,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const { formatCurrency, formatDate, weekStartDay } = useSettings();

  // Navigation state for viewing different months (default = current month)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth();

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

  // Generate complete calendar grid data (1st to 28/29/30/31 of selected month)
  const monthData = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
    
    // Calculate leading offset based on weekStartDay
    let startOffset = 0;
    if (weekStartDay === 'monday') {
      startOffset = (firstDayOfWeek + 6) % 7;
    } else if (weekStartDay === 'saturday') {
      startOffset = (firstDayOfWeek + 1) % 7;
    } else {
      startOffset = firstDayOfWeek;
    }

    const avg = dailyAverage > 0 ? dailyAverage : 500;
    const days: DayData[] = [];

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(selectedYear, selectedMonth, dayNum);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dateNum}`;

      const isToday = (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );

      const isFuture = d.getTime() > new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();

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
        dayNumber: dayNum,
        amount: dayTotal,
        entries: dayEntries,
        level,
        isFuture,
        isToday,
      });
    }

    // Build 7-column calendar matrix
    const matrix: (DayData | null)[][] = [];
    let currentRow: (DayData | null)[] = [];

    // Add empty leading slots
    for (let i = 0; i < startOffset; i++) {
      currentRow.push(null);
    }

    days.forEach((day) => {
      currentRow.push(day);
      if (currentRow.length === 7) {
        matrix.push(currentRow);
        currentRow = [];
      }
    });

    // Add empty trailing slots
    if (currentRow.length > 0) {
      while (currentRow.length < 7) {
        currentRow.push(null);
      }
      matrix.push(currentRow);
    }

    const pastDays = days.filter((d) => !d.isFuture);
    const zeroDays = pastDays.filter((d) => d.level === 'zero').length;
    const lowDays = pastDays.filter((d) => d.level === 'low').length;
    const medDays = pastDays.filter((d) => d.level === 'med').length;
    const highDays = pastDays.filter((d) => d.level === 'high').length;
    const totalMonthSpent = days.reduce((sum, d) => sum + d.amount, 0);

    return {
      days,
      matrix,
      zeroDays,
      lowDays,
      medDays,
      highDays,
      totalMonthSpent,
    };
  }, [selectedYear, selectedMonth, weekStartDay, entries, dailyAverage, convertAmount]);

  // Selected day index (default to today or 1st day of month)
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(() => {
    const now = new Date();
    return now.getDate();
  });

  const activeDay = useMemo(() => {
    return monthData.days.find((d) => d.dayNumber === selectedDayNumber) || monthData.days[0];
  }, [monthData.days, selectedDayNumber]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(selectedYear, selectedMonth - 1, 1));
    setSelectedDayNumber(1);
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(selectedYear, selectedMonth + 1, 1));
    setSelectedDayNumber(1);
  };

  const monthTitle = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.card}>
      {/* Header with Month Navigation & KPI Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={handlePrevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.monthTitleText}>{monthTitle.toUpperCase()}</Text>
          <TouchableOpacity onPress={handleNextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerBadge}>
          <Ionicons name="checkmark-circle-outline" size={12} color={colors.accent.green} />
          <Text style={styles.headerBadgeText}>{monthData.zeroDays} No-Spend Days</Text>
        </View>
      </View>

      {/* Weekday Column Headers */}
      <View style={styles.weekdayRow}>
        {weekdays.map((w) => (
          <Text key={w} style={styles.weekdayText}>
            {w}
          </Text>
        ))}
      </View>

      {/* Compact 7-Column Calendar Heatmap Grid */}
      <View style={styles.gridContainer}>
        {monthData.matrix.map((row, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.gridRow}>
            {row.map((day, cIdx) => {
              if (!day) {
                return <View key={`empty-${rIdx}-${cIdx}`} style={styles.dayCellEmpty} />;
              }

              const isSelected = activeDay?.dateStr === day.dateStr;

              let bg = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
              let textColor = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)';
              let borderClr = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

              if (day.isFuture) {
                bg = 'transparent';
                textColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
                borderClr = 'transparent';
              } else if (day.level === 'low') {
                bg = 'rgba(16, 185, 129, 0.85)';
                textColor = '#FFFFFF';
                borderClr = 'rgba(16, 185, 129, 0.9)';
              } else if (day.level === 'med') {
                bg = 'rgba(245, 158, 11, 0.9)';
                textColor = '#FFFFFF';
                borderClr = 'rgba(245, 158, 11, 1)';
              } else if (day.level === 'high') {
                bg = 'rgba(239, 68, 68, 0.9)';
                textColor = '#FFFFFF';
                borderClr = 'rgba(239, 68, 68, 1)';
              }

              if (day.isToday) {
                if (day.level === 'zero') {
                  bg = isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.12)';
                  textColor = colors.accent.blue;
                }
                borderClr = colors.accent.blue;
              }

              return (
                <TouchableOpacity
                  key={day.dateStr}
                  style={[
                    styles.dayCell,
                    { backgroundColor: bg, borderColor: isSelected ? colors.accent.blue : borderClr },
                    day.isToday && styles.dayCellToday,
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => {
                    setSelectedDayNumber(day.dayNumber);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNumberText,
                      { color: textColor },
                      day.isToday && styles.dayNumberToday,
                      isSelected && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                  >
                    {day.dayNumber}
                  </Text>
                  {day.isToday && (
                    <View
                      style={[
                        styles.todayDot,
                        { backgroundColor: isSelected ? '#FFFFFF' : colors.accent.blue },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Selected Day Expanded Detail Inspector */}
      {activeDay && (
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar-outline" size={13} color={colors.accent.blue} />
              <Text style={styles.detailDateText}>{formatDate(activeDay.dateStr)}</Text>
              {activeDay.isToday && (
                <View style={styles.todayPill}>
                  <Text style={styles.todayPillText}>Today</Text>
                </View>
              )}
            </View>
            <Text style={[styles.detailAmountText, { color: activeDay.amount > 0 ? colors.accent.blue : colors.accent.green }]}>
              {activeDay.amount > 0
                ? formatCurrency(activeDay.amount, currencyCode)
                : 'Zero Spend'}
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
              {activeDay.isFuture ? 'Future date' : 'No expenses recorded for this day 🎉'}
            </Text>
          )}
        </View>
      )}

      {/* Compact Legend Bar */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />
          <Text style={styles.legendText}>{formatCurrency(0, currencyCode)} Zero</Text>
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
      padding: 14,
      borderRadius: 20,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 10,
      marginBottom: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    navBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    monthTitleText: {
      color: colors.text.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
    },
    headerBadgeText: {
      color: colors.accent.green,
      fontSize: 10,
      fontWeight: '700',
    },
    weekdayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    weekdayText: {
      flex: 1,
      textAlign: 'center',
      color: colors.text.muted,
      fontSize: 9,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    gridContainer: {
      gap: 4,
    },
    gridRow: {
      flexDirection: 'row',
      gap: 4,
    },
    dayCell: {
      flex: 1,
      height: 32,
      borderRadius: 7,
      borderWidth: 0.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCellToday: {
      borderWidth: 1.8,
      borderColor: colors.accent.blue,
      shadowColor: colors.accent.blue,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 3,
      elevation: 2,
    },
    dayCellSelected: {
      borderWidth: 2,
      borderColor: colors.accent.blue,
      transform: [{ scale: 1.05 }],
      shadowColor: colors.accent.blue,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.5,
      shadowRadius: 3,
      elevation: 3,
    },
    dayCellEmpty: {
      flex: 1,
      height: 32,
    },
    dayNumberText: {
      fontSize: 10,
      fontWeight: '700',
    },
    dayNumberToday: {
      fontWeight: '900',
      fontSize: 10.5,
    },
    todayDot: {
      position: 'absolute',
      bottom: 2.5,
      width: 4,
      height: 4,
      borderRadius: 2,
    },
    detailCard: {
      padding: 10,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 6,
      marginTop: 2,
    },
    detailCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailDateText: {
      color: colors.text.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    todayPill: {
      backgroundColor: 'rgba(79, 195, 247, 0.15)',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    todayPillText: {
      color: colors.accent.blue,
      fontSize: 9,
      fontWeight: '700',
    },
    detailAmountText: {
      fontSize: 13,
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
      paddingVertical: 3,
      borderRadius: 6,
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
      fontSize: 9,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 1,
    },
    noSpendingSub: {
      color: colors.text.muted,
      fontSize: 11,
      fontStyle: 'italic',
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
      gap: 4,
    },
    legendSquare: {
      width: 10,
      height: 10,
      borderRadius: 2.5,
    },
    legendText: {
      color: colors.text.muted,
      fontSize: 9,
      fontWeight: '600',
    },
  });
