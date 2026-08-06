import { useTheme } from '../hooks/useTheme';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';

interface SecurityLockOverlayProps {
  visible: boolean;
  onUnlockSuccess: () => void;
  correctPin?: string | null;
  allowBiometric?: boolean;
}

export const SecurityLockOverlay: React.FC<SecurityLockOverlayProps> = ({
  visible,
  onUnlockSuccess,
  correctPin,
  allowBiometric = true,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto trigger biometrics when modal appears
  useEffect(() => {
    if (visible && allowBiometric) {
      triggerBiometricAuth();
    }
  }, [visible, allowBiometric]);

  const triggerBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const res = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock SubDebt Vault',
          fallbackLabel: 'Use Security PIN',
          cancelLabel: 'Cancel',
        });

        if (res.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setEnteredPin('');
          setErrorMsg('');
          onUnlockSuccess();
        }
      }
    } catch {}
  };

  const handleKeyPress = (num: string) => {
    if (enteredPin.length >= 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const nextPin = enteredPin + num;
    setEnteredPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === 4) {
      if (correctPin && nextPin === correctPin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEnteredPin('');
        setErrorMsg('');
        onUnlockSuccess();
      } else if (correctPin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrorMsg('Incorrect PIN. Try again.');
        setTimeout(() => setEnteredPin(''), 400);
      } else {
        // Default master PIN fallback 0000 or custom success
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEnteredPin('');
        onUnlockSuccess();
      }
    }
  };

  const handleDelete = () => {
    if (enteredPin.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEnteredPin((prev) => prev.slice(0, -1));
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.lockIconBox}>
            <Ionicons name="lock-closed" size={32} color={colors.accent.purple} />
          </View>

          <Text style={styles.title}>SUBDEBT VAULT LOCKED</Text>
          <Text style={styles.subtitle}>Enter 4-Digit Security PIN or scan Fingerprint</Text>

          {/* PIN Dots Display */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((i) => {
              const isFilled = enteredPin.length > i;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    isFilled && { backgroundColor: colors.accent.purple, borderColor: colors.accent.purple },
                  ]}
                />
              );
            })}
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          {/* Keypad Grid */}
          <View style={styles.keypad}>
            {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.keyTile}
                    onPress={() => handleKeyPress(num)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.keyText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            <View style={styles.keypadRow}>
              <TouchableOpacity style={styles.keyTile} onPress={triggerBiometricAuth} activeOpacity={0.7}>
                <Ionicons name="finger-print" size={24} color={colors.accent.purple} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.keyTile} onPress={() => handleKeyPress('0')} activeOpacity={0.7}>
                <Text style={styles.keyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keyTile} onPress={handleDelete} activeOpacity={0.7}>
                <Ionicons name="backspace-outline" size={22} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: isDark ? '#0C0C14' : '#0F172A',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      alignItems: 'center',
      gap: 16,
    },
    lockIconBox: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(124, 58, 237, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(124, 58, 237, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 1,
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: 12,
      textAlign: 'center',
    },
    dotsRow: {
      flexDirection: 'row',
      gap: 16,
      marginVertical: 12,
    },
    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      backgroundColor: 'transparent',
    },
    errorText: {
      color: '#EF4444',
      fontSize: 12,
      fontWeight: '700',
    },
    keypad: {
      width: '100%',
      gap: 12,
      marginTop: 10,
    },
    keypadRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    keyTile: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyText: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: '700',
    },
  });
