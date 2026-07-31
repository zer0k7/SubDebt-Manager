import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#66BB6A', '#4FC3F7', '#FFB74D', '#EF5350',
  '#AB47BC', '#26C6DA', '#FF7043', '#9CCC65',
  '#7E57C2', '#29B6F6', '#FFA726', '#EC407A',
];

const CONFETTI_COUNT = 50;
const PARTICLE_SHAPES = ['square', 'rect', 'circle'] as const;

interface ConfettiParticle {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: typeof PARTICLE_SHAPES[number];
  startX: number;
}

interface ConfettiProps {
  visible: boolean;
  onComplete?: () => void;
}

export const Confetti: React.FC<ConfettiProps> = ({ visible, onComplete }) => {
  const particles = useRef<ConfettiParticle[]>([]);
  const hasAnimated = useRef(false);

  // Initialize particles once
  if (particles.current.length === 0) {
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const startX = Math.random() * SCREEN_WIDTH;
      particles.current.push({
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        rotation: new Animated.Value(0),
        opacity: new Animated.Value(0),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 6,
        shape: PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)],
        startX,
      });
    }
  }

  useEffect(() => {
    if (!visible || hasAnimated.current) return;
    hasAnimated.current = true;

    const animations = particles.current.map((p, i) => {
      const delay = Math.random() * 300;
      const duration = 2000 + Math.random() * 1500;
      const horizontalDrift = (Math.random() - 0.5) * SCREEN_WIDTH * 0.6;

      // Reset
      p.y.setValue(-20);
      p.x.setValue(0);
      p.rotation.setValue(0);
      p.opacity.setValue(1);

      return Animated.parallel([
        // Fall down
        Animated.timing(p.y, {
          toValue: SCREEN_HEIGHT + 40,
          duration,
          delay,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        // Drift sideways
        Animated.timing(p.x, {
          toValue: horizontalDrift,
          duration,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        // Spin
        Animated.timing(p.rotation, {
          toValue: 3 + Math.random() * 6,
          duration,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Fade out near bottom
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: duration * 0.4,
          delay: delay + duration * 0.6,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      hasAnimated.current = false;
      onComplete?.();
    });
  }, [visible]);

  // Reset when hidden
  useEffect(() => {
    if (!visible) {
      hasAnimated.current = false;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((p, i) => {
        const rotation = p.rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        const getShape = () => {
          switch (p.shape) {
            case 'circle':
              return { borderRadius: p.size / 2 };
            case 'rect':
              return { width: p.size * 0.5, height: p.size * 1.2 };
            default:
              return {};
          }
        };

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: p.startX,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { rotate: rotation },
                ],
              },
              getShape(),
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  particle: {
    position: 'absolute',
    top: -10,
    borderRadius: 2,
  },
});
