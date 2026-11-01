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
  { key: 'accounts', name: 'accounts', label: 'Banks', icon: 'business-outline', activeIcon: 'business' },
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
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={(isFocused ? tabConfig.activeIcon : tabConfig.icon) as any}
                  size={isFocused ? 22 : 20}
                  color={isFocused ? colors.accent.blue : colors.text.tertiary}
                />
                <Text
                  style={[styles.label, isFocused && styles.labelActive]}
                  numberOfLines={1}
                >
                  {tabConfig.label}
                </Text>
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: isFocused ? colors.accent.blue : 'transparent' },
                  ]}
                />
              </View>
            </TouchableOpacity>
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
      friction: 7,
      tension: 60,
    }).start();
  }, [isMenuOpen]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '135deg'] });

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.84, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const navbarBottom = insets.bottom > 0 ? insets.bottom + 10 : 24;
  const fabBottom = navbarBottom + 74;
  const activeColor = isMenuOpen ? colors.accent.red : colors.accent.blue;

  return (
    <TouchableOpacity
      style={[styles.fabWrapper, { bottom: fabBottom }]}
      activeOpacity={0.9}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.fab,
          {
            backgroundColor: isDark ? '#08080c' : '#FFFFFF',
            transform: [{ rotate: spin }, { scale }],
            shadowColor: activeColor,
            borderColor: activeColor,
          },
        ]}
      >
        <Ionicons name="add" size={28} color={activeColor} />
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
    backgroundColor: isDark ? 'rgba(10, 10, 14, 0.96)' : 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
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
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeIndicator: {
    width: 14,
    height: 3,
    borderRadius: 2,
    marginTop: 2,
  },
  label: {
    color: colors.text.tertiary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.accent.blue,
    fontWeight: '800',
  },
});

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    right: 20,
    width: 54,
    height: 54,
    alignItems: 'center',
    zIndex: 100,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
    borderWidth: 2.5,
  },
});
