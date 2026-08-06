import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Animated, Image, TouchableOpacity, AppState } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { hydrateStorage } from '../storage/mmkv';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { Ionicons } from '@expo/vector-icons';

SplashScreen.preventAutoHideAsync();

import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { AuthLockProvider } from '../context/AuthLockContext';
import { registerForPushNotificationsAsync } from '../utils/notificationHelpers';
import { authenticate } from '../utils/authHelpers';
import { checkForUpdate, UpdateInfo } from '../utils/updateChecker';
import { UpdatePrompt } from '../components/UpdatePrompt';

function AppLayout() {
  const { colors, isDark } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialAuthDone, setInitialAuthDone] = useState(false);
  const [showLockOverlay, setShowLockOverlay] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  
  const handleAuth = async (isResume = false) => {
    if (isResume) {
      setShowLockOverlay(true);
    }
    const success = await authenticate();
    setIsAuthenticated(success);
    if (isResume) {
      setShowLockOverlay(!success);
    } else {
      setInitialAuthDone(true);
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync();
    handleAuth(false);

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        handleAuth(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (!initialAuthDone || !isAuthenticated) return;

    const navigate = async () => {
      const hasSeen = await storage.getString(STORAGE_KEYS.HAS_SEEN_ONBOARDING);
      if (hasSeen === 'true') {
        const defaultTab = await storage.getString('default_launch_tab');
        const tab = defaultTab && ['home', 'subscriptions', 'owed', 'spending'].includes(defaultTab) 
          ? defaultTab 
          : 'home';
        router.replace(`/(tabs)/${tab}` as any);
      }

      const info = await checkForUpdate();
      if (info?.available) {
        setUpdateInfo(info);
        setShowUpdatePrompt(true);
      }
    };
    navigate();
  }, [initialAuthDone, isAuthenticated]);

  if (!initialAuthDone) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.accent.blue} />
      </View>
    );
  }

  if (!isAuthenticated && !showLockOverlay) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <Ionicons name="lock-closed" size={64} color={colors.accent.blue} style={{ marginBottom: 20 }} />
        <Text style={{ color: colors.text.primary, fontSize: 18, marginBottom: 30 }}>App Locked</Text>
        <TouchableOpacity 
          onPress={() => handleAuth(false)}
          style={{ 
            backgroundColor: colors.accent.blue, 
            paddingHorizontal: 30, 
            paddingVertical: 12, 
            borderRadius: 25 
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modals/add-subscription" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/edit-subscription" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/add-debt" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/edit-debt" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/settings" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/add-spending" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/edit-spending" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/add-credit" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/edit-credit" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/export-pdf" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/tool-health-audit" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/tool-reminder-generator" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/tool-debt-payoff" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/tool-currency-converter" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
    </Stack>

      {showLockOverlay && (
        <View style={[styles.lockOverlay, { backgroundColor: colors.background.primary }]}>
          <Ionicons name="lock-closed" size={64} color={colors.accent.blue} style={{ marginBottom: 20 }} />
          <Text style={{ color: colors.text.primary, fontSize: 18, marginBottom: 30 }}>App Locked</Text>
          <TouchableOpacity 
            onPress={() => handleAuth(true)}
            style={{ 
              backgroundColor: colors.accent.blue, 
              paddingHorizontal: 30, 
              paddingVertical: 12, 
              borderRadius: 25 
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Unlock</Text>
          </TouchableOpacity>
        </View>
      )}

      {updateInfo && (
        <UpdatePrompt
          visible={showUpdatePrompt}
          updateInfo={updateInfo}
          onDismiss={() => setShowUpdatePrompt(false)}
        />
      )}
    </>
  );
}

import { CustomSplashScreen } from '../components/CustomSplashScreen';

import { SettingsProvider } from '../context/SettingsContext';

export default function RootLayout() {
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    hydrateStorage();
  }, []);

  if (!splashFinished) {
    return <CustomSplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthLockProvider>
          <AppLayout />
        </AuthLockProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  appName: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  loader: {
    position: 'absolute',
    bottom: 60,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
