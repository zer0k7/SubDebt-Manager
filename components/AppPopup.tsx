import { useTheme } from '../hooks/useTheme';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassButton } from './GlassButton';

export interface AppPopupProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const AppPopup: React.FC<AppPopupProps> = ({
  visible,
  title,
  message,
  icon = 'information-circle-outline',
  iconColor,
  confirmText = 'OK',
  cancelText,
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const resolvedIconColor = iconColor || colors.accent.blue;
  const [show, setShow] = useState(visible);
  const scaleValue = useRef(new Animated.Value(0.9)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(opacityValue, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleValue, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityValue, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleValue, { toValue: 0.9, duration: 200, useNativeDriver: true }),
      ]).start(() => setShow(false));
    }
  }, [visible]);

  if (!show) return null;

  return (
    <Modal transparent visible={show} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.overlayBg, { opacity: opacityValue }]} />
        <Animated.View style={[styles.dialog, { opacity: opacityValue, transform: [{ scale: scaleValue }] }]}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon as any} size={32} color={resolvedIconColor} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonCol}>
            <View style={styles.btnWrapper}>
              <GlassButton 
                title={confirmText} 
                variant={isDestructive ? 'danger' : 'primary'} 
                onPress={onConfirm} 
              />
            </View>
            {cancelText && (
              <View style={styles.btnWrapper}>
                <GlassButton title={cancelText} variant="secondary" onPress={onCancel} />
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: isDark ? 'rgba(30, 30, 45, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.glass.cardBorder,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDark ? 0.6 : 0.15,
    shadowRadius: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.glass.card,
    borderWidth: 1,
    borderColor: colors.glass.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonCol: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  btnWrapper: {
    width: '100%',
  },
});
