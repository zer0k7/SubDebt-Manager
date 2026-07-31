import { useTheme } from '../hooks/useTheme';
import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accentColor?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value, onChangeText, placeholder = 'Search...', accentColor,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const resolvedAccentColor = accentColor || colors.accent.blue;
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.glass.cardBorder, resolvedAccentColor],
  });

  return (
    <Animated.View style={[styles.container, { borderColor }]}>
      <Ionicons
        name="search-outline"
        size={18}
        color={isFocused ? resolvedAccentColor : colors.text.muted}
      />
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.text.placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            inputRef.current?.blur();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={18} color={colors.text.muted} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 42,
    gap: 10,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 15,
    height: '100%',
  },
});
