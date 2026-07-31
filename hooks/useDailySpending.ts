import { useState, useCallback, useEffect } from 'react';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import * as Crypto from 'expo-crypto';
import { rescheduleDailyReminder, checkAndTriggerBudgetAlerts } from '../utils/notificationHelpers';

export type ConvertFn = (amount: number, fromCurrency: string) => number;

export interface SpendingEntry {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  spentAt: string;
  notes?: string;
  createdAt: string;
}

export interface SpendingInput {
  title: string;
  amount: number;
  currency: string;
  category: string;
  spentAt: string;
  notes?: string;
}

export interface WeeklyDayData {
  dayLabel: string;
  date: string;
  total: number;
  isToday: boolean;
  hasEntries: boolean;
}

export interface MonthlyDayData {
  dayLabel: string;
  date: string;
  total: number;
  isToday: boolean;
  hasEntries: boolean;
}

export interface YearlyMonthData {
  monthLabel: string;
  month: number;
  year: number;
  total: number;
  isCurrent: boolean;
  hasEntries: boolean;
}

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

/**
 * Creates a YYYY-MM-DD key from a Date using LOCAL time parts.
 * This avoids timezone drift when comparing dates.
 */
const getDayKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses a spentAt ISO string into a local-date-only YYYY-MM-DD key.
 * Handles both full ISO (2026-05-05T18:30:00.000Z) and date-only (2026-05-05) strings.
 */
const getEntryDayKey = (spentAt: string): string => {
  const d = new Date(spentAt);
  return getDayKey(d);
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getRangeStartDate = (range: TimeRange): Date | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  switch (range) {
    case '7d':
      return addDays(today, -6);
    case '30d':
      return addDays(today, -29);
    case '90d':
      return addDays(today, -89);
    case '1y': {
      const d = new Date(today);
      d.setFullYear(d.getFullYear() - 1);
      d.setDate(d.getDate() + 1);
      return d;
    }
    case 'all':
      return null;
    default:
      return addDays(today, -6);
  }
};

