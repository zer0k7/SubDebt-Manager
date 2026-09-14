import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { SpendingEntry } from '../hooks/useDailySpending';
import { useSettings } from '../context/SettingsContext';
import { ReceiptVaultModal } from './ReceiptVaultModal';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

interface ReceiptGalleryModalProps {
  visible: boolean;
  onClose: () => void;
  entries: SpendingEntry[];
}

export const ReceiptGalleryModal: React.FC<ReceiptGalleryModalProps> = ({
  visible,
  onClose,
  entries,
}) => {
  const { colors, isDark } = useTheme();
  const { formatCurrency, formatDate } = useSettings();
  const styles = getStyles(colors, isDark);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeEntry, setActiveEntry] = useState<SpendingEntry | null>(null);

  // Filter entries that have a receipt image
  const receiptEntries = useMemo(() => {
    return entries.filter((e) => !!e.receiptImage);
  }, [entries]);

  // Unique categories of receipt entries
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    receiptEntries.forEach((e) => cats.add(e.category));
    return ['ALL', ...Array.from(cats)];
  }, [receiptEntries]);

  // Filtered by selected category
  const filtered = useMemo(() => {
    if (selectedCategory === 'ALL') return receiptEntries;
    return receiptEntries.filter(
      (e) => e.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [receiptEntries, selectedCategory]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>RECEIPT VAULT GALLERY</Text>
              <Text style={styles.subtitle}>
                {receiptEntries.length} {receiptEntries.length === 1 ? 'Receipt' : 'Receipts'} Attached
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Category Filter Pills */}
          {availableCategories.length > 2 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {availableCategories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(cat);
                    }}
                  >
                    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Grid of Receipts */}
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="images-outline" size={48} color={colors.text.muted} />
                <Text style={styles.emptyTitle}>No Receipts Found</Text>
                <Text style={styles.emptySub}>
                  Take or attach receipt photos when adding expenses to see them organized here.
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {filtered.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveEntry(entry);
                    }}
                  >
                    <Image source={{ uri: entry.receiptImage }} style={styles.thumbnail} />
                    <View style={styles.metaOverlay}>
                      <Text style={styles.entryTitle} numberOfLines={1}>
                        {entry.title}
                      </Text>
                      <Text style={styles.entryAmount}>
                        {formatCurrency(entry.amount, entry.currency)}
                      </Text>
                      <Text style={styles.entryDate}>{formatDate(entry.spentAt)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Single Receipt Detailed Viewer Modal */}
          {activeEntry && (
            <ReceiptVaultModal
              visible={!!activeEntry}
              onClose={() => setActiveEntry(null)}
              imageUri={activeEntry.receiptImage}
              title={activeEntry.title}
              amount={activeEntry.amount}
              currency={activeEntry.currency}
              category={activeEntry.category}
              date={activeEntry.spentAt}
              notes={activeEntry.notes}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.background.primary,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      height: '88%',
      paddingTop: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    title: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    subtitle: {
      color: colors.text.muted,
      fontSize: 12,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterScroll: {
      paddingHorizontal: 16,
      gap: 8,
      paddingBottom: 12,
    },
    filterPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    filterPillActive: {
      backgroundColor: colors.accent.purple,
    },
    filterText: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '600',
    },
    filterTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    card: {
      width: COLUMN_WIDTH,
      height: COLUMN_WIDTH * 1.3,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    thumbnail: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    metaOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.72)',
      padding: 8,
      gap: 2,
    },
    entryTitle: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    entryAmount: {
      color: colors.accent.blue,
      fontSize: 12,
      fontWeight: '800',
    },
    entryDate: {
      color: 'rgba(255,255,255,0.65)',
      fontSize: 9.5,
    },
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      gap: 10,
      paddingHorizontal: 24,
    },
    emptyTitle: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    emptySub: {
      color: colors.text.muted,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
