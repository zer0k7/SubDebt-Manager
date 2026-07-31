import { useTheme } from '../hooks/useTheme';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, Rect, Line, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { GlassButton } from './GlassButton';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'subscriptions' | 'debts' | 'credits';
}

// Animated SVG illustration for subscriptions
const SubscriptionIllustration = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.8)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -8, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Pulse ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.8, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Cards slide in
    Animated.parallel([
      Animated.spring(cardSlide, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.illustrationWrap}>
      {/* Pulsing ring */}
      <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse }] }]} />

      {/* Floating main icon */}
      <Animated.View style={[styles.mainIcon, { transform: [{ translateY: float }] }]}>
        <Svg width={64} height={64} viewBox="0 0 64 64">
          {/* Card background */}
          <Rect x="8" y="12" width="48" height="40" rx="10" fill="rgba(79,195,247,0.15)" stroke="rgba(79,195,247,0.3)" strokeWidth="1" />
          {/* Lines on card */}
          <Rect x="16" y="22" width="20" height="3" rx="1.5" fill="rgba(79,195,247,0.5)" />
          <Rect x="16" y="30" width="32" height="2" rx="1" fill={colors.glass.navBorder} />
          <Rect x="16" y="36" width="24" height="2" rx="1" fill={colors.glass.cardBorder} />
          {/* Check circle */}
          <Circle cx="46" cy="42" r="8" fill="rgba(102,187,106,0.2)" stroke="rgba(102,187,106,0.5)" strokeWidth="1" />
          <Path d="M42 42l3 3 5-5" stroke="#66BB6A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>

      {/* Mini floating cards */}
      <Animated.View style={[styles.miniCard, styles.miniCardLeft, { opacity: cardOpacity, transform: [{ translateX: cardSlide }] }]}>
        <View style={[styles.miniCardDot, { backgroundColor: '#EF5350' }]} />
        <View style={styles.miniCardLine} />
      </Animated.View>

      <Animated.View style={[styles.miniCard, styles.miniCardRight, { opacity: cardOpacity, transform: [{ translateX: Animated.multiply(cardSlide, -1) }] }]}>
        <View style={[styles.miniCardDot, { backgroundColor: '#4FC3F7' }]} />
        <View style={styles.miniCardLine} />
      </Animated.View>
    </View>
  );
};

// Animated SVG illustration for debts
const DebtIllustration = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const float = useRef(new Animated.Value(0)).current;
  const coinBounce = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -6, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(coinBounce, { toValue: -12, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(coinBounce, { toValue: 0, duration: 400, easing: Easing.bounce, useNativeDriver: true }),
        Animated.delay(1500),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shine, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shine, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(2000),
      ])
    ).start();
  }, []);

  const shineOpacity = shine.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] });

  return (
    <View style={styles.illustrationWrap}>
      {/* Main wallet icon */}
      <Animated.View style={[styles.mainIcon, { transform: [{ translateY: float }] }]}>
        <Svg width={64} height={64} viewBox="0 0 64 64">
          {/* Wallet body */}
          <Rect x="6" y="18" width="52" height="32" rx="8" fill="rgba(255,183,77,0.15)" stroke="rgba(255,183,77,0.3)" strokeWidth="1" />
          {/* Wallet flap */}
          <Path d="M6 26 C6 20 10 16 16 16 L48 16 C54 16 58 20 58 26" stroke="rgba(255,183,77,0.4)" strokeWidth="1" fill="none" />
          {/* Card slot */}
          <Rect x="36" y="28" width="16" height="12" rx="4" fill="rgba(255,183,77,0.2)" stroke="rgba(255,183,77,0.35)" strokeWidth="0.5" />
          {/* Wallet lines */}
          <Rect x="14" y="30" width="16" height="2" rx="1" fill={colors.glass.navBorder} />
          <Rect x="14" y="36" width="12" height="2" rx="1" fill={colors.glass.cardBorder} />
        </Svg>
      </Animated.View>

      {/* Bouncing coin */}
      <Animated.View style={[styles.coin, { transform: [{ translateY: coinBounce }] }]}>
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="10" fill="rgba(255,183,77,0.25)" stroke="#FFB74D" strokeWidth="1.5" />
          <Path d="M12 7v10M9 9h6M9 15h6" stroke="#FFB74D" strokeWidth="1" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      {/* Shine effect */}
      <Animated.View style={[styles.shineOverlay, { opacity: shineOpacity }]} />
    </View>
  );
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon, title, subtitle, actionLabel, onAction, variant,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated Illustration */}
      {variant === 'debts' || variant === 'credits' ? <DebtIllustration /> : <SubscriptionIllustration />}

      {/* Text content with fade-in */}
      <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }], alignItems: 'center' }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {actionLabel && onAction && (
          <View style={styles.actionWrap}>
            <GlassButton title={actionLabel} variant="secondary" onPress={onAction} />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  illustrationWrap: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(79,195,247,0.15)',
  },
  mainIcon: {
    zIndex: 2,
  },
  miniCard: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    gap: 6,
  },
  miniCardLeft: {
    bottom: 18,
    left: 0,
  },
  miniCardRight: {
    top: 18,
    right: 0,
  },
  miniCardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  miniCardLine: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.glass.navBorder,
  },
  coin: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 3,
  },
  shineOverlay: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,183,77,0.08)',
  },
  title: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  actionWrap: {
    width: '100%',
    maxWidth: 200,
  },
});
