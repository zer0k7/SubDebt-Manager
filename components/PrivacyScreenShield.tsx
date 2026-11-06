import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, AppState, AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';

export const PrivacyScreenShield: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [shieldActive, setShieldActive] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const checkEnabled = async () => {
      try {
        const val = await storage.getString(STORAGE_KEYS.PRIVACY_SCREEN_ENABLED);
        setIsEnabled(val === 'true');
      } catch {
        setIsEnabled(false);
      }
    };
    checkEnabled();

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      try {
        if (nextAppState === 'active') {
          setShieldActive(false);
          await checkEnabled();
        } else {
          const val = await storage.getString(STORAGE_KEYS.PRIVACY_SCREEN_ENABLED);
          if (val === 'true') {
            setShieldActive(true);
          }
        }
      } catch {
        setShieldActive(false);
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, []);

  if (!shieldActive) {
    return null;
  }

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background.primary }]}>
      <View style={styles.centerCard}>
        <View style={[styles.iconWrap, { backgroundColor: `${colors.accent.blue}18` }]}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.logo}
          />
        </View>

        <Text style={[styles.title, { color: colors.text.primary }]}>
          SubDebt Manager
        </Text>

        <View style={styles.badgeRow}>
          <Ionicons name="lock-closed" size={12} color={colors.accent.blue} />
          <Text style={[styles.badgeText, { color: colors.accent.blue }]}>
            Protected View Active
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCard: {
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
