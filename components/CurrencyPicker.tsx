import { useTheme } from '../hooks/useTheme';
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CURRENCIES, Currency } from '../constants/currencies';

interface CurrencyPickerProps {
  visible: boolean;
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export const CurrencyPicker: React.FC<CurrencyPickerProps> = ({
  visible, selectedCode, onSelect, onClose,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return CURRENCIES;
    const q = search.toLowerCase().trim();
    return CURRENCIES.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.includes(q)
    );
  }, [search]);

  const handleSelect = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(code);
    setSearch('');
    onClose();
  };

  const renderItem = ({ item }: { item: Currency }) => {
    const isSelected = item.code === selectedCode;
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.itemSelected]}
        onPress={() => handleSelect(item.code)}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.itemTextWrap}>
          <Text style={[styles.itemCode, isSelected && styles.itemCodeSelected]}>
            {item.code}
          </Text>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        </View>
        <Text style={[styles.itemSymbol, isSelected && styles.itemSymbolSelected]}>
          {item.symbol}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={colors.accent.blue} style={{ marginLeft: 8 }} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Currency</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.text.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search currency..."
              placeholderTextColor={colors.text.placeholder}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={item => item.code}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No currencies found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(15,23,42,0.25)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.input,
    borderWidth: 0.5,
    borderColor: colors.glass.inputBorder,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 15,
    height: '100%',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 2,
  },
  itemSelected: {
    backgroundColor: isDark ? 'rgba(79,195,247,0.08)' : 'rgba(2,132,199,0.12)',
    borderWidth: 0.5,
    borderColor: isDark ? 'rgba(79,195,247,0.2)' : 'rgba(2,132,199,0.28)',
  },
  flag: {
    fontSize: 24,
    marginRight: 14,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemCode: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  itemCodeSelected: {
    color: colors.accent.blue,
  },
  itemName: {
    color: colors.text.muted,
    fontSize: 13,
    marginTop: 2,
  },
  itemSymbol: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'center',
  },
  itemSymbolSelected: {
    color: colors.accent.blue,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: 15,
  },
});
