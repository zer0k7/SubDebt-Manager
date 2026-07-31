import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { spacing } from '../constants/typography';

interface SwipeableRowProps {
  children?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({ 
  children, 
  onEdit, 
  onDelete,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-160, 0],
      outputRange: [0, 160],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.actionsContainer}>
        {onEdit && (
          <Animated.View style={[styles.action, styles.editAction, { transform: [{ translateX: trans }] }]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onEdit();
              }}
            >
              <Ionicons name="create-outline" size={24} color={colors.text.primary} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        {onDelete && (
          <Animated.View style={[styles.action, styles.deleteAction, { transform: [{ translateX: trans }] }]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDelete();
              }}
            >
              <Ionicons name="trash-outline" size={24} color={colors.text.primary} />
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    width: 140,
    marginRight: spacing.base,
  },
  action: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginLeft: spacing.xs,
  },
  editAction: {
    backgroundColor: colors.accent.blue + '33', // 20% opacity
    borderWidth: 1,
    borderColor: colors.accent.blue + '66', // 40% opacity
  },
  deleteAction: {
    backgroundColor: colors.accent.red + '33', // 20% opacity
    borderWidth: 1,
    borderColor: colors.accent.red + '66', // 40% opacity
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  actionText: {
    color: colors.text.primary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
});
