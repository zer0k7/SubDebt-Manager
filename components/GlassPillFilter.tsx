import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { borderRadius, typography, spacing } from '../constants/typography';

interface FilterOption {
  key: string;
  label: string;
}

interface GlassPillFilterProps {
  options: FilterOption[];
  selected: string;
  onSelect: (key: string) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const GlassPillFilter: React.FC<GlassPillFilterProps> = ({ 
  options, 
  selected, 
  onSelect,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = option.key === selected;
        
        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.pill,
              isActive && styles.pillActive,
            ]}
            onPress={() => onSelect(option.key)}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.text,
              isActive && styles.textActive,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.card,
    borderWidth: 1,
    borderColor: colors.glass.cardBorder,
  },
  pillActive: {
    backgroundColor: 'rgba(79,195,247,0.2)',
    borderColor: 'rgba(79,195,247,0.5)',
    shadowColor: colors.accent.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  text: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  textActive: {
    color: colors.accent.blue,
    fontWeight: '600',
  },
});
