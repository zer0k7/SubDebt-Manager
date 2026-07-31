import { useTheme } from '../hooks/useTheme';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/dateHelpers';
import Svg, { G, Circle, Text as SvgText } from 'react-native-svg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CategoryTotal {
  category: string;
  total: number;
}

interface CategoryBreakdownProps {
  categories: CategoryTotal[];
  currencyCode: string;
  rangeLabel?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#EF5350',
  Groceries: '#4CAF50',
  Travel: '#42A5F5',
  Shopping: '#AB47BC',
  Bills: '#FFA726',
  Recharge: '#FFCA28',
  Study: '#5C6BC0',
  Health: '#26C6DA',
  'Personal Care': '#EC407A',
  Home: '#8D6E63',
  Entertainment: '#66BB6A',
  Gifts: '#FF7043',
  Other: '#78909C',
};

const CATEGORY_ICONS: Record<string, string> = {
  Food: 'restaurant-outline',
  Groceries: 'cart-outline',
  Travel: 'bus-outline',
  Shopping: 'bag-outline',
  Bills: 'receipt-outline',
  Recharge: 'flash-outline',
  Study: 'book-outline',
  Health: 'medkit-outline',
  'Personal Care': 'color-wand-outline',
  Home: 'home-outline',
  Entertainment: 'film-outline',
  Gifts: 'gift-outline',
  Other: 'ellipsis-horizontal-outline',
};

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
  currencyCode,
  rangeLabel,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const [expanded, setExpanded] = useState(false);

  if (categories.length === 0) return null;

  const maxTotal = Math.max(...categories.map((c) => c.total), 1);
  const grandTotal = categories.reduce((sum, c) => sum + c.total, 0);

  const visibleCategories = expanded ? categories : categories.slice(0, 4);
  const hasMore = categories.length > 4;

  let accumulatedPercentage = 0;
  const donutSlices = categories.map((cat) => {
    const percentage = grandTotal > 0 ? cat.total / grandTotal : 0;
    const strokeLength = percentage * 282.74;
    const strokeOffset = 282.74 - (accumulatedPercentage * 282.74);
    accumulatedPercentage += percentage;
    const color = CATEGORY_COLORS[cat.category] || '#78909C';
    return {
      category: cat.category,
      color,
      strokeDasharray: `${strokeLength} 282.74`,
      strokeDashoffset: strokeOffset,
      percentage: Math.round(percentage * 100),
      total: cat.total,
    };
  });

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {rangeLabel ? `SPENDING BY CATEGORY` : 'CATEGORY BREAKDOWN'}
        </Text>
        {rangeLabel && (
          <View style={styles.rangePill}>
            <Text style={styles.rangePillText}>{rangeLabel}</Text>
          </View>
        )}
      </View>

      {/* Donut layout row */}
      <View style={styles.donutRow}>
        <View style={styles.donutChartContainer}>
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <G transform="rotate(-90 60 60)">
              {/* Background circle */}
              <Circle
                cx="60"
                cy="60"
                r="45"
                fill="transparent"
                stroke={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'}
                strokeWidth="9"
              />
              {/* Slices */}
              {donutSlices.map((slice) => (
                <Circle
                  key={slice.category}
                  cx="60"
                  cy="60"
                  r="45"
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="9"
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap={slice.percentage > 0 ? "round" : "butt"}
                />
              ))}
            </G>
            {/* Center Text */}
            <SvgText
              x="60"
              y="56"
              textAnchor="middle"
              fill={colors.text.muted}
              fontSize="8"
              fontWeight="600"
              letterSpacing="0.4"
            >
              TOTAL SPENT
            </SvgText>
            <SvgText
              x="60"
              y="72"
              textAnchor="middle"
              fill={colors.text.primary}
              fontSize="12"
              fontWeight="800"
            >
              {formatCurrency(grandTotal, currencyCode)}
            </SvgText>
          </Svg>
        </View>

        {/* Donut Legend */}
        <View style={styles.donutLegendContainer}>
          {categories.slice(0, 4).map((cat) => {
            const color = CATEGORY_COLORS[cat.category] || '#78909C';
            const percentage = grandTotal > 0 ? Math.round((cat.total / grandTotal) * 100) : 0;
            return (
              <View key={cat.category} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <View style={styles.legendTextWrap}>
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {cat.category}
                  </Text>
                  <Text style={[styles.legendPct, { color }]}>{percentage}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Category rows */}
      {visibleCategories.map((cat) => {
        const color = CATEGORY_COLORS[cat.category] || '#78909C';
        const icon = CATEGORY_ICONS[cat.category] || 'ellipsis-horizontal-outline';
        const percentage = grandTotal > 0 ? Math.round((cat.total / grandTotal) * 100) : 0;
        const barWidth = Math.max((cat.total / maxTotal) * 100, 4);

        return (
          <View key={cat.category} style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: `${color}18`, borderColor: `${color}35` }]}>
              <Ionicons name={icon as any} size={16} color={color} />
            </View>
            <View style={styles.info}>
              <View style={styles.labelRow}>
                <Text style={styles.catName}>{cat.category}</Text>
                <Text style={styles.catAmount}>
                  {formatCurrency(cat.total, currencyCode)}
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${barWidth}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.percentText}>{percentage}% of total</Text>
            </View>
          </View>
        );
      })}

      {/* Show more / less toggle */}
      {hasMore && (
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleText}>
            {expanded ? 'Show Less' : `Show All ${categories.length} Categories`}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.accent.purple}
          />
        </TouchableOpacity>
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    title: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.8,
    },
    rangePill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: isDark
        ? 'rgba(124,58,237,0.12)'
        : 'rgba(124,58,237,0.08)',
    },
    rangePillText: {
      color: colors.accent.purple,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    donutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderStyle: 'solid',
      borderBottomColor: isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    donutChartContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    donutLegendContainer: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 8,
    },
    legendItem: {
      width: '47%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendTextWrap: {
      flex: 1,
    },
    legendLabel: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '600',
    },
    legendPct: {
      fontSize: 11,
      fontWeight: '700',
      marginTop: 1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    iconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      marginTop: 2,
    },
    info: {
      flex: 1,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    catName: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    catAmount: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '700',
    },
    barTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.05)',
      marginBottom: 4,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
      opacity: 0.85,
    },
    percentText: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '500',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingTop: 4,
      borderTopWidth: 0.5,
      borderTopColor: isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.06)',
    },
    toggleText: {
      color: colors.accent.purple,
      fontSize: 12,
      fontWeight: '600',
    },
  });
