import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, hexToRgba } from '../hooks/useTheme';

export interface AppDatePickerProps {
  visible: boolean;
  date?: Date;
  mode?: 'date' | 'time';
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
  title?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AppDatePicker: React.FC<AppDatePickerProps> = ({
  visible,
  date = new Date(),
  mode = 'date',
  onConfirm,
  onCancel,
  minimumDate,
  maximumDate,
  title,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const initialDate = date || new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Time state for 'time' mode
  const [selectedHour, setSelectedHour] = useState<number>(initialDate.getHours() % 12 || 12);
  const [selectedMinute, setSelectedMinute] = useState<number>(initialDate.getMinutes());
  const [isAm, setIsAm] = useState<boolean>(initialDate.getHours() < 12);

  useEffect(() => {
    if (visible) {
      const d = date || new Date();
      setSelectedDate(d);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());

      const h = d.getHours();
      setSelectedHour(h % 12 || 12);
      setSelectedMinute(d.getMinutes());
      setIsAm(h < 12);
    }
  }, [visible, date]);

  const weekStartDay = useMemo(() => {
    try {
      const { storage } = require('../storage/mmkv');
      const { STORAGE_KEYS } = require('../storage/keys');
      return storage.getString(STORAGE_KEYS.WEEK_START_DAY) || 'monday';
    } catch {
      return 'monday';
    }
  }, [visible]);

  const weekdaysList = useMemo(() => {
    if (weekStartDay === 'sunday') {
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    } else if (weekStartDay === 'saturday') {
      return ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    } else {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
  }, [weekStartDay]);

  const startDayOffset = useMemo(() => {
    if (weekStartDay === 'sunday') return 0;
    if (weekStartDay === 'saturday') return 6;
    return 1; // monday
  }, [weekStartDay]);

  // Calendar Days calculation
  const calendarGrid = useMemo(() => {
    const rawFirstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const firstDayIndex = (rawFirstDay - startDayOffset + 7) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      dateObj: Date;
    }> = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const pDay = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({
        day: pDay,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        dateObj: new Date(prevYear, prevMonth, pDay),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        dateObj: new Date(viewYear, viewMonth, d),
      });
    }

    // Next month padding to complete grid
    const remaining = 42 - cells.length;
    for (let n = 1; n <= remaining; n++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({
        day: n,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        dateObj: new Date(nextYear, nextMonth, n),
      });
    }

    return cells;
  }, [viewYear, viewMonth, startDayOffset]);

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const isDateDisabled = (targetDate: Date) => {
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();

    if (minimumDate) {
      const min = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate()).getTime();
      if (target < min) return true;
    }

    if (maximumDate) {
      const max = new Date(maximumDate.getFullYear(), maximumDate.getMonth(), maximumDate.getDate()).getTime();
      if (target > max) return true;
    }

    return false;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const handleSelectPreset = (type: 'today' | 'yesterday' | '7days' | '30days' | 'endOfMonth') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const now = new Date();
    let target = new Date();

    if (type === 'yesterday') {
      target.setDate(now.getDate() - 1);
    } else if (type === '7days') {
      target.setDate(now.getDate() + 7);
    } else if (type === '30days') {
      target.setDate(now.getDate() + 30);
    } else if (type === 'endOfMonth') {
      target = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    if (!isDateDisabled(target)) {
      setSelectedDate(target);
      setViewYear(target.getFullYear());
      setViewMonth(target.getMonth());
    }
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (mode === 'time') {
      const finalDate = new Date(selectedDate);
      let hours = selectedHour % 12;
      if (!isAm) hours += 12;
      finalDate.setHours(hours, selectedMinute, 0, 0);
      onConfirm(finalDate);
    } else {
      onConfirm(selectedDate);
    }
  };

  if (!visible) return null;

