import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

interface MasterPasswordModalProps {
  visible: boolean;
  mode: 'setup' | 'decrypt';
  onClose: () => void;
  onSubmit: (password: string) => void;
  onDisable?: () => void;
  error?: string;
  hasExistingPassword?: boolean;
}

export const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  visible,
  mode,
  onClose,
  onSubmit,
  onDisable,
  error,
  hasExistingPassword,
}) => {
  const { colors, isDark } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleReset = () => {
    setPassword('');
    setConfirmPassword('');
    setValidationError('');
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = () => {
    setValidationError('');
    if (!password.trim()) {
      setValidationError('Password cannot be empty');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (mode === 'setup') {
      if (password.length < 6) {
        setValidationError('Password must be at least 6 characters');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(password);
    setPassword('');
    setConfirmPassword('');
  };

  const displayError = validationError || error;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleReset}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: colors.glass.cardBorder }]}>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.accent.blue}18` }]}>
              <Ionicons
                name={mode === 'setup' ? 'key-outline' : 'lock-closed-outline'}
                size={22}
                color={colors.accent.blue}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                {mode === 'setup'
                  ? hasExistingPassword
                    ? 'Change Master Password'
                    : 'Set Master Password'
                  : 'Encrypted Vault Password'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.muted }]}>
                {mode === 'setup'
                  ? 'Protects your cloud backups with AES-256-GCM encryption.'
                  : 'Enter password to decrypt and restore this backup file.'}
              </Text>
            </View>
          </View>

          {displayError ? (
            <View style={[styles.errorBox, { backgroundColor: `${colors.accent.red}15` }]}>
              <Ionicons name="alert-circle" size={15} color={colors.accent.red} />
              <Text style={[styles.errorText, { color: colors.accent.red }]}>
                {displayError}
              </Text>
            </View>
          ) : null}

          <View style={styles.inputsWrap}>
            <View style={[styles.inputRow, { borderColor: colors.glass.cardBorder, backgroundColor: colors.glass.card }]}>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder={mode === 'setup' ? 'Master password (min 6 chars)' : 'Enter password'}
                placeholderTextColor={colors.text.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  setValidationError('');
                }}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
            </View>

            {mode === 'setup' && (
              <View style={[styles.inputRow, { borderColor: colors.glass.cardBorder, backgroundColor: colors.glass.card }]}>
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="Confirm master password"
                  placeholderTextColor={colors.text.muted}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    setValidationError('');
                  }}
                  autoCapitalize="none"
                />
              </View>
            )}
          </View>

          <View style={styles.actionsRow}>
            {mode === 'setup' && hasExistingPassword && onDisable && (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: `${colors.accent.red}18` }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onDisable();
                  handleReset();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnText, { color: colors.accent.red }]}>
                  Disable
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, { color: colors.text.muted }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.submitBtn, { backgroundColor: colors.accent.blue }]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>
                {mode === 'setup' ? 'Save Password' : 'Decrypt & Restore'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputsWrap: {
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