export const useDailySpending = () => {
  const [entries, setEntries] = useState<SpendingEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const raw = await storage.getString(STORAGE_KEYS.DAILY_SPENDING);
      if (raw) {
        const parsed = JSON.parse(raw);
        const list: SpendingEntry[] = Array.isArray(parsed) ? parsed : [];
        // Sort by spentAt descending (newest first) for consistent display
        list.sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime());
        setEntries(list);
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const saveEntries = useCallback((entryList: SpendingEntry[]) => {
    // Always keep sorted by spentAt descending
    const sorted = [...entryList].sort(
      (a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime()
    );
    storage.set(STORAGE_KEYS.DAILY_SPENDING, JSON.stringify(sorted));
    setEntries(sorted);
    rescheduleDailyReminder().catch(() => {});
    checkAndTriggerBudgetAlerts().catch(() => {});
  }, []);

  const addEntry = useCallback((input: SpendingInput) => {
    const newEntry: SpendingEntry = {
      ...input,
      id: Crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    saveEntries(updated);
    return newEntry;
  }, [entries, saveEntries]);

  const updateEntry = useCallback((id: string, updates: Partial<SpendingInput>) => {
    const updated = entries.map((entry) =>
      entry.id === id ? { ...entry, ...updates } : entry
    );
    saveEntries(updated);
  }, [entries, saveEntries]);

  const deleteEntry = useCallback((id: string) => {
    const updated = entries.filter((entry) => entry.id !== id);
    saveEntries(updated);
  }, [entries, saveEntries]);

  const getEntryById = useCallback((id: string) => {
    return entries.find((entry) => entry.id === id);
  }, [entries]);

  const getEntriesForDay = useCallback((date: Date) => {
    const key = getDayKey(date);
    return entries.filter((entry) => getEntryDayKey(entry.spentAt) === key);
  }, [entries]);

  const getEntriesForRange = useCallback((range: TimeRange) => {
    const startDate = getRangeStartDate(range);
    if (!startDate) return entries; // 'all'
    const startKey = getDayKey(startDate);
    return entries.filter((entry) => getEntryDayKey(entry.spentAt) >= startKey);
  }, [entries]);

  const getTotalForDay = useCallback((date: Date, convertFn?: ConvertFn) => {
    return getEntriesForDay(date).reduce((total, entry) => total + (convertFn ? convertFn(entry.amount, entry.currency) : entry.amount), 0);
  }, [getEntriesForDay]);

  const getTotalForWeek = useCallback((convertFn?: ConvertFn) => {
    const today = new Date();
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const day = addDays(today, -i);
      total += getEntriesForDay(day).reduce((sum, e) => sum + (convertFn ? convertFn(e.amount, e.currency) : e.amount), 0);
    }
    return total;
  }, [getEntriesForDay]);

  const getTotalForMonth = useCallback((date: Date, convertFn?: ConvertFn) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return entries
      .filter((entry) => {
        const spent = new Date(entry.spentAt);
        return spent.getMonth() === month && spent.getFullYear() === year;
      })
      .reduce((total, entry) => total + (convertFn ? convertFn(entry.amount, entry.currency) : entry.amount), 0);
  }, [entries]);

  const getTotalForYear = useCallback((date: Date, convertFn?: ConvertFn) => {
    const year = date.getFullYear();
    return entries
      .filter((entry) => new Date(entry.spentAt).getFullYear() === year)
      .reduce((total, entry) => total + (convertFn ? convertFn(entry.amount, entry.currency) : entry.amount), 0);
  }, [entries]);

  const getTotalForRange = useCallback((range: TimeRange, convertFn?: ConvertFn) => {
    return getEntriesForRange(range).reduce((total, entry) => total + (convertFn ? convertFn(entry.amount, entry.currency) : entry.amount), 0);
  }, [getEntriesForRange]);

  const getDailyAverage = useCallback((range?: TimeRange, convertFn?: ConvertFn) => {
    const filtered = range ? getEntriesForRange(range) : entries;
    if (filtered.length === 0) return 0;
    const dayKeys = new Set(filtered.map((e) => getEntryDayKey(e.spentAt)));
    const totalDays = dayKeys.size;
    if (totalDays === 0) return 0;
    const totalAmount = filtered.reduce((sum, e) => sum + (convertFn ? convertFn(e.amount, e.currency) : e.amount), 0);
    return Math.round((totalAmount / totalDays) * 100) / 100;
  }, [entries, getEntriesForRange]);

  const getNoSpendDaysThisMonth = useCallback(() => {
    if (entries.length === 0) return 0;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const earliestDate = new Date(
      Math.min(...entries.map((e) => new Date(e.spentAt).getTime()))
    );

    let trackingDaysThisMonth = 0;

    if (
      earliestDate.getFullYear() < year ||
      (earliestDate.getFullYear() === year && earliestDate.getMonth() < month)
    ) {
      trackingDaysThisMonth = today.getDate();
    } else {
      trackingDaysThisMonth = today.getDate() - earliestDate.getDate() + 1;
    }

    const spendingDayKeysThisMonth = new Set(
      entries
        .filter((e) => {
          const d = new Date(e.spentAt);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .map((e) => getEntryDayKey(e.spentAt))
    );

    return Math.max(0, trackingDaysThisMonth - spendingDayKeysThisMonth.size);
  }, [entries]);

  const getNoSpendDaysTotal = useCallback(() => {
    if (entries.length === 0) return 0;

    const earliestDate = new Date(
      Math.min(...entries.map(e => new Date(e.spentAt).getTime()))
    );
    const today = new Date();

    const diffTime = Math.abs(today.getTime() - earliestDate.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const allSpendingDayKeys = new Set(entries.map(e => getEntryDayKey(e.spentAt)));

    return Math.max(0, totalDays - allSpendingDayKeys.size);
  }, [entries]);

  const getSavingMessage = useCallback(() => {
    const noSpendDays = getNoSpendDaysThisMonth();
    if (noSpendDays === 0) return "Tracked every day. Try a no-spend day! 💡";
    if (noSpendDays < 3) return `${noSpendDays} no-spend days. Good start! 🌱`;
    if (noSpendDays < 7) return `${noSpendDays} no-spend days! Great saving habits 📈`;
    if (noSpendDays < 15) return `${noSpendDays} no-spend days! Incredible discipline! 💰`;
    return `${noSpendDays} no-spend days! Financial Zen! 🧘‍♂️`;
  }, [getNoSpendDaysThisMonth]);

  const getWeeklyData = useCallback((convertFn?: ConvertFn): WeeklyDayData[] => {
    const today = new Date();
    const result: WeeklyDayData[] = [];

    for (let i = 6; i >= 0; i--) {
      const day = addDays(today, -i);
      const dayEntries = getEntriesForDay(day);
      const total = dayEntries.reduce((sum, e) => sum + (convertFn ? convertFn(e.amount, e.currency) : e.amount), 0);
      result.push({
        dayLabel: DAY_LABELS[day.getDay()],
        date: getDayKey(day),
        total,
        isToday: i === 0,
        hasEntries: dayEntries.length > 0,
      });
    }

    return result;
  }, [getEntriesForDay]);

  /**
   * Get daily data for last N days — used for 30d/90d charts
   */
  const getDailyData = useCallback((days: number, convertFn?: ConvertFn): MonthlyDayData[] => {
    const today = new Date();
    const result: MonthlyDayData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = addDays(today, -i);
      const dayEntries = getEntriesForDay(day);
      const total = dayEntries.reduce((sum, e) => sum + (convertFn ? convertFn(e.amount, e.currency) : e.amount), 0);
      const dayNum = day.getDate();
      const monthLabel = MONTH_LABELS[day.getMonth()];
      result.push({
        dayLabel: dayNum === 1 ? `${monthLabel} ${dayNum}` : `${dayNum}`,
        date: getDayKey(day),
        total,
        isToday: i === 0,
        hasEntries: dayEntries.length > 0,
      });
    }

    return result;
  }, [getEntriesForDay]);

  /**
   * Get monthly totals for the last 12 months — used for yearly chart
   */
  const getYearlyMonthlyData = useCallback((convertFn?: ConvertFn): YearlyMonthData[] => {
    const today = new Date();
    const result: YearlyMonthData[] = [];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    for (let i = 11; i >= 0; i--) {
      let month = currentMonth - i;
      let year = currentYear;
      while (month < 0) {
        month += 12;
        year -= 1;
      }

      const monthEntries = entries.filter((entry) => {
        const spent = new Date(entry.spentAt);
        return spent.getMonth() === month && spent.getFullYear() === year;
      });
      const total = monthEntries.reduce((sum, e) => sum + (convertFn ? convertFn(e.amount, e.currency) : e.amount), 0);

      result.push({
        monthLabel: MONTH_LABELS[month],
        month,
        year,
        total,
        isCurrent: i === 0,
        hasEntries: monthEntries.length > 0,
      });
    }

    return result;
  }, [entries]);

  const getCategoryTotals = useCallback((range?: TimeRange, convertFn?: ConvertFn) => {
    const filtered = range ? getEntriesForRange(range) : entries;
    const totals = new Map<string, number>();
    filtered.forEach((entry) => {
      totals.set(entry.category, (totals.get(entry.category) || 0) + (convertFn ? convertFn(entry.amount, entry.currency) : entry.amount));
    });
    return Array.from(totals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [entries, getEntriesForRange]);

  /**
   * Get comparison stats vs previous period
   */
  const getComparisonStats = useCallback((range: TimeRange, convertFn?: ConvertFn) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let currentStart: Date;
    let previousStart: Date;
    let previousEnd: Date;

    switch (range) {
      case '7d':
        currentStart = addDays(now, -6);
        previousEnd = addDays(currentStart, -1);
        previousStart = addDays(previousEnd, -6);
        break;
      case '30d':
        currentStart = addDays(now, -29);
        previousEnd = addDays(currentStart, -1);
        previousStart = addDays(previousEnd, -29);
        break;
      case '90d':
        currentStart = addDays(now, -89);
        previousEnd = addDays(currentStart, -1);
        previousStart = addDays(previousEnd, -89);
        break;
      case '1y': {
        currentStart = new Date(now);
        currentStart.setFullYear(currentStart.getFullYear() - 1);
        currentStart.setDate(currentStart.getDate() + 1);
        previousEnd = addDays(currentStart, -1);
        previousStart = new Date(previousEnd);
        previousStart.setFullYear(previousStart.getFullYear() - 1);
        break;
      }
      default:
        return { currentTotal: 0, previousTotal: 0, changePercent: 0 };
    }

    const currentKey = getDayKey(currentStart);
    const prevStartKey = getDayKey(previousStart);
    const prevEndKey = getDayKey(previousEnd);

    const currentTotal = entries
      .filter((e) => getEntryDayKey(e.spentAt) >= currentKey)
      .reduce((sum, e) => sum + (convertFn ? convertFn(e.amount, e.currency) : e.amount), 0);

    const previousTotal = entries
      .filter((e) => {
        const key = getEntryDayKey(e.spentAt);
        return key >= prevStartKey && key <= prevEndKey;
      })
      .reduce((sum, e) => sum + (convertFn ? convertFn(e.amount, e.currency) : e.amount), 0);

    const changePercent = previousTotal > 0
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : currentTotal > 0 ? 100 : 0;

    return { currentTotal, previousTotal, changePercent };
  }, [entries]);

  /**
   * Get the highest spending day in a range
   */
  const getHighestSpendingDay = useCallback((range: TimeRange, convertFn?: ConvertFn) => {
    const filtered = getEntriesForRange(range);
    if (filtered.length === 0) return { date: '', total: 0 };

    const dayMap = new Map<string, number>();
    filtered.forEach((entry) => {
      const key = getEntryDayKey(entry.spentAt);
      dayMap.set(key, (dayMap.get(key) || 0) + (convertFn ? convertFn(entry.amount, entry.currency) : entry.amount));
    });

    let maxKey = '';
    let maxTotal = 0;
    dayMap.forEach((total, key) => {
      if (total > maxTotal) {
        maxTotal = total;
        maxKey = key;
      }
    });

    return { date: maxKey, total: maxTotal };
  }, [getEntriesForRange]);

  const getEntriesGroupedByDay = useCallback((range: TimeRange, convertFn?: ConvertFn): {
    date: string;
    label: string;
    relativeLabel: string;
    entries: SpendingEntry[];
    total: number;
  }[] => {
    const filtered = getEntriesForRange(range);
    const groups = new Map<string, SpendingEntry[]>();

    filtered.forEach((entry) => {
      const key = getEntryDayKey(entry.spentAt);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    });

    const today = getDayKey(new Date());
    const yesterday = getDayKey(addDays(new Date(), -1));

    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dayEntries]) => {
        const d = new Date(date + 'T00:00:00');
        const label = d.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        let relativeLabel = label;
        if (date === today) relativeLabel = 'Today';
        else if (date === yesterday) relativeLabel = 'Yesterday';

        const total = dayEntries.reduce(
          (sum, e) => sum + (convertFn ? convertFn(e.amount, e.currency) : e.amount),
          0
        );

        return { date, label, relativeLabel, entries: dayEntries, total };
      });
  }, [getEntriesForRange]);

  const getSpendingHeatmap = useCallback((days: number = 30, convertFn?: ConvertFn): {
    date: string;
    total: number;
    intensity: number;
  }[] => {
    const today = new Date();
    const result: { date: string; total: number; intensity: number }[] = [];
    let maxTotal = 0;

    const dailyTotals: { date: string; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = addDays(today, -i);
      const dayEntries = getEntriesForDay(day);
      const total = dayEntries.reduce(
        (sum, e) => sum + (convertFn ? convertFn(e.amount, e.currency) : e.amount),
        0
      );
      if (total > maxTotal) maxTotal = total;
      dailyTotals.push({ date: getDayKey(day), total });
    }

    dailyTotals.forEach(({ date, total }) => {
      const intensity = maxTotal > 0 ? total / maxTotal : 0;
      result.push({ date, total, intensity });
    });

    return result;
  }, [getEntriesForDay]);

  const getTopExpenses = useCallback((range: TimeRange, limit: number = 5, convertFn?: ConvertFn) => {
    const filtered = getEntriesForRange(range);
    return [...filtered]
      .sort((a, b) => {
        const aVal = convertFn ? convertFn(a.amount, a.currency) : a.amount;
        const bVal = convertFn ? convertFn(b.amount, b.currency) : b.amount;
        return bVal - aVal;
      })
      .slice(0, limit);
  }, [getEntriesForRange]);

  const getEntryCount = useCallback((range: TimeRange) => {
    return getEntriesForRange(range).length;
  }, [getEntriesForRange]);

  return {
    entries,
    isLoaded,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntryById,
    getEntriesForDay,
    getEntriesForRange,
    getTotalForDay,
    getTotalForWeek,
    getTotalForMonth,
    getTotalForYear,
    getTotalForRange,
    getDailyAverage,
    getNoSpendDaysThisMonth,
    getNoSpendDaysTotal,
    getSavingMessage,
    getWeeklyData,
    getDailyData,
    getYearlyMonthlyData,
    getCategoryTotals,
    getComparisonStats,
    getHighestSpendingDay,
    getEntriesGroupedByDay,
    getSpendingHeatmap,
    getTopExpenses,
    getEntryCount,
    refresh: loadEntries,
  };
};