  const today = new Date();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header Bar */}
          <View style={styles.header}>
            <Text style={styles.title}>{title || (mode === 'date' ? 'Select Date' : 'Select Time')}</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {mode === 'date' ? (
            <>
              {/* Month Navigation Row */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrowBtn} activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
                </TouchableOpacity>

                <View style={styles.monthTitleWrap}>
                  <Text style={styles.monthTitle}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </Text>
                </View>

                <TouchableOpacity onPress={handleNextMonth} style={styles.navArrowBtn} activeOpacity={0.7}>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Quick Presets Bar */}
              <View style={styles.presetsRow}>
                {[
                  { key: 'today', label: 'Today' },
                  { key: 'yesterday', label: 'Yesterday' },
                  { key: '7days', label: '+7 Days' },
                  { key: 'endOfMonth', label: 'End of Month' },
                ].map((p) => (
                  <TouchableOpacity
                    key={p.key}
                    style={styles.presetChip}
                    onPress={() => handleSelectPreset(p.key as any)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.presetChipText}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Weekdays Header */}
              <View style={styles.weekdaysRow}>
                {weekdaysList.map((w, idx) => (
                  <View key={`${w}-${idx}`} style={styles.weekdayCell}>
                    <Text style={styles.weekdayText}>{w}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.grid}>
                {calendarGrid.map((item, idx) => {
                  const isSelected = isSameDay(item.dateObj, selectedDate);
                  const isToday = isSameDay(item.dateObj, today);
                  const disabled = isDateDisabled(item.dateObj);

                  return (
                    <TouchableOpacity
                      key={`${item.year}-${item.month}-${item.day}-${idx}`}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        !isSelected && isToday && styles.dayCellToday,
                        disabled && styles.dayCellDisabled,
                      ]}
                      disabled={disabled}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedDate(item.dateObj);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !item.isCurrentMonth && styles.dayTextSubtle,
                          isSelected && styles.dayTextSelected,
                          disabled && styles.dayTextDisabled,
                        ]}
                      >
                        {item.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            /* Time Picker Mode UI */
            <View style={styles.timeContainer}>
              <View style={styles.timePickersRow}>
                {/* Hour */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>HOUR</Text>
                  <ScrollView style={{ height: 140 }} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[styles.timeItem, selectedHour === h && styles.timeItemSelected]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedHour(h);
                        }}
                      >
                        <Text style={[styles.timeItemText, selectedHour === h && styles.timeItemTextSelected]}>
                          {h.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Text style={styles.timeColon}>:</Text>

                {/* Minute */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>MINUTE</Text>
                  <ScrollView style={{ height: 140 }} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.timeItem, selectedMinute === m && styles.timeItemSelected]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedMinute(m);
                        }}
                      >
                        <Text style={[styles.timeItemText, selectedMinute === m && styles.timeItemTextSelected]}>
                          {m.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* AM / PM Toggle */}
                <View style={styles.ampmColumn}>
                  <Text style={styles.timeLabel}>PERIOD</Text>
                  <TouchableOpacity
                    style={[styles.ampmTile, isAm && styles.ampmTileActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsAm(true);
                    }}
                  >
                    <Text style={[styles.ampmText, isAm && styles.ampmTextActive]}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ampmTile, !isAm && styles.ampmTileActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsAm(false);
                    }}
                  >
                    <Text style={[styles.ampmText, !isAm && styles.ampmTextActive]}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Bottom Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 24,
      backgroundColor: isDark ? '#141424' : '#FFFFFF',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
      padding: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.6 : 0.25,
      shadowRadius: 24,
      elevation: 24,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      color: isDark ? '#F8FAFC' : '#0F172A',
      fontSize: 17,
      fontWeight: '800',
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    monthNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    navArrowBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    monthTitleWrap: {
      alignItems: 'center',
    },
    monthTitle: {
      color: isDark ? '#F8FAFC' : '#0F172A',
      fontSize: 16,
      fontWeight: '800',
    },

    presetsRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 12,
    },
    presetChip: {
      flex: 1,
      paddingVertical: 7,
      paddingHorizontal: 4,
      borderRadius: 10,
      backgroundColor: isDark ? '#1E1E32' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
      alignItems: 'center',
    },
    presetChipText: {
      color: isDark ? '#F1F5F9' : '#0F172A',
      fontSize: 11,
      fontWeight: '800',
    },

    weekdaysRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekdayCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 2,
    },
    weekdayText: {
      color: isDark ? '#CBD5E1' : '#334155',
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 14,
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      marginVertical: 1.5,
      backgroundColor: isDark ? '#1C1C2D' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    dayCellSelected: {
      backgroundColor: colors.accent.blue,
      borderColor: colors.accent.blue,
      shadowColor: colors.accent.blue,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.45,
      shadowRadius: 6,
      elevation: 6,
    },
    dayCellToday: {
      borderWidth: 2,
      borderColor: colors.accent.blue,
      backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.22) : 'rgba(79,195,247,0.22)',
    },
    dayCellDisabled: {
      backgroundColor: isDark ? '#141422' : '#E2E8F0',
    },
    dayText: {
      color: isDark ? '#FFFFFF' : '#0F172A',
      fontSize: 14,
      fontWeight: '800',
    },
    dayTextSubtle: {
      color: isDark ? '#64748B' : '#94A3B8',
      fontWeight: '500',
    },
    dayTextSelected: {
      color: '#ffffff',
      fontWeight: '900',
    },
    dayTextDisabled: {
      color: isDark ? '#64748B' : '#94A3B8',
      fontWeight: '500',
    },

    // Time picker
    timeContainer: {
      paddingVertical: 14,
    },
    timePickersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    timeColumn: {
      alignItems: 'center',
      width: 70,
    },
    timeLabel: {
      color: isDark ? '#94A3B8' : '#475569',
      fontSize: 10,
      fontWeight: '800',
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    timeColon: {
      color: isDark ? '#F8FAFC' : '#0F172A',
      fontSize: 24,
      fontWeight: '900',
      marginTop: 14,
    },
    timeItem: {
      height: 38,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      marginVertical: 2,
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    },
    timeItemSelected: {
      backgroundColor: colors.accent.blue,
      paddingHorizontal: 12,
    },
    timeItemText: {
      color: isDark ? '#CBD5E1' : '#334155',
      fontSize: 15,
      fontWeight: '700',
    },
    timeItemTextSelected: {
      color: '#ffffff',
      fontWeight: '900',
    },
    ampmColumn: {
      alignItems: 'center',
      gap: 6,
    },
    ampmTile: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    ampmTileActive: {
      backgroundColor: colors.accent.blue,
      borderColor: colors.accent.blue,
    },
    ampmText: {
      color: isDark ? '#CBD5E1' : '#334155',
      fontSize: 13,
      fontWeight: '800',
    },
    ampmTextActive: {
      color: '#ffffff',
    },

    // Footer Actions
    footerRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      color: isDark ? '#F1F5F9' : '#0F172A',
      fontSize: 14,
      fontWeight: '700',
    },
    confirmBtn: {
      flex: 1.4,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent.blue,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 4,
    },
    confirmBtnText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '800',
    },
  });
