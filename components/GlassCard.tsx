import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
  children?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, ...props }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
  },
});
