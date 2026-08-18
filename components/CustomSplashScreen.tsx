import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onFinish: () => void;
}

export const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ onFinish }) => {
  const { colors, isDark, accentColor } = useTheme();

  // Animations
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;

  const floatValue = useRef(new Animated.Value(0)).current;
  const orbPulse = useRef(new Animated.Value(0.9)).current;
  const orbOpacity = useRef(new Animated.Value(0.4)).current;

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(15)).current;

  const progress = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Continuous Floating & Pulsing Ambient Aura
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatValue, {
            toValue: -8,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orbPulse, {
            toValue: 1.15,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orbOpacity, {
            toValue: isDark ? 0.6 : 0.45,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(floatValue, {
            toValue: 0,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orbPulse, {
            toValue: 0.9,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orbOpacity, {
            toValue: isDark ? 0.3 : 0.25,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 2. Entrance Stagger Sequence
    Animated.sequence([
      // Logo Spring in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6.5,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Title & Pill Fade Slide In
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Progress bar fill
      Animated.timing(progress, {
        toValue: 1,
        duration: 750,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Exit animation: Smooth Fade Out into App
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    });
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const bgGradient: readonly [string, string, ...string[]] = isDark
    ? ['#0A0A10', '#110E24', '#06060A']
    : ['#FFFFFF', '#F8FAFC', '#EFF6FF'];

  const orbGradient: readonly [string, string, ...string[]] = isDark
    ? ['rgba(124, 58, 237, 0.45)', 'rgba(79, 195, 247, 0.35)', 'transparent']
    : ['rgba(2, 132, 199, 0.22)', 'rgba(124, 58, 237, 0.18)', 'transparent'];

  const emblemBorder = isDark
    ? 'rgba(255, 255, 255, 0.15)'
    : 'rgba(2, 132, 199, 0.2)';

  const emblemBg: readonly [string, string, ...string[]] = isDark
    ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']
    : ['#FFFFFF', 'rgba(240, 249, 255, 0.8)'];

  const primaryAccent = colors.accent.primary || (isDark ? '#4FC3F7' : '#0284c7');
  const secondaryAccent = colors.accent.purple || '#7c3aed';

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      {/* Background Gradient */}
      <LinearGradient colors={bgGradient} style={StyleSheet.absoluteFillObject} />

      {/* Ambient Pulsing Aura Orb */}
      <Animated.View
        style={[
          styles.glowOrb,
          {
            transform: [{ scale: orbPulse }],
            opacity: orbOpacity,
          },
        ]}
      >
        <LinearGradient colors={orbGradient} style={styles.glowGradient} />
      </Animated.View>

      {/* Secondary Ambient Accent Spot */}
      <Animated.View
        style={[
          styles.glowOrbSmall,
          {
            opacity: orbOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={[
            isDark ? 'rgba(79, 195, 247, 0.25)' : 'rgba(124, 58, 237, 0.15)',
            'transparent',
          ]}
          style={styles.glowGradient}
        />
      </Animated.View>

      {/* Center Hero Glassmorphic Emblem */}
      <Animated.View
        style={[
          styles.heroWrap,
          {
            opacity: logoOpacity,
            transform: [
              { scale: logoScale },
              { translateY: Animated.add(logoTranslateY, floatValue) },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={emblemBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.emblemCard,
            {
              borderColor: emblemBorder,
              shadowColor: primaryAccent,
            },
          ]}
        >
          {/* Subtle Accent Glow Ring */}
          <LinearGradient
            colors={[`${primaryAccent}40`, `${secondaryAccent}25`]}
            style={styles.emblemGlowRing}
          >
            <View
              style={[
                styles.iconCore,
                {
                  backgroundColor: isDark
                    ? 'rgba(10, 10, 16, 0.7)'
                    : 'rgba(255, 255, 255, 0.95)',
                },
              ]}
            >
              <Ionicons name="wallet" size={38} color={primaryAccent} />
            </View>
          </LinearGradient>
        </LinearGradient>
      </Animated.View>

      {/* App Branding & Gen-Z Pill */}
      <Animated.View
        style={[
          styles.brandWrap,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        <View style={styles.pillBadge}>
          <Ionicons name="sparkles" size={12} color={primaryAccent} />
          <Text style={[styles.pillBadgeText, { color: primaryAccent }]}>
            NEXT-GEN FINANCE
          </Text>
        </View>

        <Text
          style={[
            styles.brandTitle,
            { color: isDark ? '#FFFFFF' : '#0F172A' },
          ]}
        >
          SUBDEBT
        </Text>

        <Text
          style={[
            styles.brandTagline,
            { color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B' },
          ]}
        >
          Smart Spending · Subscriptions · Financial Freedom
        </Text>
      </Animated.View>

      {/* Minimalist Shimmering Loading Pill Bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <Animated.View
            style={[
              styles.progressThumb,
              {
                width: progressWidth,
                backgroundColor: primaryAccent,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  glowOrb: {
    position: 'absolute',
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: (width * 0.95) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrbSmall: {
    position: 'absolute',
    top: height * 0.25,
    right: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: width,
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  emblemCard: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  emblemGlowRing: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  iconCore: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWrap: {
    alignItems: 'center',
    gap: 8,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(2, 132, 199, 0.25)',
    marginBottom: 4,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 4.5,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 64,
    width: width * 0.42,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressThumb: {
    height: '100%',
    borderRadius: 2,
  },
});
