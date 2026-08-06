import { useTheme } from '../../hooks/useTheme';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '../../components/AmbientBackground';
import { useDailySpending } from '../../hooks/useDailySpending';
import { useDebts } from '../../hooks/useDebts';
import { useCredits } from '../../hooks/useCredits';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { useCurrency } from '../../hooks/useCurrency';
import { useSettings } from '../../context/SettingsContext';

interface DayEventSummary {
  spendingTotal: number;
  spendingCount: number;
  subsDue: any[];
  debtsDue: any[];
  creditsDue: any[];
}

export default function FinancialCalendarModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const { entries } = useDailySpending();
  const { debts } = useDebts();
  const { credits } = useCredits();
  const { subscriptions } = useSubscriptions();
  const { currencyCode } = useCurrency();
  const { formatCurrency, weekStartDay } = useSettings();

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // Weekday Headers based on weekStartDay
  const weekdaysList = useMemo(() => {
    if (weekStartDay === 'sunday') return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (weekStartDay === 'saturday') return ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }, [weekStartDay]);

  const startDayOffset = useMemo(() => {
    if (weekStartDay === 'sunday') return 0;
    if (weekStartDay === 'saturday') return 6;
    return 1;
  }, [weekStartDay]);

  // Aggregate All Events Map for the Current Month
  const eventsMap = useMemo(() => {
    const map: Record<number, DayEventSummary> = {};

    // 1. Spending Entries
    entries.forEach((e) => {
      const d = new Date(e.spentAt);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const dayNum = d.getDate();
        if (!map[dayNum]) {
          map[dayNum] = { spendingTotal: 0, spendingCount: 0, subsDue: [], debtsDue: [], creditsDue: [] };
        }
        map[dayNum].spendingTotal += e.amount;
        map[dayNum].spendingCount += 1;
      }
    });

    // 2. Subscriptions Due
    subscriptions.forEach((s) => {
      if (!s.isActive || !s.expiryDate) return;
      const d = new Date(s.expiryDate);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const dayNum = d.getDate();
        if (!map[dayNum]) {
          map[dayNum] = { spendingTotal: 0, spendingCount: 0, subsDue: [], debtsDue: [], creditsDue: [] };
        }
        map[dayNum].subsDue.push(s);
      }
    });

    // 3. Debts Due
    debts.forEach((d) => {
      if (d.isPaid || !d.dueDate) return;
      const dateObj = new Date(d.dueDate);
      if (dateObj.getFullYear() === currentYear && dateObj.getMonth() === currentMonth) {
        const dayNum = dateObj.getDate();
        if (!map[dayNum]) {
          map[dayNum] = { spendingTotal: 0, spendingCount: 0, subsDue: [], debtsDue: [], creditsDue: [] };
        }
        map[dayNum].debtsDue.push(d);
      }
    });

    // 4. Credits Expected
    credits.forEach((c) => {
      if (c.isReturned || !c.expectedReturnDate) return;
      const dateObj = new Date(c.expectedReturnDate);
      if (dateObj.getFullYear() === currentYear && dateObj.getMonth() === currentMonth) {
        const dayNum = dateObj.getDate();
        if (!map[dayNum]) {
          map[dayNum] = { spendingTotal: 0, spendingCount: 0, subsDue: [], debtsDue: [], creditsDue: [] };
        }
        map[dayNum].creditsDue.push(c);
      }
    });

    return map;
  }, [entries, debts, credits, subscriptions, currentYear, currentMonth]);

  // Calendar Grid Calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const rawFirstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const firstDayIndex = (rawFirstDayIndex - startDayOffset + 7) % 7;

  const totalGridCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const activeDayEvents = eventsMap[selectedDay] || {
    spendingTotal: 0,
    spendingCount: 0,
    subsDue: [],
    debtsDue: [],
    creditsDue: [],
  };

  // Selected Day Transactions List
  const dayTransactions = useMemo(() => {
    return entries.filter((e) => {
      const d = new Date(e.spentAt);
      return (
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth &&
        d.getDate() === selectedDay
      );
    });
  }, [entries, currentYear, currentMonth, selectedDay]);

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FINANCIAL CALENDAR</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Month Navigation */}
        <View style={styles.card}>
          <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.monthNavTitle}>{monthLabel}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {weekdaysList.map((wd) => (
              <Text key={wd} style={styles.weekdayText}>
                {wd}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.grid}>
            {Array.from({ length: totalGridCells }).map((_, idx) => {
              const dayNum = idx - firstDayIndex + 1;
              const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
              const isToday =
                isValidDay &&
                dayNum === new Date().getDate() &&
                currentMonth === new Date().getMonth() &&
                currentYear === new Date().getFullYear();
              const isSelected = isValidDay && dayNum === selectedDay;

              const ev = isValidDay ? eventsMap[dayNum] : null;
              const hasSpend = ev && ev.spendingTotal > 0;
              const hasSubs = ev && ev.subsDue.length > 0;
              const hasDebts = ev && ev.debtsDue.length > 0;
              const hasCredits = ev && ev.creditsDue.length > 0;

              return (
                <TouchableOpacity
                  key={idx}
                  disabled={!isValidDay}
                  style={[
                    styles.cell,
                    !isValidDay && styles.cellDisabled,
                    isSelected && styles.cellSelected,
                    isToday && !isSelected && styles.cellToday,
                  ]}
                  onPress={() => {
                    if (isValidDay) {
                      setSelectedDay(dayNum);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  {isValidDay && (
                    <>
                      <Text
                        style={[
                          styles.dayNumText,
                          isSelected && styles.dayNumTextSelected,
                          isToday && !isSelected && styles.dayNumTextToday,
                        ]}
                      >
                        {dayNum}
                      </Text>

                      {/* Indicator Dots Row */}
                      <View style={styles.dotsRow}>
                        {hasSpend && <View style={[styles.dot, { backgroundColor: colors.accent.blue }]} />}
                        {hasSubs && <View style={[styles.dot, { backgroundColor: colors.accent.purple }]} />}
                        {hasDebts && <View style={[styles.dot, { backgroundColor: colors.accent.red }]} />}
                        {hasCredits && <View style={[styles.dot, { backgroundColor: colors.accent.green }]} />}
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend Strip */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent.blue }]} />
              <Text style={styles.legendLabel}>Spending</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent.purple }]} />
              <Text style={styles.legendLabel}>Subs</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent.red }]} />
              <Text style={styles.legendLabel}>Debt Due</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent.green }]} />
              <Text style={styles.legendLabel}>Credit</Text>
            </View>
          </View>
        </View>

        {/* Selected Day Event Agenda Panel */}
        <View style={styles.card}>
          <Text style={styles.agendaSectionTitle}>
            AGENDA · {new Date(currentYear, currentMonth, selectedDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>

          {/* 1. Spending Summary for Day */}
          {activeDayEvents.spendingTotal > 0 && (
            <View style={styles.agendaBox}>
              <View style={styles.agendaHeader}>
                <Ionicons name="card-outline" size={18} color={colors.accent.blue} />
                <Text style={styles.agendaTitle}>Daily Spending</Text>
                <Text style={styles.agendaTotal}>{formatCurrency(activeDayEvents.spendingTotal, currencyCode)}</Text>
              </View>
              {dayTransactions.map((t) => (
                <View key={t.id} style={styles.agendaRow}>
                  <Text style={styles.agendaRowTitle}>{t.title}</Text>
                  <Text style={styles.agendaRowVal}>{formatCurrency(t.amount, t.currency)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 2. Subscriptions Due */}
          {activeDayEvents.subsDue.map((s) => (
            <View key={s.id} style={[styles.agendaBox, { borderColor: 'rgba(124, 58, 237, 0.3)' }]}>
              <View style={styles.agendaHeader}>
                <Ionicons name="refresh-circle-outline" size={18} color={colors.accent.purple} />
                <Text style={styles.agendaTitle}>Subscription Renewal: {s.name}</Text>
                <Text style={[styles.agendaTotal, { color: colors.accent.purple }]}>
                  {formatCurrency(s.amount, s.currency)}
                </Text>
              </View>
            </View>
          ))}

          {/* 3. Debts Due */}
          {activeDayEvents.debtsDue.map((d) => (
            <View key={d.id} style={[styles.agendaBox, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <View style={styles.agendaHeader}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.accent.red} />
                <Text style={styles.agendaTitle}>Debt Payment Due: {d.personName}</Text>
                <Text style={[styles.agendaTotal, { color: colors.accent.red }]}>
                  {formatCurrency(d.amount, d.currency)}
                </Text>
              </View>
            </View>
          ))}

          {/* 4. Credits Expected */}
          {activeDayEvents.creditsDue.map((c) => (
            <View key={c.id} style={[styles.agendaBox, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
              <View style={styles.agendaHeader}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent.green} />
                <Text style={styles.agendaTitle}>Credit Return Expected: {c.personName}</Text>
                <Text style={[styles.agendaTotal, { color: colors.accent.green }]}>
                  {formatCurrency(c.amount, c.currency)}
                </Text>
              </View>
            </View>
          ))}

          {activeDayEvents.spendingTotal === 0 &&
            activeDayEvents.subsDue.length === 0 &&
            activeDayEvents.debtsDue.length === 0 &&
            activeDayEvents.creditsDue.length === 0 && (
              <View style={styles.emptyAgenda}>
                <Ionicons name="calendar-clear-outline" size={24} color={colors.text.muted} />
                <Text style={styles.emptyAgendaText}>No financial events recorded for this date.</Text>
              </View>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.glass.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    headerTitle: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    content: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
    card: {
      padding: 18,
      borderRadius: 22,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 14,
    },
    monthNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 8,
    },
    navBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthNavTitle: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '800',
    },
    weekdayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    weekdayText: {
      width: '14.28%',
      textAlign: 'center',
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '700',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      width: '14.28%',
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      marginVertical: 2,
    },
    cellDisabled: { opacity: 0.2 },
    cellToday: {
      borderWidth: 1,
      borderColor: colors.accent.purple,
    },
    cellSelected: {
      backgroundColor: colors.accent.purple,
    },
    dayNumText: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    dayNumTextToday: { color: colors.accent.purple, fontWeight: '800' },
    dayNumTextSelected: { color: '#FFFFFF', fontWeight: '800' },
    dotsRow: {
      flexDirection: 'row',
      gap: 3,
      marginTop: 3,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 0.5,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendLabel: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '600',
    },
    agendaSectionTitle: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    agendaBox: {
      padding: 12,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      gap: 8,
    },
    agendaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    agendaTitle: {
      flex: 1,
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    agendaTotal: {
      color: colors.accent.blue,
      fontSize: 14,
      fontWeight: '800',
    },
    agendaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 4,
    },
    agendaRowTitle: {
      color: colors.text.secondary,
      fontSize: 12,
    },
    agendaRowVal: {
      color: colors.text.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    emptyAgenda: {
      alignItems: 'center',
      paddingVertical: 16,
      gap: 6,
    },
    emptyAgendaText: {
      color: colors.text.muted,
      fontSize: 12,
      fontStyle: 'italic',
    },
  });
