import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

interface QuickAddMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface ActionItem {
  id: string;
  title: string;
  label: string;
  icon: string;
  route: string;
  colorKey: 'amber' | 'blue' | 'red' | 'green';
  angle: number;
}

const { width, height } = Dimensions.get('window');
const SATELLITE_RADIUS = 126;

const ACTION_ITEMS: ActionItem[] = [
  {
    id: 'spending',
    title: 'Daily Spend',
    label: 'SPEND',
    icon: 'receipt-outline',
    route: '/modals/add-spending',
    colorKey: 'amber',
    angle: 155,
  },
  {
    id: 'subscription',
    title: 'Subscription',
    label: 'SUB',
    icon: 'card-outline',
    route: '/modals/add-subscription',
    colorKey: 'blue',
    angle: 118,
  },
  {
    id: 'debt',
    title: 'Borrowed Debt',
    label: 'DEBT',
    icon: 'trending-down-outline',
    route: '/modals/add-debt',
    colorKey: 'red',
    angle: 62,
  },
  {
    id: 'credit',
    title: 'Lent Credit',
    label: 'LENT',
    icon: 'trending-up-outline',
    route: '/modals/add-credit',
    colorKey: 'green',
    angle: 25,
  },
];

export const QuickAddMenu: React.FC<QuickAddMenuProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const backdropProgress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropProgress.value = withTiming(1, { duration: 200 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      backdropProgress.value = withTiming(0, { duration: 160 });
    }
  }, [visible, backdropProgress]);

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropProgress.value,
    };
  });

  const promptStyle = useAnimatedStyle(() => {
    const scale = interpolate(backdropProgress.value, [0, 1], [0.8, 1], Extrapolation.CLAMP);
    const translateY = interpolate(backdropProgress.value, [0, 1], [10, 0], Extrapolation.CLAMP);
    return {
      opacity: backdropProgress.value,
      transform: [{ scale }, { translateY }],
    };
  });

  const handleItemPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 140);
  };

  const navbarBottom = insets.bottom > 0 ? insets.bottom + 10 : 24;
  const originY = height - (navbarBottom + 32);
  const originX = width / 2;

  const colorTokens = {
    amber: colors.accent.amber || '#F59E0B',
    blue: colors.accent.blue || '#38BDF8',
    red: colors.accent.red || '#EF4444',
    green: colors.accent.green || '#10B981',
  };

  return (
    <Animated.View
      style={[styles.container, backdropStyle]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <BlurView
        intensity={isDark ? 28 : 20}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      </BlurView>

      <Animated.View
        style={[
          styles.promptBadge,
          {
            top: originY - 44,
            left: originX - 60,
            backgroundColor: isDark ? 'rgba(18, 24, 38, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          },
          promptStyle,
        ]}
        pointerEvents="none"
      >
        <View style={[styles.promptDot, { backgroundColor: colors.accent.blue }]} />
        <Text style={[styles.promptText, { color: colors.text.secondary }]}>RECORD ENTRY</Text>
      </Animated.View>

      {ACTION_ITEMS.map((item, index) => {
        const rad = (item.angle * Math.PI) / 180;
        const targetX = SATELLITE_RADIUS * Math.cos(rad);
        const targetY = -SATELLITE_RADIUS * Math.sin(rad);
        const itemColor = colorTokens[item.colorKey];

        return (
          <SatelliteItem
            key={item.id}
            item={item}
            index={index}
            visible={visible}
            targetX={targetX}
            targetY={targetY}
            originX={originX}
            originY={originY}
            itemColor={itemColor}
            isDark={isDark}
            onPress={() => handleItemPress(item.route)}
          />
        );
      })}
    </Animated.View>
  );
};

interface SatelliteItemProps {
  item: ActionItem;
  index: number;
  visible: boolean;
  targetX: number;
  targetY: number;
  originX: number;
  originY: number;
  itemColor: string;
  isDark: boolean;
  onPress: () => void;
}

const SatelliteItem: React.FC<SatelliteItemProps> = ({
  item,
  index,
  visible,
  targetX,
  targetY,
  originX,
  originY,
  itemColor,
  isDark,
  onPress,
}) => {
  const itemProgress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      itemProgress.value = withDelay(
        index * 28,
        withSpring(1, { damping: 13, stiffness: 190, mass: 0.65 })
      );
    } else {
      itemProgress.value = withTiming(0, { duration: 150 });
    }
  }, [visible, index, itemProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    const tx = interpolate(itemProgress.value, [0, 1], [0, targetX]);
    const ty = interpolate(itemProgress.value, [0, 1], [0, targetY]);
    const scale = interpolate(itemProgress.value, [0, 1], [0.15, 1], Extrapolation.CLAMP);
    const opacity = interpolate(itemProgress.value, [0, 0.25, 1], [0, 0.7, 1], Extrapolation.CLAMP);
    const rotate = interpolate(itemProgress.value, [0, 1], [-60, 0]) + 'deg';

    return {
      opacity,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale },
        { rotate },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.satelliteWrapper,
        {
          left: originX - 30,
          top: originY - 30,
        },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.satelliteDisc,
          {
            backgroundColor: isDark ? '#0C111C' : '#FFFFFF',
            borderColor: itemColor,
            shadowColor: itemColor,
          },
        ]}
        activeOpacity={0.75}
        onPress={onPress}
      >
        <View style={[styles.satelliteGlow, { backgroundColor: `${itemColor}18` }]}>
          <Ionicons name={item.icon as any} size={24} color={itemColor} />
        </View>
      </TouchableOpacity>

      <View
        style={[
          styles.labelBadge,
          {
            backgroundColor: isDark ? 'rgba(12, 17, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <Text style={[styles.labelText, { color: itemColor }]}>{item.label}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  promptBadge: {
    position: 'absolute',
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  promptDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  promptText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  satelliteWrapper: {
    position: 'absolute',
    width: 60,
    alignItems: 'center',
    zIndex: 101,
  },
  satelliteDisc: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  satelliteGlow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
