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
  icon: string;
  route: string;
  colorKey: 'amber' | 'blue' | 'purple' | 'red' | 'green';
}

const ACTION_ITEMS: ActionItem[] = [
  {
    id: 'spending',
    title: 'Daily Spend',
    icon: 'receipt-outline',
    route: '/modals/add-spending',
    colorKey: 'amber',
  },
  {
    id: 'subscription',
    title: 'Subscription',
    icon: 'card-outline',
    route: '/modals/add-subscription',
    colorKey: 'blue',
  },
  {
    id: 'account',
    title: 'Bank / Passbook',
    icon: 'business-outline',
    route: '/modals/add-account-transaction',
    colorKey: 'purple',
  },
  {
    id: 'debt',
    title: 'Borrowed Debt',
    icon: 'trending-down-outline',
    route: '/modals/add-debt',
    colorKey: 'red',
  },
  {
    id: 'credit',
    title: 'Lent Credit',
    icon: 'trending-up-outline',
    route: '/modals/add-credit',
    colorKey: 'green',
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

  const handleItemPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 120);
  };

  const navbarBottom = insets.bottom > 0 ? insets.bottom + 10 : 24;
  const fabBottom = navbarBottom + 74;

  const colorTokens = {
    amber: colors.accent.amber || '#F59E0B',
    blue: colors.accent.blue || '#38BDF8',
    purple: colors.accent.purple || '#8B5CF6',
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

      {ACTION_ITEMS.map((item, index) => {
        const itemBottom = fabBottom + 66 + index * 62;
        const itemColor = colorTokens[item.colorKey];

        return (
          <SpeedDialRow
            key={item.id}
            item={item}
            index={index}
            visible={visible}
            bottom={itemBottom}
            itemColor={itemColor}
            isDark={isDark}
            onPress={() => handleItemPress(item.route)}
          />
        );
      })}
    </Animated.View>
  );
};

interface SpeedDialRowProps {
  item: ActionItem;
  index: number;
  visible: boolean;
  bottom: number;
  itemColor: string;
  isDark: boolean;
  onPress: () => void;
}

const SpeedDialRow: React.FC<SpeedDialRowProps> = ({
  item,
  index,
  visible,
  bottom,
  itemColor,
  isDark,
  onPress,
}) => {
  const itemProgress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      itemProgress.value = withDelay(
        index * 32,
        withSpring(1, { damping: 14, stiffness: 210, mass: 0.6 })
      );
    } else {
      itemProgress.value = withTiming(0, { duration: 140 });
    }
  }, [visible, index, itemProgress]);

  const rowAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(itemProgress.value, [0, 1], [24, 0], Extrapolation.CLAMP);
    const scale = interpolate(itemProgress.value, [0, 1], [0.35, 1], Extrapolation.CLAMP);
    const opacity = interpolate(itemProgress.value, [0, 0.2, 1], [0, 0.6, 1], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.rowWrapper,
        {
          bottom,
          right: 23,
        },
        rowAnimatedStyle,
      ]}
    >
      <TouchableOpacity
        style={styles.touchableRow}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <View
          style={[
            styles.labelBadge,
            {
              backgroundColor: isDark ? 'rgba(10, 10, 14, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <View style={[styles.labelDot, { backgroundColor: itemColor }]} />
          <Text style={[styles.labelText, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
            {item.title}
          </Text>
        </View>

        <View
          style={[
            styles.circleBtn,
            {
              backgroundColor: isDark ? '#08080c' : '#FFFFFF',
              borderColor: itemColor,
              shadowColor: itemColor,
            },
          ]}
        >
          <View style={[styles.circleGlow, { backgroundColor: `${itemColor}18` }]}>
            <Ionicons name={item.icon as any} size={22} color={itemColor} />
          </View>
        </View>
      </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  rowWrapper: {
    position: 'absolute',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 101,
  },
  touchableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 6,
  },
  circleGlow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
