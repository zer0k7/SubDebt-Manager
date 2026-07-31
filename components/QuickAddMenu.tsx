import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

interface QuickAddMenuProps {
  visible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const MENU_ITEMS = [
  { id: 'subscription', title: 'Subscription', icon: 'card-outline', route: '/modals/add-subscription', color: 'blue' },
  { id: 'spending', title: 'Spending', icon: 'receipt-outline', route: '/modals/add-spending', color: 'purple' },
  { id: 'debt', title: 'Debt', icon: 'wallet-outline', route: '/modals/add-debt', color: 'amber' },
  { id: 'credit', title: 'Lent', icon: 'cash-outline', route: '/modals/add-credit', color: 'green' },
];

export const QuickAddMenu: React.FC<QuickAddMenuProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const styles = getStyles(colors, isDark);

  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = withSpring(1, { damping: 25, stiffness: 120, overshootClamping: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      progress.value = withTiming(0, { duration: 250 });
    }
  }, [visible, progress]);

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: interpolate(progress.value, [0, 1], [0.95, 1], Extrapolation.CLAMP) }
      ],
    };
  });

  const handleItemPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 150); // wait for menu to start closing before navigating
  };

  return (
    <Animated.View 
      style={[styles.container, overlayStyle]} 
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <BlurView intensity={isDark ? 40 : 20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      </BlurView>
      
      <Animated.View style={[styles.content, contentStyle]}>
        {MENU_ITEMS.map((item, index) => {
          const itemStyle = useAnimatedStyle(() => {
            const translateY = interpolate(
              progress.value,
              [0, 1],
              [50 + index * 20, 0],
              Extrapolation.CLAMP
            );
            const opacity = interpolate(
              progress.value,
              [0.2, 1],
              [0, 1],
              Extrapolation.CLAMP
            );
            return {
              opacity,
              transform: [{ translateY }],
            };
          });

          const colorMap: Record<string, string> = {
            blue: colors.accent.blue,
            purple: colors.accent.purple,
            amber: colors.accent.amber,
            green: colors.accent.green,
          };
          const iconColor = colorMap[item.color];

          return (
            <Animated.View key={item.id} style={[styles.itemWrapper, itemStyle]}>
              <TouchableOpacity
                style={styles.item}
                activeOpacity={0.7}
                onPress={() => handleItemPress(item.route)}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20`, borderColor: `${iconColor}50` }]}>
                  <Ionicons name={item.icon as any} size={24} color={iconColor} />
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Animated.View>
    </Animated.View>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)',
  },
  content: {
    position: 'absolute',
    bottom: 120, // above the tab bar
    left: 20,
    right: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  itemWrapper: {
    width: '46%',
  },
  item: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? 'rgba(30, 30, 45, 0.9)' : 'rgba(255, 255, 255, 0.95)',
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
});
