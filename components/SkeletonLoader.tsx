import { useTheme } from '../hooks/useTheme';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface SkeletonLoaderProps {
  variant?: 'subscriptions' | 'debts';
}

const ShimmerBar = ({ width, height = 14, style, delay = 0 }: {
  width: number | string;
  height?: number;
  style?: any;
  delay?: number;
}) => {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: height / 2,
          backgroundColor: colors.glass.buttonSecondary,
          opacity,
        },
        style,
      ]}
    />
  );
};

const SkeletonCard = ({ index }: { index: number }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const delay = index * 150;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {/* Icon circle */}
        <ShimmerBar width={40} height={40} delay={delay} style={{ borderRadius: 20 }} />
        <View style={styles.cardTitleWrap}>
          <ShimmerBar width={120} height={16} delay={delay + 50} />
          <ShimmerBar width={80} height={12} delay={delay + 100} style={{ marginTop: 6 }} />
        </View>
        <ShimmerBar width={60} height={22} delay={delay + 75} style={{ borderRadius: 11 }} />
      </View>
      <View style={styles.cardDetails}>
        <ShimmerBar width={90} height={20} delay={delay + 150} />
        <ShimmerBar width={70} height={14} delay={delay + 200} />
      </View>
      <ShimmerBar width="100%" height={3} delay={delay + 250} style={{ marginTop: 12 }} />
    </View>
  );
};

const SkeletonDebtCard = ({ index }: { index: number }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const delay = index * 150;
  return (
    <View style={styles.debtCard}>
      <View style={styles.cardHeader}>
        <ShimmerBar width={44} height={44} delay={delay} style={{ borderRadius: 22 }} />
        <View style={styles.cardTitleWrap}>
          <ShimmerBar width={130} height={16} delay={delay + 50} />
          <ShimmerBar width={90} height={12} delay={delay + 100} style={{ marginTop: 6 }} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <ShimmerBar width={80} height={22} delay={delay + 75} />
          <ShimmerBar width={55} height={18} delay={delay + 125} style={{ marginTop: 6, borderRadius: 9 }} />
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.cardDetails}>
        <ShimmerBar width={160} height={13} delay={delay + 200} />
        <ShimmerBar width={100} height={24} delay={delay + 250} style={{ borderRadius: 12 }} />
      </View>
    </View>
  );
};

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant = 'subscriptions' }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const CardComponent = variant === 'debts' ? SkeletonDebtCard : SkeletonCard;

  return (
    <View style={styles.container}>
      {/* Skeleton Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <ShimmerBar width={100} height={13} />
          <ShimmerBar width={60} height={22} style={{ borderRadius: 11 }} delay={100} />
        </View>
        <ShimmerBar width={160} height={34} delay={200} style={{ marginTop: 8 }} />
      </View>

      {/* Skeleton Search */}
      <View style={styles.searchSkeleton}>
        <ShimmerBar width={18} height={18} style={{ borderRadius: 9 }} delay={300} />
        <ShimmerBar width="70%" height={16} delay={350} />
      </View>

      {/* Skeleton Filter Pills */}
      <View style={styles.filterRow}>
        {[50, 55, 58, 62].map((w, i) => (
          <ShimmerBar key={i} width={w} height={30} style={{ borderRadius: 15 }} delay={400 + i * 80} />
        ))}
      </View>

      {/* Skeleton Cards */}
      {[0, 1, 2, 3].map(i => (
        <CardComponent key={i} index={i} />
      ))}
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 4,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.card,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.card,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 42,
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.card,
  },
  debtCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glass.card,
    marginVertical: 14,
  },
});
