import { useTheme } from '../hooks/useTheme';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '../hooks/useSubscriptions';
import { formatCurrency } from '../utils/dateHelpers';
import { useCurrency } from '../hooks/useCurrency';

interface SpendingChartProps {
  subscriptions: Subscription[];
  currencyCode: string;
}

interface CategoryData {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Entertainment': '#EF5350',
  'Productivity': '#42A5F5',
  'Utilities': '#66BB6A',
  'Gaming': '#AB47BC',
  'Health & Fitness': '#26C6DA',
  'News & Reading': '#FFA726',
  'Other': '#78909C',
  'Uncategorized': '#5C6BC0',
};

const getMonthlyAmount = (sub: Subscription): number => {
  if (!sub.isActive) return 0;
  const now = Date.now();
  if (sub.expiryDate && new Date(sub.expiryDate).getTime() < now) return 0;

  switch (sub.billingCycle) {
    case 'weekly': return sub.amount * 4.33;
    case 'monthly': return sub.amount;
    case 'yearly': return sub.amount / 12;
    case 'custom': return sub.amount; // Treat custom as monthly
    default: return sub.amount;
  }
};

export const SpendingChart: React.FC<SpendingChartProps> = ({ subscriptions, currencyCode }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { convertAmount } = useCurrency();

  const { categories, totalMonthly, maxAmount } = useMemo(() => {
    const categoryMap = new Map<string, number>();

    subscriptions.forEach(sub => {
      const monthly = getMonthlyAmount(sub);
      if (monthly <= 0) return;
      const convertedMonthly = convertAmount(monthly, sub.currency);
      const cat = sub.category || 'Uncategorized';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + convertedMonthly);
    });

    const total = Array.from(categoryMap.values()).reduce((s, v) => s + v, 0);
    const max = Math.max(...Array.from(categoryMap.values()), 1);

    const cats: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({
        name,
        amount: Math.round(amount * 100) / 100,
        color: CATEGORY_COLORS[name] || '#78909C',
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { categories: cats, totalMonthly: Math.round(total * 100) / 100, maxAmount: max };
  }, [subscriptions, convertAmount]);

  if (categories.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="bar-chart-outline" size={32} color={colors.text.muted} />
        <Text style={styles.emptyText}>Add active subscriptions to see spending breakdown</Text>
      </View>
    );
  }

  const CHART_WIDTH = 280;
  const CHART_HEIGHT = 140;
  const BAR_GAP = 8;
  const BAR_MAX_HEIGHT = CHART_HEIGHT - 30;
  const barCount = Math.min(categories.length, 6);
  const barWidth = Math.min(
    (CHART_WIDTH - (barCount - 1) * BAR_GAP) / barCount,
    48
  );
  const totalBarsWidth = barCount * barWidth + (barCount - 1) * BAR_GAP;
  const startX = (CHART_WIDTH - totalBarsWidth) / 2;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>MONTHLY SPENDING</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalMonthly, currencyCode)}</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="trending-up" size={14} color={colors.accent.blue} />
          <Text style={styles.badgeText}>{categories.length} categories</Text>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.chartWrap}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
          <Defs>
            {categories.slice(0, barCount).map((cat, i) => (
              <LinearGradient key={`grad-${i}`} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={cat.color} stopOpacity="1" />
                <Stop offset="100%" stopColor={cat.color} stopOpacity="0.5" />
              </LinearGradient>
            ))}
          </Defs>

          {/* Grid lines */}
          <Line x1="0" y1={BAR_MAX_HEIGHT} x2={CHART_WIDTH} y2={BAR_MAX_HEIGHT} stroke={colors.glass.card} strokeWidth="0.5" />
          <Line x1="0" y1={BAR_MAX_HEIGHT * 0.5} x2={CHART_WIDTH} y2={BAR_MAX_HEIGHT * 0.5} stroke={colors.glass.card} strokeWidth="0.5" strokeDasharray="4,4" />

          {/* Bars */}
          {categories.slice(0, barCount).map((cat, i) => {
            const barHeight = Math.max((cat.amount / maxAmount) * BAR_MAX_HEIGHT, 4);
            const x = startX + i * (barWidth + BAR_GAP);
            const y = BAR_MAX_HEIGHT - barHeight;

            return (
              <React.Fragment key={i}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  ry={6}
                  fill={`url(#barGrad${i})`}
                />
                {/* Category label */}
                <SvgText
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT - 2}
                  fontSize="9"
                  fill={colors.text.muted}
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {cat.name.length > 6 ? cat.name.substring(0, 5) + '…' : cat.name}
                </SvgText>
                {/* Amount above bar */}
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 4}
                  fontSize="9"
                  fill={colors.text.secondary}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {cat.percentage}%
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {categories.slice(0, 6).map((cat, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>{cat.name}</Text>
            <Text style={styles.legendAmount}>{formatCurrency(cat.amount, currencyCode)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  emptyCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 28,
    borderRadius: 20,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.buttonSecondary,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(79,195,247,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(79,195,247,0.2)',
  },
  badgeText: {
    color: colors.accent.blue,
    fontSize: 11,
    fontWeight: '600',
  },
  chartWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  legend: {
    gap: 6,
    borderTopWidth: 0.5,
    borderTopColor: colors.glass.card,
    paddingTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: colors.text.secondary,
    fontSize: 13,
    flex: 1,
  },
  legendAmount: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
