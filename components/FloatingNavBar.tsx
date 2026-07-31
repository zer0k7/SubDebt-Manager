import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

interface TabConfig {
  key: string;
  name: string;
  label: string;
  icon: string;
  activeIcon: string;
}

const tabs: TabConfig[] = [
  { key: 'home', name: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'subscriptions', name: 'subscriptions', label: 'Subs', icon: 'card-outline', activeIcon: 'card' },
  { key: 'owed', name: 'owed', label: 'Owed', icon: 'swap-horizontal-outline', activeIcon: 'swap-horizontal' },
  { key: 'spending', name: 'spending', label: 'Spend', icon: 'receipt-outline', activeIcon: 'receipt' },
];

export interface CustomTabBarProps extends BottomTabBarProps {
  onAddPress?: () => void;
  isMenuOpen?: boolean;
}

export const FloatingNavBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation, onAddPress, isMenuOpen }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { bottom: insets.bottom > 0 ? insets.bottom + 10 : 24 }]}>
      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tabConfig = tabs.find(t => t.name === route.name);

          if (!tabConfig) return null;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <React.Fragment key={route.key}>
              {index === 2 && <View style={styles.spacer} />}
              
              <TouchableOpacity
                style={styles.tab}
                onPress={onPress}
                activeOpacity={0.7}
              >
                {/* Material 3 Style Active Pill Indicator */}
                <View style={styles.iconContainer}>
                  {isFocused && <View style={styles.activePill} />}
                  <Ionicons
                    name={(isFocused ? tabConfig.activeIcon : tabConfig.icon) as any}
                    size={22}
                    color={isFocused ? colors.accent.blue : colors.text.tertiary}
                  />
                </View>
                
                <Text style={[styles.label, isFocused && styles.labelActive, !isFocused && { color: colors.text.tertiary }]}>
                  {tabConfig.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

export const CenteredFAB: React.FC<{ onPress: () => void; isMenuOpen: boolean }> = ({ onPress, isMenuOpen }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(rotation, {
      toValue: isMenuOpen ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 40,
    }).start();
  }, [isMenuOpen]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, friction: 8 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }),
    ]).start();
    onPress();
  };

  const navbarBottom = insets.bottom > 0 ? insets.bottom + 10 : 24;
  const fabBottom = navbarBottom + 62 / 2 - 56 / 2;

  return (
    <TouchableOpacity
      style={[styles.fabWrapper, { bottom: fabBottom }]}
      activeOpacity={0.9}
      onPress={handlePress}
    >
      <Animated.View style={[
        styles.fab,
        {
          backgroundColor: isMenuOpen ? colors.accent.red : colors.accent.blue,
          transform: [{ rotate: spin }, { scale }],
          shadowColor: isMenuOpen ? colors.accent.red : colors.accent.blue,
          borderColor: isDark ? '#12121c' : '#ffffff',
        }
      ]}>
        <Ionicons name="add" size={28} color="#fff" />
      </Animated.View>
    </TouchableOpacity>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 64,
    borderRadius: 32,
    backgroundColor: isDark ? 'rgba(18, 18, 28, 0.94)' : 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.5 : 0.12,
    shadowRadius: 16,
    ...Platform.select({ android: { elevation: 24 } }),
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  spacer: {
    width: 60,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 60,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activePill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(79, 195, 247, 0.16)' : 'rgba(2, 132, 199, 0.1)',
  },
  label: {
    color: colors.text.tertiary,
    fontSize: 10,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.accent.blue,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    width: 56,
    height: 56,
    alignItems: 'center',
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
    borderWidth: 3,
  },
});
