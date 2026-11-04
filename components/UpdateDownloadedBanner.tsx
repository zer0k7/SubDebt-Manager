import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

interface UpdateDownloadedBannerProps {
  visible: boolean;
  onRestart: () => void;
  onDismiss: () => void;
}

export const UpdateDownloadedBanner: React.FC<UpdateDownloadedBannerProps> = ({
  visible,
  onRestart,
  onDismiss,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, isDark, insets.bottom);

  if (!visible) {
    return null;
  }

  const handleRestartPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRestart();
  };

  const handleDismissPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  return (
    <View style={styles.floatingContainer}>
      <View style={styles.bannerCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-download-outline" size={20} color={colors.accent.green} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.bannerTitle}>Update Ready to Install</Text>
          <Text style={styles.bannerSubtitle}>Restart SubDebt to complete update</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.restartBtn}
            onPress={handleRestartPress}
            activeOpacity={0.8}
          >
            <Text style={styles.restartBtnText}>Restart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={handleDismissPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean, bottomInset: number) =>
  StyleSheet.create({
    floatingContainer: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: Math.max(bottomInset + 16, 24),
      zIndex: 9999,
      elevation: 10,
    },
    bannerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : 'rgba(5, 150, 105, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    textContainer: {
      flex: 1,
      marginRight: 8,
    },
    bannerTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text.primary,
    },
    bannerSubtitle: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.text.secondary,
      marginTop: 2,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    restartBtn: {
      backgroundColor: colors.accent.green,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
    },
    restartBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    dismissBtn: {
      padding: 4,
    },
  });
