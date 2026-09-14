import { useTheme } from '../../hooks/useTheme';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '../../components/AmbientBackground';
import { AppPopup } from '../../components/AppPopup';
import { useCategoryManager } from '../../hooks/useCategoryManager';
import {
  CATEGORY_GROUPS,
  EXTENDED_CATEGORY_ICONS,
  COLOR_PALETTE,
  CategoryDefinition,
} from '../../constants/categories';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterTab = 'all' | 'custom' | 'system' | 'removed';

export default function ManageCategoriesModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const {
    allCategories,
    customCategories,
    defaultCategories,
    deletedDefaultCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    restoreDefaultCategory,
    moveCategoryUp,
    moveCategoryDown,
    resetToDefaults,
  } = useCategoryManager();

  const [popupConfig, setPopupConfig] = useState<any>(null);
  const showPopup = (config: any) => setPopupConfig(config);
  const closePopup = () => setPopupConfig(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | null>(null);
  const [name, setName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('General');
  const [selectedIcon, setSelectedIcon] = useState('shapes-outline');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');

  // Search & Filter state
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const [iconGroupFilter, setIconGroupFilter] = useState<string>('All');

  // Filtered icons for picker
  const filteredIcons = useMemo(() => {
    const q = iconSearch.toLowerCase().trim();
    return EXTENDED_CATEGORY_ICONS.filter((item) => {
      const matchesGroup = iconGroupFilter === 'All' || item.group === iconGroupFilter;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q));
      return matchesGroup && matchesQuery;
    });
  }, [iconSearch, iconGroupFilter]);

  // Distinct groups for icon filter
  const iconFilterGroups = useMemo(() => {
    const groups = new Set<string>();
    EXTENDED_CATEGORY_ICONS.forEach((i) => groups.add(i.group));
    return ['All', ...Array.from(groups)];
  }, []);

  // Filtered category list
  const filteredCategories = useMemo(() => {
    let list = allCategories;
    if (activeTab === 'custom') {
      list = customCategories;
    } else if (activeTab === 'system') {
      list = defaultCategories;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;

    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.group && c.group.toLowerCase().includes(q))
    );
  }, [allCategories, customCategories, defaultCategories, activeTab, searchQuery]);

  const toggleAddForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (showAddForm) {
      setShowAddForm(false);
      setEditingCategory(null);
      setName('');
    } else {
      setEditingCategory(null);
      setName('');
      setSelectedGroup('General');
      setSelectedIcon('shapes-outline');
      setSelectedColor('#8B5CF6');
      setShowAddForm(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const startEditCategory = (cat: CategoryDefinition) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingCategory(cat);
    setName(cat.name);
    setSelectedGroup(cat.group || 'General');
    setSelectedIcon(cat.icon || 'shapes-outline');
    setSelectedColor(cat.color || '#8B5CF6');
    setShowAddForm(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const cancelForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAddForm(false);
    setEditingCategory(null);
    setName('');
  };

  const handleSaveCategory = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showPopup({
        title: 'Category Name Required',
        message: 'Please enter a name for the category.',
        icon: 'alert-circle-outline',
        iconColor: colors.accent.amber,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
      return;
    }

    if (editingCategory) {
      // Update existing category
      const success = updateCategory(editingCategory.name, {
        name: trimmed,
        icon: selectedIcon,
        color: selectedColor,
        group: selectedGroup,
      });

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        cancelForm();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showPopup({
          title: 'Duplicate Category',
          message: 'Another category with this name already exists.',
          icon: 'alert-circle-outline',
          iconColor: colors.accent.red,
          confirmText: 'OK',
          onConfirm: closePopup,
        });
      }
    } else {
      // Create new custom category
      const success = addCategory({
        name: trimmed,
        icon: selectedIcon,
        color: selectedColor,
        group: selectedGroup,
      });

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        cancelForm();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showPopup({
          title: 'Duplicate Category',
          message: 'A category with this name already exists.',
          icon: 'alert-circle-outline',
          iconColor: colors.accent.red,
          confirmText: 'OK',
          onConfirm: closePopup,
        });
      }
    }
  };

  const handleDelete = (cat: CategoryDefinition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const isCustom = cat.isCustom;
    showPopup({
      title: isCustom ? 'Delete Custom Category' : 'Remove Default Category',
      message: isCustom
        ? `Are you sure you want to delete "${cat.name}"? Existing transactions will keep this category.`
        : `Are you sure you want to remove "${cat.name}" from your categories list? You can restore it anytime.`,
      icon: 'trash-outline',
      iconColor: colors.accent.red,
      cancelText: 'Cancel',
      confirmText: isCustom ? 'Delete' : 'Remove',
      isDestructive: true,
      onCancel: closePopup,
      onConfirm: () => {
        closePopup();
        deleteCategory(cat.name);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    });
  };

  const handleRestore = (catName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    restoreDefaultCategory(catName);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleResetDefaults = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    showPopup({
      title: 'Reset to Default Categories',
      message: 'Restore all built-in default categories and their standard order? Your custom categories will be preserved.',
      icon: 'refresh-outline',
      iconColor: colors.accent.blue,
      cancelText: 'Cancel',
      confirmText: 'Reset Defaults',
      onCancel: closePopup,
      onConfirm: () => {
        closePopup();
        resetToDefaults(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    });
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
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleResetDefaults}
            style={styles.resetHeaderBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleAddForm} style={styles.addHeaderBtn}>
            <Ionicons
              name={showAddForm ? 'close' : 'add'}
              size={24}
              color={colors.accent.purple}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add / Edit Category Drawer Form */}
        {showAddForm && (
          <View style={styles.addCard}>
            <View style={styles.formTitleRow}>
              <Text style={styles.cardSectionTitle}>
                {editingCategory ? `EDIT: ${editingCategory.name.toUpperCase()}` : 'CREATE CUSTOM CATEGORY'}
              </Text>
              {editingCategory && (
                <TouchableOpacity onPress={cancelForm} style={styles.cancelLinkBtn}>
                  <Text style={styles.cancelLinkText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Live Preview Box */}
            <View style={styles.previewWrap}>
              <View
                style={[
                  styles.previewIconBox,
                  { backgroundColor: `${selectedColor}20`, borderColor: `${selectedColor}55` },
                ]}
              >
                <Ionicons name={selectedIcon as any} size={26} color={selectedColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewName}>{name.trim() || 'Category Name'}</Text>
                <Text style={styles.previewGroup}>{selectedGroup}</Text>
              </View>
              <View style={[styles.badgePill, { backgroundColor: `${selectedColor}22` }]}>
                <Text style={[styles.badgeText, { color: selectedColor }]}>
                  {editingCategory?.isCustom || !editingCategory ? 'Custom' : 'System'}
                </Text>
              </View>
            </View>

            {/* Input Name */}
            <Text style={styles.inputTitle}>Category Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="pricetag-outline" size={18} color={colors.accent.purple} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Subscriptions, Pet Food, Coffee"
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
                    onPress={() => {
                      setSelectedGroup(g);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.groupPillText, isActive && styles.groupPillTextActive]}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Color Palette Picker */}
            <Text style={styles.inputTitle}>Accent Color ({COLOR_PALETTE.length} hues)</Text>
            <View style={styles.colorPaletteGrid}>
              {COLOR_PALETTE.map((c) => {
                const isSelected = c.toLowerCase() === selectedColor.toLowerCase();
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorCircle, { backgroundColor: c }, isSelected && styles.colorCircleSelected]}
                    onPress={() => {
                      setSelectedColor(c);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Expanded Icon Picker */}
            <View style={styles.iconSectionHeader}>
              <Text style={styles.inputTitle}>Choose Icon ({filteredIcons.length} available)</Text>
            </View>

            {/* Icon Search & Group Filter */}
            <View style={styles.iconSearchWrap}>
              <Ionicons name="search-outline" size={16} color={colors.text.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.iconSearchInput}
                value={iconSearch}
                onChangeText={setIconSearch}
                placeholder="Search icons (e.g. food, car, gym, tech)..."
                placeholderTextColor={colors.text.muted}
              />
              {iconSearch.length > 0 && (
                <TouchableOpacity onPress={() => setIconSearch('')}>
                  <Ionicons name="close-circle" size={16} color={colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconGroupScroll}>
              {iconFilterGroups.map((ig) => {
                const isActive = ig === iconGroupFilter;
                return (
                  <TouchableOpacity
                    key={ig}
                    style={[styles.iconGroupPill, isActive && styles.iconGroupPillActive]}
                    onPress={() => {
                      setIconGroupFilter(ig);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.iconGroupText, isActive && styles.iconGroupTextActive]}>{ig}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <ScrollView style={styles.iconPickerBox} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <View style={styles.iconPaletteGrid}>
                {filteredIcons.map((item) => {
                  const isSelected = item.name === selectedIcon;
                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.iconTile,
                        isSelected && {
                          backgroundColor: `${selectedColor}25`,
                          borderColor: selectedColor,
                          borderWidth: 1.5,
                        },
                      ]}
                      onPress={() => {
                        setSelectedIcon(item.name);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Ionicons
                        name={item.name as any}
                        size={20}
                        color={isSelected ? selectedColor : colors.text.secondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.formActionRow}>
              {editingCategory && (
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelForm} activeOpacity={0.8}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveBtn, editingCategory ? { flex: 1 } : { width: '100%' }]}
                onPress={handleSaveCategory}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>
                  {editingCategory ? 'Update Category' : 'Save Custom Category'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Filter Pills & Search for Category List */}
        <View style={styles.listSectionHeader}>
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('all');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                All ({allCategories.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'custom' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('custom');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.tabText, activeTab === 'custom' && styles.tabTextActive]}>
                Custom ({customCategories.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'system' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('system');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.tabText, activeTab === 'system' && styles.tabTextActive]}>
                Default ({defaultCategories.length})
              </Text>
            </TouchableOpacity>

            {deletedDefaultCategories.length > 0 && (
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'removed' && styles.tabBtnActive]}
                onPress={() => {
                  setActiveTab('removed');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.tabText, activeTab === 'removed' && styles.tabTextActive, { color: colors.accent.red }]}>
                  Removed ({deletedDefaultCategories.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {activeTab !== 'removed' && (
            <View style={styles.listSearchWrap}>
              <Ionicons name="search-outline" size={16} color={colors.text.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.listSearchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Filter categories by name or group..."
                placeholderTextColor={colors.text.muted}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Existing Categories List */}
        {activeTab !== 'removed' ? (
          <View style={styles.listCard}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.cardSectionTitle}>
                CATEGORIES ({filteredCategories.length})
              </Text>
              {!showAddForm && (
                <TouchableOpacity style={styles.quickAddPill} onPress={toggleAddForm}>
                  <Ionicons name="add" size={14} color={colors.accent.purple} />
                  <Text style={styles.quickAddPillText}>New Custom</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredCategories.length === 0 ? (
              <View style={styles.emptyListWrap}>
                <Ionicons name="search-outline" size={32} color={colors.text.muted} />
                <Text style={styles.emptyListText}>No categories match your filter</Text>
              </View>
            ) : (
              filteredCategories.map((cat, index) => {
                const isCustom = cat.isCustom;
                const globalIndex = allCategories.findIndex(
                  (c) => c.name.toLowerCase().trim() === cat.name.toLowerCase().trim()
                );
                const isFirst = globalIndex === 0;
                const isLast = globalIndex === allCategories.length - 1;

                return (
                  <View key={cat.id || cat.name} style={styles.catRow}>
                    {/* Arrange Up/Down Buttons */}
                    <View style={styles.arrangeCol}>
                      <TouchableOpacity
                        disabled={isFirst}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          moveCategoryUp(globalIndex);
                        }}
                        style={[styles.arrowBtn, isFirst && styles.arrowBtnDisabled]}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name="chevron-up"
                          size={15}
                          color={isFirst ? colors.text.muted : colors.text.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={isLast}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          moveCategoryDown(globalIndex);
                        }}
                        style={[styles.arrowBtn, isLast && styles.arrowBtnDisabled]}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={15}
                          color={isLast ? colors.text.muted : colors.text.primary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Icon Circle */}
                    <View
                      style={[
                        styles.catIconCircle,
                        { backgroundColor: `${cat.color}18`, borderColor: `${cat.color}35` },
                      ]}
                    >
                      <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                    </View>

                    {/* Info */}
                    <View style={styles.catInfo}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catGroup}>{cat.group || 'General'}</Text>
                    </View>

                    {/* Right Wrap: Badges, Edit, Delete */}
                    <View style={styles.catRightWrap}>
                      <View style={[styles.badgePill, isCustom ? styles.badgeCustom : styles.badgeSystem]}>
                        <Text style={[styles.badgeText, isCustom ? styles.badgeCustomText : styles.badgeSystemText]}>
                          {isCustom ? 'Custom' : 'System'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => startEditCategory(cat)}
                        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                      >
                        <Ionicons name="pencil-outline" size={16} color={colors.accent.blue} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(cat)}
                        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.accent.red} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* Removed Default Categories View */
          <View style={styles.listCard}>
            <Text style={styles.cardSectionTitle}>
              REMOVED DEFAULT CATEGORIES ({deletedDefaultCategories.length})
            </Text>
            <Text style={styles.removedSubText}>
              These default categories are currently hidden from Spending choices. Tap restore to add them back.
            </Text>

            {deletedDefaultCategories.map((cat) => (
              <View key={cat.name} style={styles.catRow}>
                <View
                  style={[
                    styles.catIconCircle,
                    { backgroundColor: `${cat.color}18`, borderColor: `${cat.color}35` },
                  ]}
                >
                  <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                </View>

                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catGroup}>{cat.group}</Text>
                </View>

                <TouchableOpacity
                  style={styles.restoreBtn}
                  onPress={() => handleRestore(cat.name)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-undo-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.restoreBtnText}>Restore</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <AppPopup
        visible={!!popupConfig}
        title={popupConfig?.title || ''}
        message={popupConfig?.message || ''}
        icon={popupConfig?.icon || 'information-circle-outline'}
        iconColor={popupConfig?.iconColor}
        cancelText={popupConfig?.cancelText}
        confirmText={popupConfig?.confirmText || 'OK'}
        isDestructive={popupConfig?.isDestructive || false}
        onCancel={popupConfig?.onCancel || closePopup}
        onConfirm={popupConfig?.onConfirm || closePopup}
      />
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
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 1,
    },
    closeBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    resetHeaderBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addHeaderBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.accent.alpha(0.12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      padding: 16,
      paddingBottom: 50,
      gap: 16,
    },
    addCard: {
      backgroundColor: colors.glass.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      padding: 16,
      gap: 12,
    },
    formTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cancelLinkBtn: {
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    cancelLinkText: {
      color: colors.text.muted,
      fontSize: 12,
      fontWeight: '600',
    },
    cardSectionTitle: {
      color: colors.text.secondary,
      fontSize: 11.5,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    previewWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 12,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    },
    previewIconBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewName: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    previewGroup: {
      color: colors.text.muted,
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
    colorCircleSelected: { borderWidth: 2.5, borderColor: '#FFFFFF' },
    iconSectionHeader: {
      marginTop: 6,
    },
    iconSearchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      paddingHorizontal: 10,
      height: 38,
    },
    iconSearchInput: {
      flex: 1,
      color: colors.text.primary,
      fontSize: 12.5,
    },
    iconGroupScroll: {
      gap: 6,
      paddingVertical: 2,
    },
    iconGroupPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    },
    iconGroupPillActive: {
      backgroundColor: colors.accent.alpha(0.2),
      borderWidth: 1,
      borderColor: colors.accent.purple,
    },
    iconGroupText: {
      color: colors.text.muted,
      fontSize: 10.5,
      fontWeight: '600',
    },
    iconGroupTextActive: {
      color: colors.accent.purple,
      fontWeight: '700',
    },
    iconPickerBox: { maxHeight: 150 },
    iconPaletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
    iconTile: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    formActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    cancelBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      height: 48,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    cancelBtnText: {
      color: colors.text.secondary,
      fontSize: 13,
      fontWeight: '700',
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.accent.purple,
    },
    saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    listSectionHeader: {
      gap: 10,
    },
    tabsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tabBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    tabBtnActive: {
      backgroundColor: colors.accent.alpha(0.15),
      borderColor: colors.accent.purple,
    },
    tabText: {
      color: colors.text.secondary,
      fontSize: 11.5,
      fontWeight: '600',
    },
    tabTextActive: {
      color: colors.accent.purple,
      fontWeight: '700',
    },
    listSearchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      paddingHorizontal: 12,
      height: 42,
    },
    listSearchInput: {
      flex: 1,
      color: colors.text.primary,
      fontSize: 13,
    },
    listCard: {
      backgroundColor: colors.glass.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      padding: 16,
      gap: 4,
    },
    listHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    quickAddPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: colors.accent.alpha(0.12),
    },
    quickAddPillText: {
      color: colors.accent.purple,
      fontSize: 11,
      fontWeight: '700',
    },
    emptyListWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      gap: 8,
    },
    emptyListText: {
      color: colors.text.muted,
      fontSize: 13,
    },
    catRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    arrangeCol: {
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      gap: 2,
    },
    arrowBtn: {
      padding: 2,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    },
    arrowBtnDisabled: {
      opacity: 0.25,
    },
    catIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    catInfo: { flex: 1, marginRight: 8 },
    catName: { color: colors.text.primary, fontSize: 14, fontWeight: '700' },
    catGroup: { color: colors.text.muted, fontSize: 11, marginTop: 2 },
    catRightWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badgePill: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 8 },
    badgeSystem: { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
    badgeCustom: { backgroundColor: colors.accent.alpha(0.15) },
    badgeText: { fontSize: 9.5, fontWeight: '700' },
    badgeSystemText: { color: colors.text.secondary },
    badgeCustomText: { color: colors.accent.purple },
    editBtn: { padding: 4 },
    deleteBtn: { padding: 4 },
    removedSubText: {
      color: colors.text.muted,
      fontSize: 12,
      marginBottom: 10,
    },
    restoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor: colors.accent.blue,
    },
    restoreBtnText: {
      color: '#FFFFFF',
      fontSize: 11.5,
      fontWeight: '700',
    },
  });
