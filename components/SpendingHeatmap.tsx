import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeatmapDay {
  date: string;
  total: number;
  intensity: number;
}

interface SpendingHeatmapProps {
  data: HeatmapDay[];
  currencyCode: string;
}

export const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({ data }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  if (data.length === 0) return null;

  const activeDays = data.filter((d) => d.total > 0).length;
  const noSpendDays = data.length - activeDays;

  const getColor = (intensity: number) => {
    if (intensity === 0) return isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    if (intensity < 0.25) return isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)';
    if (intensity < 0.5) return isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)';
    if (intensity < 0.75) return isDark ? 'rgba(124,58,237,0.5)' : 'rgba(124,58,237,0.35)';
    return isDark ? 'rgba(124,58,237,0.75)' : 'rgba(124,58,237,0.5)';
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>SPENDING ACTIVITY</Text>
        <View style={styles.legendRow}>
          <Text style={styles.legendLabel}>Less</Text>
          {[0, 0.2, 0.4, 0.7, 1].map((v, i) => (
            <View key={i} style={[styles.legendDot, { backgroundColor: getColor(v) }]} />
          ))}
          <Text style={styles.legendLabel}>More</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {data.map((day, i) => (
          <View key={i} style={[styles.cell, { backgroundColor: getColor(day.intensity) }]} />
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{activeDays}</Text>
          <Text style={styles.statDesc}>spending days</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.accent.green }]}>{noSpendDays}</Text>
          <Text style={styles.statDesc}>no-spend days</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{data.length}</Text>
          <Text style={styles.statDesc}>days tracked</Text>
        </View>
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
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    legendLabel: {
      color: colors.text.muted,
      fontSize: 9,
      fontWeight: '500',
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 2.5,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 14,
    },
    cell: {
      width: 14,
      height: 14,
      borderRadius: 3,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 12,
      borderTopWidth: 0.5,
      borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },
    statItem: {
      alignItems: 'center',
    },
    statNum: {
      color: colors.accent.purple,
      fontSize: 18,
      fontWeight: '800',
    },
    statDesc: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '500',
      marginTop: 2,
    },
  });
