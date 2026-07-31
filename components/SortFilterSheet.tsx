import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';

export type SortOption = {
  id: string;
  label: string;
  icon: string;
};

interface SortFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: SortOption[];
  selectedOptionId: string;
  onSelect: (id: string) => void;
}

export const SortFilterSheet: React.FC<SortFilterSheetProps> = ({
  visible,
  onClose,
  title,
  options,
  selectedOptionId,
  onSelect,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom + 16, 32);

  const handleSelect = (id: string) => {
    Haptics.selectionAsync();
    onSelect(id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View style={[styles.sheet, { paddingBottom: bottomPadding }]}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            {options.map((opt) => {
              const isSelected = opt.id === selectedOptionId;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  onPress={() => handleSelect(opt.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                      <Ionicons 
                        name={opt.icon as any} 
                        size={18} 
                        color={isSelected ? colors.accent.blue : colors.text.muted} 
                      />
                    </View>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                  </View>
                  
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.accent.blue} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: isDark ? 'rgba(20,20,32,0.95)' : 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 0.5,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    paddingBottom: 40,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  handleWrap: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionRowSelected: {
    backgroundColor: isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(2, 132, 199, 0.05)',
    borderColor: isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(2, 132, 199, 0.2)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapSelected: {
    backgroundColor: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(2, 132, 199, 0.1)',
  },
  optionLabel: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: colors.text.primary,
    fontWeight: '700',
  },
});
