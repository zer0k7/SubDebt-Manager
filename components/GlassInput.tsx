import { useTheme } from '../hooks/useTheme';
import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';

interface GlassInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({ label, error, style, onFocus, onBlur, ...props }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, isFocused && styles.inputFocused, error && styles.inputError]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.text.placeholder}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { marginBottom: 14 },
  label: { color: colors.text.secondary, fontSize: 13, marginBottom: 8, fontWeight: '500' },
  inputWrap: {
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: 'rgba(79,195,247,0.5)',
  },
  inputError: {
    borderColor: colors.accent.red,
  },
  input: {
    color: colors.text.primary,
    fontSize: 15,
    height: '100%',
  },
  errorText: {
    color: colors.accent.red,
    fontSize: 12,
    marginTop: 4,
  },
});
