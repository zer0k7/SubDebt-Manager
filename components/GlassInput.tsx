import { useTheme } from '../hooks/useTheme';
import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text, Platform } from 'react-native';

interface GlassInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({ label, error, style, onFocus, onBlur, multiline, ...props }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark, !!multiline);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, isFocused && styles.inputFocused, error && styles.inputError]}>
        <TextInput
          multiline={multiline}
          style={[styles.input, multiline && styles.multilineInput, style]}
          placeholderTextColor={isDark ? colors.text.placeholder : '#94A3B8'}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean, isMultiline: boolean) => StyleSheet.create({
  container: { marginBottom: 14 },
  label: {
    color: isDark ? colors.text.secondary : '#475569',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrap: {
    backgroundColor: isDark ? 'rgba(18, 18, 28, 0.88)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: isMultiline ? undefined : 48,
    minHeight: isMultiline ? 90 : 48,
    paddingVertical: isMultiline ? 10 : 0,
    justifyContent: isMultiline ? 'flex-start' : 'center',
    elevation: isDark ? 1 : 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowRadius: 3,
  },
  inputFocused: {
    borderColor: colors.accent.blue || '#38BDF8',
  },
  inputError: {
    borderColor: colors.accent.red,
  },
  input: {
    color: colors.text.primary,
    fontSize: 15,
    height: isMultiline ? undefined : '100%',
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: Platform.OS === 'ios' ? 0 : 2,
    lineHeight: 22,
  },
  errorText: {
    color: colors.accent.red,
    fontSize: 12,
    marginTop: 4,
  },
});
