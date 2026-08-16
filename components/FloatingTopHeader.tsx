import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface FloatingTopHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  rightActions?: React.ReactNode;
  leftAction?: React.ReactNode;
  children?: React.ReactNode;
  style?: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 380;

export const FloatingTopHeader: React.FC<FloatingTopHeaderProps> = ({
  title,
  subtitle,
  rightActions,
  leftAction,
  children,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  return (
    <View style={[styles.floatingContainer, style]}>
      <View style={styles.topRow}>
        {/* Left Action (if any) */}
        {leftAction && <View style={styles.leftWrap}>{leftAction}</View>}

        {/* Title & Subtitle */}
        <View style={styles.titleWrap}>
          {typeof title === 'string' ? (
            <Text style={styles.titleText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {title}
            </Text>
          ) : (
            title
          )}
          {subtitle && (
            <Text style={styles.subtitleText} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Actions */}
        {rightActions && <View style={styles.rightActionsWrap}>{rightActions}</View>}
      </View>

      {/* Optional sub-row (search bar, filter tabs, etc.) */}
      {children && <View style={styles.childWrap}>{children}</View>}
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    floatingContainer: {
      marginHorizontal: isSmallScreen ? 10 : 14,
      marginTop: Platform.OS === 'android' ? 6 : 4,
      marginBottom: 10,
      paddingHorizontal: isSmallScreen ? 12 : 16,
      paddingVertical: 10,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(18, 18, 28, 0.92)' : 'rgba(255, 255, 255, 0.96)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      elevation: 8,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 10,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      minHeight: 40,
    },
    leftWrap: {
      marginRight: 6,
      justifyContent: 'center',
    },
    titleWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    titleText: {
      color: colors.text.primary,
      fontSize: isSmallScreen ? 18 : 20,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    subtitleText: {
      color: colors.text.muted,
      fontSize: isSmallScreen ? 10 : 11,
      fontWeight: '500',
      marginTop: 1,
    },
    rightActionsWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    childWrap: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    },
  });
