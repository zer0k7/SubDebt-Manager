import { useTheme } from '../../hooks/useTheme';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '../../components/AmbientBackground';
import { useCategoryManager } from '../../hooks/useCategoryManager';
import { CATEGORY_GROUPS } from '../../constants/categories';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ICON_PALETTE = [
  'restaurant-outline', 'fast-food-outline', 'cart-outline', 'cafe-outline', 'beer-outline',
  'car-outline', 'flame-outline', 'subway-outline', 'build-outline', 'navigate-outline',
  'bag-handle-outline', 'shirt-outline', 'laptop-outline', 'sparkles-outline', 'flower-outline',
  'document-text-outline', 'flash-outline', 'home-outline', 'hammer-outline', 'card-outline',
  'heart-outline', 'medkit-outline', 'barbell-outline', 'book-outline', 'briefcase-outline',
  'film-outline', 'game-controller-outline', 'ticket-outline', 'gift-outline', 'paw-outline',
  'people-outline', 'trending-up-outline', 'shield-checkmark-outline', 'cash-outline', 'shapes-outline',
];

const COLOR_PALETTE = [
  '#EF5350', '#FF7043', '#66BB6A', '#FFA726', '#AB47BC', '#4FC3F7',
  '#EC407A', '#5C6BC0', '#9CCC65', '#26A69A', '#8D6E63', '#7E57C2',
];

