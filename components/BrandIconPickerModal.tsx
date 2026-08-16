import React, { useState, useMemo } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, SafeAreaView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { IconKey } from '../utils/subscriptionIcons';
import { SubscriptionIcon } from './SubscriptionIcon';
import { subscriptionIconMap } from '../constants/subscriptionIconMap';
import { avatarColors } from '../constants/colors';

interface BrandIconPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectIcon: (iconKey?: IconKey, color?: string) => void;
  selectedIconKey?: string;
  selectedColor?: string;
}

const ALL_ICON_KEYS: IconKey[] = Array.from(new Set(Object.values(subscriptionIconMap))) as IconKey[];

export const BrandIconPickerModal: React.FC<BrandIconPickerModalProps> = ({
  visible,
  onClose,
  onSelectIcon,
  selectedIconKey,
  selectedColor,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'brands' | 'colors'>('brands');

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return ALL_ICON_KEYS;
    const q = search.toLowerCase().trim();
    return ALL_ICON_KEYS.filter((k) => k.toLowerCase().includes(q));
  }, [search]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Icon & Color</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'brands' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('brands');
              }}
            >
              <Ionicons name="grid-outline" size={16} color={activeTab === 'brands' ? colors.accent.blue : colors.text.muted} />
              <Text style={[styles.tabText, activeTab === 'brands' && styles.tabTextActive]}>Brand Icons</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'colors' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('colors');
              }}
            >
              <Ionicons name="color-palette-outline" size={16} color={activeTab === 'colors' ? colors.accent.blue : colors.text.muted} />
              <Text style={[styles.tabText, activeTab === 'colors' && styles.tabTextActive]}>Brand Colors</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'brands' ? (
            <>
              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color={colors.text.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search 50+ brand icons..."
                  placeholderTextColor={colors.text.muted}
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={18} color={colors.text.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Icon Grid */}
              <FlatList
                data={filteredIcons}
                keyExtractor={(item) => item}
                numColumns={4}
                contentContainerStyle={styles.gridContent}
                renderItem={({ item }) => {
                  const isSelected = selectedIconKey === item;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.iconItem,
                        isSelected && { borderColor: colors.accent.blue, backgroundColor: 'rgba(79,195,247,0.15)' }
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onSelectIcon(item, undefined);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <SubscriptionIcon name={item} size={44} />
                      <Text style={styles.iconLabel} numberOfLines={1}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </>
          ) : (
            /* Color Palette Grid */
            <View style={styles.colorsContainer}>
              <Text style={styles.colorHint}>Select an accent color for this subscription:</Text>
              <View style={styles.colorPaletteGrid}>
                {avatarColors.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        isSelected && styles.colorCircleSelected,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onSelectIcon(undefined, color);
                        onClose();
                      }}
                    >
                      {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background.secondary || '#161922',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderWidth: 1,
    borderColor: colors.glass.cardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glass.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  tabBtnActive: {
    borderColor: colors.accent.blue,
    backgroundColor: 'rgba(79,195,247,0.12)',
  },
  tabText: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.accent.blue,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.input || 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
    paddingVertical: 0,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  iconItem: {
    flex: 1 / 4,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    margin: 4,
    borderRadius: 14,
    backgroundColor: colors.glass.card,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  iconLabel: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 6,
    textTransform: 'capitalize',
  },
  colorsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  colorHint: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  colorCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
});
