import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface GlassButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ title, variant = 'primary', size = 'medium', leftIcon, rightIcon, style, ...props }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const content = (
    <View style={[styles.content, size === 'small' && styles.sm, size === 'large' && styles.lg]}>
      {leftIcon}
      <Text style={[styles.text, styles[`text_${variant}` as keyof typeof styles] as any, size === 'small' && { fontSize: 13 }, size === 'large' && { fontSize: 16 }]}>{title}</Text>
      {rightIcon}
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity style={[styles.btn, styles.btnPrimary, style]} activeOpacity={0.75} {...props}>
        <LinearGradient colors={['#4FC3F7', '#1976D2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.btn, variant === 'secondary' && styles.btnSecondary, variant === 'danger' && styles.btnDanger, variant === 'ghost' && styles.btnGhost, style]} activeOpacity={0.75} {...props}>
      {content}
    </TouchableOpacity>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  btn: { borderRadius: 14, overflow: 'hidden' },
  btnPrimary: { elevation: 4 },
  btnSecondary: { backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)' },
  btnDanger: { backgroundColor: 'rgba(239,83,80,0.12)', borderWidth: 0.5, borderColor: 'rgba(239,83,80,0.3)' },
  btnGhost: { backgroundColor: 'transparent' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  sm: { paddingHorizontal: 12, paddingVertical: 8 },
  lg: { paddingHorizontal: 24, paddingVertical: 15 },
  text: { fontSize: 15, fontWeight: '600' },
  text_primary: { color: colors.text.primary },
  text_secondary: { color: colors.text.primary },
  text_danger: { color: colors.accent.red },
  text_ghost: { color: colors.text.muted },
});
