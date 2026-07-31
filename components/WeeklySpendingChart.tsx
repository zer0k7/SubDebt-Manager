import { useTheme } from '../hooks/useTheme';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { WeeklyDayData } from '../hooks/useDailySpending';
import { formatCurrency } from '../utils/dateHelpers';

interface WeeklySpendingChartProps {
  data: WeeklyDayData[];
  currencyCode: string;
  weekTotal: number;
}

export const WeeklySpendingChart: React.FC<WeeklySpendingChartProps> = ({
  data,
  currencyCode,
  weekTotal,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const maxAmount = useMemo(() => {
    const max = Math.max(...data.map((d) => d.total), 1);
    return max;
  }, [data]);

  const CHART_WIDTH = 300;
  const CHART_HEIGHT = 130;
  const BAR_MAX_HEIGHT = CHART_HEIGHT - 24;
  const BAR_COUNT = 7;
  const BAR_GAP = 10;
  const barWidth = (CHART_WIDTH - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT;
  const totalBarsWidth = BAR_COUNT * barWidth + (BAR_COUNT - 1) * BAR_GAP;
  const startX = (CHART_WIDTH - totalBarsWidth) / 2;

  const hasAnySpending = data.some((d) => d.total > 0);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>LAST 7 DAYS</Text>
          <Text style={styles.totalAmount}>
            {formatCurrency(weekTotal, currencyCode)}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {hasAnySpending ? `${data.filter((d) => d.hasEntries).length}/7 days` : 'No data'}
          </Text>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.chartWrap}>
        <Svg
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        >
          <Defs>
            <LinearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.accent.purple} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.accent.purple} stopOpacity="0.3" />
            </LinearGradient>
            <LinearGradient id="barGradToday" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.accent.amber} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.accent.amber} stopOpacity="0.4" />
            </LinearGradient>
            <LinearGradient id="barGradEmpty" x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0%"
                stopColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
                stopOpacity="1"
              />
              <Stop
                offset="100%"
                stopColor={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                stopOpacity="1"
              />
            </LinearGradient>
          </Defs>

          {data.map((day, i) => {
            const barHeight =
              day.total > 0
                ? Math.max((day.total / maxAmount) * BAR_MAX_HEIGHT, 6)
                : 6;
            const x = startX + i * (barWidth + BAR_GAP);
            const y = BAR_MAX_HEIGHT - barHeight;

            const fillId = day.total <= 0
              ? 'url(#barGradEmpty)'
              : day.isToday
              ? 'url(#barGradToday)'
              : 'url(#barGradActive)';

            return (
              <React.Fragment key={day.date}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={barWidth / 2 > 8 ? 8 : barWidth / 2}
                  ry={barWidth / 2 > 8 ? 8 : barWidth / 2}
                  fill={fillId}
                />
                {/* Day label */}
                <SvgText
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT - 2}
                  fontSize="10"
                  fill={
                    day.isToday
                      ? colors.accent.amber
                      : day.hasEntries
                      ? colors.text.secondary
                      : colors.text.muted
                  }
                  textAnchor="middle"
                  fontWeight={day.isToday ? '700' : '500'}
                >
                  {day.isToday ? 'Today' : day.dayLabel}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 20,
      marginBottom: 14,
      padding: 18,
      borderRadius: 22,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 18,
    },
    headerLabel: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    totalAmount: {
      color: colors.text.primary,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: isDark
        ? 'rgba(124,58,237,0.12)'
        : 'rgba(124,58,237,0.08)',
      borderWidth: 0.5,
      borderColor: isDark
        ? 'rgba(124,58,237,0.25)'
        : 'rgba(124,58,237,0.2)',
    },
    badgeText: {
      color: colors.accent.purple,
      fontSize: 11,
      fontWeight: '600',
    },
    chartWrap: {
      alignItems: 'center',
    },
  });
