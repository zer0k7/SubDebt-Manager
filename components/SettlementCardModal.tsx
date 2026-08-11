import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Dimensions, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { useTheme } from '../hooks/useTheme';
import { formatCurrency, formatDate } from '../utils/dateHelpers';
import { getAvatarColor, hexToRgba } from '../utils/colorHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 360);

interface SettlementCardModalProps {
  visible: boolean;
  onClose: () => void;
  item: any;
  type?: 'borrowed' | 'lent' | null;
}

export const SettlementCardModal: React.FC<SettlementCardModalProps> = ({
  visible,
  onClose,
  item,
  type,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const cardRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom + 16, Platform.OS === 'ios' ? 32 : 24);

  if (!item || !type) return null;

  const isBorrowed = type === 'borrowed';
  const personName = item.personName;
  const amount = item.amount;
  const currency = item.currency;
  const purpose = item.purpose;
  const notes = item.notes;
  const recordDate = isBorrowed ? item.takenDate : item.lentDate;
  const settleDate = isBorrowed ? item.paidDate : item.returnedDate;

  // Theme variants: Professional White with Logo Accent Colors (#7C3AED)
  const gradientColors = ['#FFFFFF', '#F8FAFC', '#F1F5F9'] as const;

  const accentColor = '#7C3AED';
  const accentColorMid = '#6D28D9';
  const glowColor = 'rgba(124, 58, 237, 0.35)';
  const statusLabel = isBorrowed ? 'DEBT CLEARED' : 'FUNDS RETURNED';
  const statusIcon = isBorrowed ? 'checkmark-done-circle' : 'arrow-undo-circle';
  const initialsLetter = personName.charAt(0).toUpperCase();

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSharing(true);
      const uri = await (cardRef.current as any).capture();
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) { setSharing(false); return; }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: isBorrowed ? 'Share Debt Receipt' : 'Share Credit Receipt',
        UTI: 'public.png',
      });
    } catch (e) {
      console.error('Share error:', e);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <BlurView tint="dark" intensity={70} style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: bottomPadding }]}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <ViewShot
              ref={cardRef}
              options={{ format: 'png', quality: 1.0 }}
              style={styles.viewShotWrapper}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.card}
              >
                <View style={[styles.orb, styles.orbTopRight, { backgroundColor: accentColor, opacity: 0.08 }]} />
                <View style={[styles.orb, styles.orbBottomLeft, { backgroundColor: accentColorMid, opacity: 0.06 }]} />
                <View style={[styles.orbSmall, styles.orbSmallMid, { backgroundColor: accentColor, opacity: 0.05 }]} />

                <LinearGradient
                  colors={['transparent', 'rgba(124, 58, 237, 0.03)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.shimmerStripe}
                />

                <View style={[styles.topEdgeGlow, { backgroundColor: 'rgba(124, 58, 237, 0.3)' }]} />

                <View style={styles.headerRow}>
                  <View style={styles.brandPill}>
                    <Ionicons name="flash" size={10} color={accentColor} />
                    <Text style={[styles.brandPillText, { color: accentColor }]}>SUBDEBT</Text>
                  </View>
                  <View style={[styles.statusChip, { borderColor: hexToRgba(accentColor, 0.3), backgroundColor: hexToRgba(accentColor, 0.08) }]}>
                    <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
                    <Text style={[styles.statusChipText, { color: accentColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                <View style={styles.heroZone}>
                  <View style={[styles.glowRingOuter, { borderColor: hexToRgba(accentColor, 0.15) }]} />
                  <View style={[styles.glowRingMid, { borderColor: hexToRgba(accentColor, 0.25) }]} />
                  <View style={[styles.iconCircle, { backgroundColor: hexToRgba(accentColor, 0.1), borderColor: hexToRgba(accentColor, 0.35) }]}>
                    <Ionicons name={statusIcon as any} size={44} color={accentColor} />
                  </View>
                </View>

                <Text style={styles.amountLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.amountValue}>{formatCurrency(amount, currency)}</Text>

                <View style={[styles.personCard, { borderColor: hexToRgba(accentColor, 0.3), backgroundColor: hexToRgba(accentColor, 0.08) }]}>
                  <LinearGradient
                    colors={[hexToRgba(accentColor, 0.18), hexToRgba(accentColor, 0.06)]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.avatarCircle}
                  >
                    <Text style={styles.avatarLetter}>{initialsLetter}</Text>
                  </LinearGradient>
                  <View style={styles.personMeta}>
                    <Text style={styles.personNameText}>{personName}</Text>
                    <Text style={styles.personRole}>
                      {isBorrowed ? '↑ Paid back to lender' : '↓ Funds received from'}
                    </Text>
                  </View>
                  <View style={[styles.personBadge, { backgroundColor: hexToRgba(accentColor, 0.15) }]}>
                    <Ionicons name="checkmark-circle" size={16} color={accentColor} />
                  </View>
                </View>

                <View style={styles.tearRow}>
                  <View style={styles.tearCircleLeft} />
                  <View style={styles.tearLine} />
                  {[...Array(14)].map((_, i) => (
                    <View key={i} style={styles.tearDot} />
                  ))}
                  <View style={styles.tearLineFill} />
                  <View style={styles.tearCircleRight} />
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailCellLabel}>RECORDED</Text>
                    <Text style={styles.detailCellValue}>{formatDate(recordDate)}</Text>
                  </View>
                  <View style={[styles.detailCell, styles.detailCellBordered]}>
                    <Text style={styles.detailCellLabel}>SETTLED ON</Text>
                    <Text style={styles.detailCellValue}>
                      {settleDate ? formatDate(settleDate) : formatDate(new Date().toISOString())}
                    </Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailCellLabel}>CURRENCY</Text>
                    <Text style={styles.detailCellValue}>{currency}</Text>
                  </View>
                </View>

                {(purpose || notes) && (
                  <View style={[styles.notesBlock, { borderColor: hexToRgba(accentColor, 0.2) }]}>
                    {purpose && (
                      <View style={styles.notesRow}>
                        <Text style={styles.notesRowLabel}>PURPOSE</Text>
                        <Text style={styles.notesRowValue}>{purpose}</Text>
                      </View>
                    )}
                    {notes && (
                      <View style={[styles.notesRow, purpose && styles.notesRowTop]}>
                        <Text style={styles.notesRowLabel}>NOTES</Text>
                        <Text style={[styles.notesRowValue, styles.notesItalic]}>"{notes}"</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.bottomStrip}>
                  <View style={styles.dotGrid}>
                    {[...Array(12)].map((_, i) => (
                      <View key={i} style={[styles.dotGridItem, { opacity: 0.25 + (i % 3) * 0.08 }]} />
                    ))}
                  </View>
                  <View style={styles.bottomBrandRow}>
                    <View style={styles.bottomBrandLeft}>
                      <View style={[styles.bottomLogoMark, { backgroundColor: hexToRgba(accentColor, 0.2), borderColor: hexToRgba(accentColor, 0.4) }]}>
                        <Ionicons name="flash" size={12} color={accentColor} />
                      </View>
                      <View>
                        <Text style={styles.bottomBrandName}>SubDebt Ledger</Text>
                        <Text style={styles.bottomBrandSub}>Settlement Certificate</Text>
                      </View>
                    </View>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={10} color={accentColor} />
                      <Text style={[styles.verifiedText, { color: accentColor }]}>VERIFIED</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </ViewShot>
          </ScrollView>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: accentColorMid, shadowColor: glowColor }]}
              onPress={handleShare}
              activeOpacity={0.85}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="share-social" size={18} color="#FFF" />
              )}
              <Text style={styles.shareBtnText}>
                {sharing ? 'Saving Image...' : 'Share as Image'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxHeight: '92%',
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(8,8,18,0.97)' : 'rgba(10,10,20,0.96)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scrollArea: {
    width: '100%',
    flexShrink: 1,
  },
  scrollContentContainer: {
    alignItems: 'center',
    paddingBottom: 4,
  },

  // ── ViewShot Wrapper ──
  viewShotWrapper: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
    }),
  },

  // ── Main Card ──
  card: {
    width: '100%',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 0,
    overflow: 'hidden',
    position: 'relative',
  },

  // ── Decorative BG Orbs ──
  orb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  orbTopRight: { top: -60, right: -60 },
  orbBottomLeft: { bottom: 40, left: -80 },
  orbSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  orbSmallMid: { top: '45%', right: -20 },
  shimmerStripe: {
    position: 'absolute',
    top: 0, bottom: 0,
    left: '30%',
    width: '50%',
    transform: [{ skewX: '-15deg' }],
  },
  topEdgeGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  // ── Header Row ──
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  brandPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── Hero Zone ──
  heroZone: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    height: 120,
  },
  glowRingOuter: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
  },
  glowRingMid: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },

  // ── Amount ──
  amountLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
  },
  amountValue: {
    color: '#0F172A',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
    textAlign: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
  },

  // ── Person Card ──
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  personMeta: { flex: 1 },
  personNameText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  personRole: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  personBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Perforated Tear Line ──
  tearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: CARD_WIDTH + 40,
    marginLeft: -20,
    height: 24,
    marginBottom: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  tearCircleLeft: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: isDark ? 'rgba(8,8,18,0.97)' : 'rgba(10,10,20,0.96)',
    position: 'absolute',
    left: -11,
    zIndex: 2,
  },
  tearCircleRight: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: isDark ? 'rgba(8,8,18,0.97)' : 'rgba(10,10,20,0.96)',
    position: 'absolute',
    right: -11,
    zIndex: 2,
  },
  tearLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  tearLineFill: { flex: 1 },
  tearDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginHorizontal: 3,
  },

  // ── Details Grid ──
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  detailCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  detailCellBordered: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  detailCellLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  detailCellValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Notes Block ──
  notesBlock: {
    borderWidth: 0.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.04)',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  notesRowTop: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(124, 58, 237, 0.1)',
  },
  notesRowLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
    width: 52,
  },
  notesRowValue: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  notesItalic: { fontStyle: 'italic' },

  // ── Bottom Brand Strip ──
  bottomStrip: {
    marginLeft: -20,
    marginRight: -20,
    marginTop: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.04)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dotGrid: {
    position: 'absolute',
    top: 8,
    right: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 48,
    gap: 4,
  },
  dotGridItem: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#7C3AED',
  },
  bottomBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBrandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomLogoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBrandName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bottomBrandSub: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  verifiedText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // ── Action Buttons ──
  actionsRow: {
    width: '100%',
    marginTop: 16,
    gap: 10,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
  },
});
