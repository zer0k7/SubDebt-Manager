import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FloatingNavBar, CenteredFAB } from '../../components/FloatingNavBar';
import { QuickAddMenu } from '../../components/QuickAddMenu';
import { useTheme } from '../../hooks/useTheme';

export default function TabsLayout() {
  const { colors } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <Tabs
        initialRouteName="home"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <FloatingNavBar
            {...props}
            isMenuOpen={isMenuOpen}
            onAddPress={() => setIsMenuOpen(!isMenuOpen)}
          />
        )}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="subscriptions" />
        <Tabs.Screen name="owed" />
        <Tabs.Screen name="spending" />
      </Tabs>

      {/* Standalone FAB - Fixed touch blocking and 4-tab perfect symmetry */}
      <CenteredFAB
        onPress={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
      />

      <QuickAddMenu visible={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </GestureHandlerRootView>
  );
}
