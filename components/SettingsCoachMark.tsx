import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

interface SettingsCoachMarkProps {
  visible: boolean;
  onDismiss: () => void;
  onPressSettings: () => void;
}

export const SettingsCoachMark: React.FC<SettingsCoachMarkProps> = ({
  visible,
  onDismiss,
  onPressSettings,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -4,
              duration: 1200,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 1200,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPressSettings();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ translateY: Animated.add(slideAnim, floatAnim) }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.arrowContainer}>
        <Svg width={72} height={42} viewBox="0 0 72 42">
          <Path
            d="M 12 38 C 22 20 44 8 64 6"
            stroke={isDark ? '#F1F5F9' : '#0F172A'}
            strokeWidth={2.4}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M 54 2 L 65 6 L 56 14"
            stroke={isDark ? '#F1F5F9' : '#0F172A'}
            strokeWidth={2.4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      <TouchableOpacity
        style={styles.card}
        onPress={handleCardPress}
        activeOpacity={0.88}
      >
        <Text style={styles.titleText}>Explore Settings & Vault</Text>
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>New</Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close"
            size={16}
            color={colors.text.secondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 68,
      right: 14,
      zIndex: 9999,
      alignItems: 'flex-end',
    },
    arrowContainer: {
      marginRight: 10,
      marginBottom: -4,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#182032' : '#FFFFFF',
      borderRadius: 999,
      paddingVertical: 9,
      paddingLeft: 16,
      paddingRight: 10,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.18,
      shadowRadius: 10,
      elevation: 10,
      gap: 10,
    },
    titleText: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    newBadge: {
      backgroundColor: '#8B5CF6',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    newBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    closeBtn: {
      padding: 2,
      marginLeft: 2,
    },
  });
