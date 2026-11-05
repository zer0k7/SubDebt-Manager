import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { AmbientBackground } from '../../components/AmbientBackground';
import { USER_MANUAL_CHAPTERS, ManualChapter } from '../../constants/userManualData';

export default function UserManualModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const filteredChapters = useMemo(() => {
    let chapters = USER_MANUAL_CHAPTERS;

    if (selectedChapterId) {
      chapters = chapters.filter((c) => c.id === selectedChapterId);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return chapters;

    return chapters.filter((c) => {
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchCat = c.category.toLowerCase().includes(q);
      const matchSum = c.summary.toLowerCase().includes(q);
      const matchSections = c.sections.some(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.subtitle && s.subtitle.toLowerCase().includes(q)) ||
          (s.steps && s.steps.some((st) => st.toLowerCase().includes(q))) ||
          (s.tableRows && s.tableRows.some((row) => row.some((cell) => cell.toLowerCase().includes(q))))
      );
      return matchTitle || matchCat || matchSum || matchSections;
    });
  }, [searchQuery, selectedChapterId]);

  const handleSelectChapter = (id: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChapterId(id);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AmbientBackground />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>User Handbook & Wiki</Text>
          <Text style={styles.headerSub}>Complete Offline Guide to SubDebt Architecture</Text>
        </View>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL('https://subdebt.zer0k7lab.tech/wiki.html');
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="globe-outline" size={19} color={colors.accent.blue} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color={colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search mechanics, bill split, SAF vault, passbook..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (selectedChapterId && text.trim().length > 0) {
                setSelectedChapterId(null);
              }
            }}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={17} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.chapterNavWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chapterNavContent}
        >
          <TouchableOpacity
            style={[
              styles.navPill,
              selectedChapterId === null && styles.navPillActive,
            ]}
            onPress={() => handleSelectChapter(null)}
          >
            <Text
              style={[
                styles.navPillText,
                selectedChapterId === null && styles.navPillTextActive,
              ]}
            >
              All Chapters ({USER_MANUAL_CHAPTERS.length})
            </Text>
          </TouchableOpacity>

          {USER_MANUAL_CHAPTERS.map((ch) => {
            const isSelected = selectedChapterId === ch.id;
            return (
              <TouchableOpacity
                key={ch.id}
                style={[
                  styles.navPill,
                  isSelected && [
                    styles.navPillActive,
                    { borderColor: ch.accentColor, backgroundColor: `${ch.accentColor}18` },
                  ],
                ]}
                onPress={() => handleSelectChapter(isSelected ? null : ch.id)}
              >
                <Ionicons
                  name={ch.icon as any}
                  size={13}
                  color={isSelected ? ch.accentColor : colors.text.muted}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.navPillText,
                    isSelected && [styles.navPillTextActive, { color: ch.accentColor }],
                  ]}
                >
                  Ch {ch.chapterNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredChapters.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={42} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No Documentation Found</Text>
            <Text style={styles.emptySub}>No handbook chapter matches your query "{searchQuery}"</Text>
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedChapterId(null);
              }}
            >
              <Text style={styles.clearSearchBtnText}>Reset Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredChapters.map((chapter) => (
            <View key={chapter.id} style={[styles.chapterCard, { borderColor: `${chapter.accentColor}35` }]}>
              <View style={styles.chapterHeader}>
                <View style={[styles.chapterIconBox, { backgroundColor: `${chapter.accentColor}18` }]}>
                  <Ionicons name={chapter.icon as any} size={22} color={chapter.accentColor} />
                </View>
                <View style={styles.chapterTitleBlock}>
                  <View style={styles.chapterTagRow}>
                    <View style={[styles.chapterNumBadge, { backgroundColor: `${chapter.accentColor}25` }]}>
                      <Text style={[styles.chapterNumText, { color: chapter.accentColor }]}>
                        CHAPTER {chapter.chapterNumber}
                      </Text>
                    </View>
                    <Text style={styles.categoryBadgeText}>{chapter.category.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.chapterTitle}>{chapter.title}</Text>
                </View>
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>{chapter.summary}</Text>
              </View>

              <View style={styles.sectionsDeck}>
                {chapter.sections.map((section, sIdx) => (
                  <View key={sIdx} style={styles.sectionItem}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    {section.subtitle ? (
                      <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
                    ) : null}

                    {section.tableHeaders && section.tableRows ? (
                      <View style={styles.tableCard}>
                        <View style={styles.tableHeaderRow}>
                          {section.tableHeaders.map((th, thIdx) => (
                            <Text key={thIdx} style={[styles.thCell, { flex: thIdx === 0 ? 1.1 : 1 }]}>
                              {th}
                            </Text>
                          ))}
                        </View>
                        {section.tableRows.map((tr, trIdx) => (
                          <View
                            key={trIdx}
                            style={[
                              styles.tableDataRow,
                              trIdx % 2 === 1 && styles.tableDataRowAlt,
                              trIdx === section.tableRows!.length - 1 && { borderBottomWidth: 0 },
                            ]}
                          >
                            {tr.map((td, tdIdx) => (
                              <Text
                                key={tdIdx}
                                style={[
                                  styles.tdCell,
                                  tdIdx === 0 && styles.tdCellPrimary,
                                  { flex: tdIdx === 0 ? 1.1 : 1 },
                                ]}
                              >
                                {td}
                              </Text>
                            ))}
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {section.steps && section.steps.length > 0 ? (
                      <View style={styles.stepsDeck}>
                        {section.steps.map((step, stIdx) => (
                          <View key={stIdx} style={styles.stepRow}>
                            <View
                              style={[
                                styles.stepBadge,
                                { backgroundColor: `${chapter.accentColor}18` },
                              ]}
                            >
                              <Text style={[styles.stepBadgeText, { color: chapter.accentColor }]}>
                                {stIdx + 1}
                              </Text>
                            </View>
                            <Text style={styles.stepText}>{step}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {section.notes && section.notes.length > 0 ? (
                      <View style={styles.notesDeck}>
                        {section.notes.map((note, nIdx) => (
                          <View key={nIdx} style={styles.noteBox}>
                            <Ionicons name="information-circle-outline" size={16} color={colors.accent.blue} />
                            <Text style={styles.noteText}>{note}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextGroup: {
      flex: 1,
      marginLeft: 12,
    },
    headerTitle: {
      color: colors.text.primary,
      fontSize: 17,
      fontWeight: '800',
    },
    headerSub: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '500',
      marginTop: 2,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 42,
    },
    searchInput: {
      flex: 1,
      color: colors.text.primary,
      fontSize: 12.5,
      paddingVertical: 0,
    },
    chapterNavWrap: {
      borderBottomWidth: 1,
      borderColor: colors.glass.cardBorder,
      paddingBottom: 8,
    },
    chapterNavContent: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 6,
    },
    navPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 11,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    navPillActive: {
      borderColor: colors.accent.blue,
      backgroundColor: `${colors.accent.blue}18`,
    },
    navPillText: {
      color: colors.text.muted,
      fontSize: 11.5,
      fontWeight: '600',
    },
    navPillTextActive: {
      color: colors.accent.blue,
      fontWeight: '800',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 14,
      gap: 16,
    },
    chapterCard: {
      backgroundColor: colors.glass.card,
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      gap: 14,
    },
    chapterHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    chapterIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chapterTitleBlock: {
      flex: 1,
    },
    chapterTagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    chapterNumBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    chapterNumText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    categoryBadgeText: {
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    chapterTitle: {
      color: colors.text.primary,
      fontSize: 16.5,
      fontWeight: '800',
      lineHeight: 22,
    },
    summaryBox: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
      borderRadius: 12,
      padding: 12,
      borderLeftWidth: 3,
      borderColor: colors.accent.blue,
    },
    summaryText: {
      color: colors.text.secondary,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '500',
    },
    sectionsDeck: {
      gap: 16,
    },
    sectionItem: {
      gap: 8,
    },
    sectionTitle: {
      color: colors.text.primary,
      fontSize: 13.5,
      fontWeight: '800',
    },
    sectionSubtitle: {
      color: colors.text.muted,
      fontSize: 11.5,
      fontWeight: '500',
      lineHeight: 16,
    },
    tableCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      overflow: 'hidden',
      marginTop: 4,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    thCell: {
      color: colors.text.primary,
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    tableDataRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    tableDataRowAlt: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
    },
    tdCell: {
      color: colors.text.secondary,
      fontSize: 10.5,
      lineHeight: 15,
      fontWeight: '500',
    },
    tdCellPrimary: {
      color: colors.text.primary,
      fontWeight: '700',
    },
    stepsDeck: {
      gap: 8,
      marginTop: 4,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    stepBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    stepBadgeText: {
      fontSize: 10.5,
      fontWeight: '800',
    },
    stepText: {
      flex: 1,
      color: colors.text.secondary,
      fontSize: 11.5,
      lineHeight: 17,
      fontWeight: '500',
    },
    notesDeck: {
      gap: 6,
      marginTop: 4,
    },
    noteBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: `${colors.accent.blue}10`,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: `${colors.accent.blue}30`,
    },
    noteText: {
      flex: 1,
      color: colors.text.secondary,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '500',
    },
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      gap: 8,
    },
    emptyTitle: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '800',
    },
    emptySub: {
      color: colors.text.muted,
      fontSize: 12,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    clearSearchBtn: {
      marginTop: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: `${colors.accent.blue}18`,
    },
    clearSearchBtnText: {
      color: colors.accent.blue,
      fontSize: 12,
      fontWeight: '700',
    },
  });
