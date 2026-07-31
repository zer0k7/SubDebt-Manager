import { useTheme } from '../hooks/useTheme';
import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, {
  Rect,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Line,
  G,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import {
  WeeklyDayData,
  MonthlyDayData,
  YearlyMonthData,
  TimeRange,
} from '../hooks/useDailySpending';
import * as Haptics from 'expo-haptics';
import { formatCurrency } from '../utils/dateHelpers';

interface SpendingTrendChartProps {
  timeRange: TimeRange;
  weeklyData: WeeklyDayData[];
  dailyData30: MonthlyDayData[];
  dailyData90: MonthlyDayData[];
  yearlyData: YearlyMonthData[];
  rangeTotal: number;
  previousTotal: number;
  changePercent: number;
  currencyCode: string;
  dailyAvg: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * A comprehensive spending trend chart that adapts to 7d / 30d / 90d / 1y views.
 * - 7d: 7 bars (no scrolling)
 * - 30d: 30 bars (horizontal scroll)
 * - 90d: 90 bars grouped (horizontal scroll)
 * - 1y: 12 month bars (no scrolling)
 */
export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  timeRange,
  weeklyData,
  dailyData30,
  dailyData90,
  yearlyData,
  rangeTotal,
  previousTotal,
  changePercent,
  currencyCode,
  dailyAvg,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setActiveIndex(null);
  }, [timeRange]);

  const rangeLabel = useMemo(() => {
    switch (timeRange) {
      case '7d': return 'LAST 7 DAYS';
      case '30d': return 'LAST 30 DAYS';
      case '90d': return 'LAST 3 MONTHS';
      case '1y': return 'THIS YEAR';
      case 'all': return 'ALL TIME';
      default: return 'LAST 7 DAYS';
    }
  }, [timeRange]);

  const trendIsUp = changePercent > 0;
  const trendIsDown = changePercent < 0;
  const showTrend = previousTotal > 0 || rangeTotal > 0;

  // Render chart based on time range
  const renderChart = () => {
    switch (timeRange) {
      case '7d':
        return renderBarChart(
          weeklyData.map((d) => ({
            label: d.isToday ? 'Today' : d.dayLabel,
            value: d.total,
            isHighlighted: d.isToday,
            hasData: d.hasEntries,
          })),
          false
        );
      case '30d':
        return renderBarChart(
          dailyData30.map((d) => ({
            label: d.dayLabel,
            value: d.total,
            isHighlighted: d.isToday,
            hasData: d.hasEntries,
          })),
          true
        );
      case '90d':
        return renderBarChart(
          dailyData90.map((d) => ({
            label: d.dayLabel,
            value: d.total,
            isHighlighted: d.isToday,
            hasData: d.hasEntries,
          })),
          true
        );
      case '1y':
        return renderBarChart(
          yearlyData.map((d) => ({
            label: d.monthLabel,
            value: d.total,
            isHighlighted: d.isCurrent,
            hasData: d.hasEntries,
          })),
          false
        );
      case 'all':
        return renderBarChart(
          yearlyData.map((d) => ({
            label: d.monthLabel,
            value: d.total,
            isHighlighted: d.isCurrent,
            hasData: d.hasEntries,
          })),
          false
        );
      default:
        return null;
    }
  };

  interface BarItem {
    label: string;
    value: number;
    isHighlighted: boolean;
    hasData: boolean;
  }

  const renderBarChart = (items: BarItem[], scrollable: boolean) => {
    const barCount = items.length;
    const maxValue = Math.max(...items.map((d) => d.value), 1);

    // Calculate dimensions
    let barWidth: number;
    let barGap: number;
    let chartWidth: number;
    const CHART_HEIGHT = 140;
    const BAR_MAX_HEIGHT = CHART_HEIGHT - 28;

    if (scrollable) {
      barWidth = barCount > 60 ? 8 : barCount > 30 ? 12 : 14;
      barGap = barCount > 60 ? 3 : barCount > 30 ? 4 : 6;
      chartWidth = barCount * (barWidth + barGap) + 40;
    } else {
      const containerWidth = SCREEN_WIDTH - 80;
      barGap = barCount > 10 ? 6 : 10;
      barWidth = Math.min(
        (containerWidth - (barCount - 1) * barGap) / barCount,
        48
      );
      chartWidth = barCount * barWidth + (barCount - 1) * barGap + 40;
    }

    const startX = 20;

    // Show label every Nth bar for dense charts
    const labelEveryN =
      barCount > 60 ? 14 : barCount > 30 ? 5 : barCount > 14 ? 3 : 1;

    const svgContent = (
      <Svg
        width={chartWidth}
        height={CHART_HEIGHT}
        viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
      >
        <Defs>
          <LinearGradient id="barGradPrimary" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.accent.purple} stopOpacity="1" />
            <Stop
              offset="100%"
              stopColor={colors.accent.purple}
              stopOpacity="0.3"
            />
          </LinearGradient>
          <LinearGradient id="barGradHighlight" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.accent.amber} stopOpacity="1" />
            <Stop
              offset="100%"
              stopColor={colors.accent.amber}
              stopOpacity="0.4"
            />
          </LinearGradient>
          <LinearGradient id="barGradInactive" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0%"
              stopColor={
                isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
              }
              stopOpacity="1"
            />
            <Stop
              offset="100%"
              stopColor={
                isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
              }
              stopOpacity="1"
            />
          </LinearGradient>
        </Defs>

        {/* Average line */}
        {dailyAvg > 0 && barCount <= 31 && (
          <>
            <Line
              x1={0}
              y1={BAR_MAX_HEIGHT - Math.min((dailyAvg / maxValue) * BAR_MAX_HEIGHT, BAR_MAX_HEIGHT - 2)}
              x2={chartWidth}
              y2={BAR_MAX_HEIGHT - Math.min((dailyAvg / maxValue) * BAR_MAX_HEIGHT, BAR_MAX_HEIGHT - 2)}
              stroke={colors.accent.amber}
              strokeWidth="0.8"
              strokeDasharray="4,4"
              opacity={0.5}
            />
            <SvgText
              x={chartWidth - 4}
              y={BAR_MAX_HEIGHT - Math.min((dailyAvg / maxValue) * BAR_MAX_HEIGHT, BAR_MAX_HEIGHT - 2) - 4}
              fontSize="8"
              fill={colors.accent.amber}
              textAnchor="end"
              fontWeight="600"
              opacity={0.7}
            >
              avg
            </SvgText>
          </>
        )}

        {items.map((item, i) => {
          const barHeight =
            item.value > 0
              ? Math.max((item.value / maxValue) * BAR_MAX_HEIGHT, 4)
              : 4;
          const x = startX + i * (barWidth + barGap);
          const y = BAR_MAX_HEIGHT - barHeight;
          const fillId =
            item.value <= 0
              ? 'url(#barGradInactive)'
              : item.isHighlighted
              ? 'url(#barGradHighlight)'
              : 'url(#barGradPrimary)';

          const rx = Math.min(barWidth / 2, 6);
          const showLabel = i % labelEveryN === 0 || item.isHighlighted;

          return (
            <React.Fragment key={`${item.label}-${i}`}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={rx}
                ry={rx}
                fill={fillId}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveIndex(activeIndex === i ? null : i);
                }}
              />
              {activeIndex === i && item.value > 0 && (
                <G>
                  <Rect
                    x={Math.max(4, x + barWidth / 2 - 45)}
                    y={Math.max(4, y - 28)}
                    width={90}
                    height={22}
                    rx={6}
                    fill={colors.background.secondary}
                    stroke={colors.accent.purple}
                    strokeWidth={0.5}
                  />
                  <SvgText
                    x={x + barWidth / 2}
                    y={Math.max(18, y - 13)}
                    fontSize="9"
                    fill={colors.text.primary}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {formatCurrency(item.value, currencyCode)}
                  </SvgText>
                </G>
              )}
              {showLabel && (
                <SvgText
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT - 2}
                  fontSize={barCount > 30 ? '8' : '10'}
                  fill={
                    item.isHighlighted
                      ? colors.accent.amber
                      : item.hasData
                      ? colors.text.secondary
                      : colors.text.muted
                  }
                  textAnchor="middle"
                  fontWeight={item.isHighlighted ? '700' : '500'}
                >
                  {item.label}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    );

    if (scrollable) {
      return (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollChart}
          contentContainerStyle={{ paddingRight: 10 }}
          onContentSizeChange={() => {
            // Auto-scroll to the right (today) on mount
            scrollRef.current?.scrollToEnd({ animated: false });
          }}
        >
          {svgContent}
        </ScrollView>
      );
    }

    return <View style={styles.chartWrap}>{svgContent}</View>;
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>{rangeLabel}</Text>
          <Text style={styles.totalAmount}>
            {formatCurrency(rangeTotal, currencyCode)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {showTrend && timeRange !== 'all' && (
            <View
              style={[
                styles.trendBadge,
                trendIsDown && styles.trendBadgeGreen,
                trendIsUp && styles.trendBadgeRed,
                changePercent === 0 && styles.trendBadgeNeutral,
              ]}
            >
              <Ionicons
                name={
                  trendIsDown
                    ? 'trending-down'
                    : trendIsUp
                    ? 'trending-up'
                    : 'remove-outline'
                }
                size={13}
                color={
                  trendIsDown
                    ? colors.accent.green
                    : trendIsUp
                    ? colors.accent.red
                    : colors.text.muted
                }
              />
              <Text
                style={[
                  styles.trendText,
                  trendIsDown && { color: colors.accent.green },
                  trendIsUp && { color: colors.accent.red },
                ]}
              >
                {Math.abs(changePercent)}%
              </Text>
            </View>
          )}
          <View style={styles.avgBadge}>
            <Text style={styles.avgLabel}>avg/day</Text>
            <Text style={styles.avgValue}>
              {formatCurrency(dailyAvg, currencyCode)}
            </Text>
          </View>
        </View>
      </View>

      {/* Chart */}
      {renderChart()}

      {/* Scroll hint for scrollable charts */}
      {(timeRange === '30d' || timeRange === '90d') && (
        <View style={styles.scrollHint}>
          <Ionicons
            name="swap-horizontal-outline"
            size={12}
            color={colors.text.muted}
          />
          <Text style={styles.scrollHintText}>Scroll to see all days</Text>
        </View>
      )}
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
    headerRight: {
      alignItems: 'flex-end',
      gap: 6,
    },
    trendBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.04)',
    },
    trendBadgeGreen: {
      backgroundColor: isDark
        ? 'rgba(102,187,106,0.15)'
        : 'rgba(22,163,74,0.1)',
      borderWidth: 0.5,
      borderColor: isDark
        ? 'rgba(102,187,106,0.3)'
        : 'rgba(22,163,74,0.25)',
    },
    trendBadgeRed: {
      backgroundColor: isDark
        ? 'rgba(239,83,80,0.15)'
        : 'rgba(220,38,38,0.1)',
      borderWidth: 0.5,
      borderColor: isDark
        ? 'rgba(239,83,80,0.3)'
        : 'rgba(220,38,38,0.25)',
    },
    trendBadgeNeutral: {
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    trendText: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '700',
    },
    avgBadge: {
      alignItems: 'flex-end',
    },
    avgLabel: {
      color: colors.text.muted,
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    avgValue: {
      color: colors.accent.amber,
      fontSize: 13,
      fontWeight: '700',
    },
    chartWrap: {
      alignItems: 'center',
    },
    scrollChart: {
      marginHorizontal: -8,
    },
    scrollHint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginTop: 8,
    },
    scrollHintText: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '500',
    },
  });