export default function ManageCategoriesModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { allCategories, customCategories, addCategory, deleteCategory } = useCategoryManager();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('General');
  const [selectedIcon, setSelectedIcon] = useState('shapes-outline');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');

  const toggleAddForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAddForm(!showAddForm);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveCategory = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Category Name Required', 'Please enter a name for your custom category.');
      return;
    }

    const success = addCategory({
      name: trimmed,
      icon: selectedIcon,
      color: selectedColor,
      group: selectedGroup,
    });

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setName('');
      setShowAddForm(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Duplicate Category', 'A category with this name already exists.');
    }
  };

  const handleDelete = (catName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Custom Category',
      `Are you sure you want to delete "${catName}"? Existing transactions will keep their logged category.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCategory(catName);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MANAGE CATEGORIES</Text>
        <TouchableOpacity onPress={toggleAddForm} style={styles.addHeaderBtn}>
          <Ionicons name={showAddForm ? 'chevron-up' : 'add'} size={24} color={colors.accent.purple} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Category Drawer Form */}
        {showAddForm && (
          <View style={styles.addCard}>
            <Text style={styles.cardSectionTitle}>CREATE CUSTOM CATEGORY</Text>

            {/* Preview Box */}
            <View style={styles.previewWrap}>
              <View style={[styles.previewIconBox, { backgroundColor: `${selectedColor}20`, borderColor: `${selectedColor}50` }]}>
                <Ionicons name={selectedIcon as any} size={24} color={selectedColor} />
              </View>
              <View>
                <Text style={styles.previewName}>{name.trim() || 'Category Name'}</Text>
                <Text style={styles.previewGroup}>{selectedGroup}</Text>
              </View>
            </View>

            {/* Input Name */}
            <Text style={styles.inputTitle}>Category Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="pricetag-outline" size={20} color={colors.accent.purple} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Subscriptions, Pet Food, Hobbies"
                placeholderTextColor={colors.text.muted}
              />
            </View>

            {/* Group Picker */}
            <Text style={styles.inputTitle}>Category Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupScroll}>
              {CATEGORY_GROUPS.map((g) => {
                const isActive = g === selectedGroup;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.groupPill, isActive && styles.groupPillActive]}
                    onPress={() => { setSelectedGroup(g); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Text style={[styles.groupPillText, isActive && styles.groupPillTextActive]}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Color Palette Picker */}
            <Text style={styles.inputTitle}>Theme Accent Color</Text>
            <View style={styles.colorPaletteGrid}>
              {COLOR_PALETTE.map((c) => {
                const isSelected = c === selectedColor;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorCircle, { backgroundColor: c }, isSelected && styles.colorCircleSelected]}
                    onPress={() => { setSelectedColor(c); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Icon Palette Picker */}
            <Text style={styles.inputTitle}>Choose Icon</Text>
            <ScrollView style={styles.iconPickerBox} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <View style={styles.iconPaletteGrid}>
                {ICON_PALETTE.map((iconName) => {
                  const isSelected = iconName === selectedIcon;
                  return (
                    <TouchableOpacity
                      key={iconName}
                      style={[
                        styles.iconTile,
                        isSelected && { backgroundColor: `${selectedColor}25`, borderColor: selectedColor },
                      ]}
                      onPress={() => { setSelectedIcon(iconName); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    >
                      <Ionicons name={iconName as any} size={20} color={isSelected ? selectedColor : colors.text.secondary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Save CTA Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCategory} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Custom Category</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Existing Categories List */}
        <View style={styles.listCard}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.cardSectionTitle}>ALL CATEGORIES ({allCategories.length})</Text>
            {!showAddForm && (
              <TouchableOpacity style={styles.quickAddPill} onPress={toggleAddForm}>
                <Ionicons name="add" size={14} color={colors.accent.purple} />
                <Text style={styles.quickAddPillText}>New Custom</Text>
              </TouchableOpacity>
            )}
          </View>

          {allCategories.map((cat) => {
            const isCustom = customCategories.some((c) => c.name.toLowerCase() === cat.name.toLowerCase());

            return (
              <View key={cat.name} style={styles.catRow}>
                <View style={[styles.catIconCircle, { backgroundColor: `${cat.color}18`, borderColor: `${cat.color}35` }]}>
                  <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                </View>

                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catGroup}>{cat.group || 'General'}</Text>
                </View>

                <View style={styles.catRightWrap}>
                  <View style={[styles.badgePill, isCustom ? styles.badgeCustom : styles.badgeSystem]}>
                    <Text style={[styles.badgeText, isCustom ? styles.badgeCustomText : styles.badgeSystemText]}>
                      {isCustom ? 'Custom' : 'System'}
                    </Text>
                  </View>

                  {isCustom && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(cat.name)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.accent.red} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.glass.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    addHeaderBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent.alpha(isDark ? 0.15 : 0.08),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.accent.alpha(0.25),
    },
    headerTitle: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    content: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
    addCard: {
      padding: 18,
      borderRadius: 22,
      backgroundColor: colors.accent.alpha(isDark ? 0.1 : 0.04),
      borderWidth: 1,
      borderColor: colors.accent.alpha(0.25),
      gap: 12,
    },
    listCard: {
      padding: 18,
      borderRadius: 22,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 12,
    },
    listHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    cardSectionTitle: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    quickAddPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: colors.accent.alpha(isDark ? 0.15 : 0.08),
    },
    quickAddPillText: {
      color: colors.accent.purple,
      fontSize: 11,
      fontWeight: '700',
    },
    previewWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 16,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    previewIconBox: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewName: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    previewGroup: {
      color: colors.text.secondary,
      fontSize: 12,
      marginTop: 2,
    },
    inputTitle: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      paddingHorizontal: 12,
      height: 46,
    },
    inputIcon: { marginRight: 10 },
    textInput: { flex: 1, color: colors.text.primary, fontSize: 14, fontWeight: '700' },
    groupScroll: { gap: 8, paddingVertical: 4 },
    groupPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    },
    groupPillActive: { backgroundColor: colors.accent.purple },
    groupPillText: { color: colors.text.secondary, fontSize: 11, fontWeight: '600' },
    groupPillTextActive: { color: '#FFFFFF', fontWeight: '700' },
    colorPaletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    colorCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorCircleSelected: { borderWidth: 2, borderColor: '#FFFFFF' },
    iconPickerBox: { maxHeight: 120 },
    iconPaletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    iconTile: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.accent.purple,
      marginTop: 6,
    },
    saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    catRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    catIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    catInfo: { flex: 1 },
    catName: { color: colors.text.primary, fontSize: 14, fontWeight: '700' },
    catGroup: { color: colors.text.muted, fontSize: 11, marginTop: 2 },
    catRightWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    badgePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeSystem: { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
    badgeCustom: { backgroundColor: colors.accent.alpha(0.15) },
    badgeText: { fontSize: 10, fontWeight: '700' },
    badgeSystemText: { color: colors.text.secondary },
    badgeCustomText: { color: colors.accent.purple },
    deleteBtn: { padding: 4 },
  });
