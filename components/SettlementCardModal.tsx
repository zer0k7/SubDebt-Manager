import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { useTheme } from '../hooks/useTheme';
import { formatCurrency, formatDate } from '../utils/dateHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 44, 360);

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

  const statusLabel = isBorrowed ? 'DEBT SETTLED' : 'FUNDS RECEIVED';
  const initialsLetter = personName ? personName.charAt(0).toUpperCase() : 'S';

  const dateId = settleDate
    ? new Date(settleDate).toISOString().split('T')[0].replace(/-/g, '')
    : new Date().toISOString().split('T')[0].replace(/-/g, '');
  const refCode = `REC-${dateId}-${String(item.id || '000').slice(-4).toUpperCase()}`;

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSharing(true);
      const uri = await (cardRef.current as any).capture();
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        setSharing(false);
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: isBorrowed ? 'Share Settlement Receipt' : 'Share Credit Receipt',
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
              <View style={styles.receiptCard}>
                <View style={styles.headerRow}>
                  <View style={styles.brandRow}>
                    <Image
                      source={require('../assets/icon.png')}
                      style={styles.brandIcon}
                      resizeMode="cover"
                    />
                    <View>
                      <Text style={styles.brandName}>SubDebt</Text>
                      <Text style={styles.brandSubtitle}>OFFLINE LEDGER</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, isBorrowed ? styles.statusBadgeDebt : styles.statusBadgeCredit]}>
                    <Text style={[styles.statusText, isBorrowed ? styles.statusTextDebt : styles.statusTextCredit]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                <View style={styles.amountSection}>
                  <View style={[styles.checkCircle, isBorrowed ? styles.checkCircleDebt : styles.checkCircleCredit]}>
                    <Ionicons
                      name="checkmark"
                      size={26}
                      color={isBorrowed ? '#059669' : '#0D9488'}
                    />
                  </View>

                  <Text style={styles.amountLabel}>TOTAL SETTLED AMOUNT</Text>
                  <Text style={styles.amountValue}>{formatCurrency(amount, currency)}</Text>
                </View>

                <View style={styles.partyCard}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initialsLetter}</Text>
                  </View>
                  <View style={styles.partyDetails}>
                    <Text style={styles.partyName}>{personName}</Text>
                    <Text style={styles.partyRole}>
                      {isBorrowed ? 'Repaid to lender in full' : 'Repayment collected in full'}
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.gridCell}>
                    <Text style={styles.gridCellLabel}>RECORDED</Text>
                    <Text style={styles.gridCellValue}>{formatDate(recordDate)}</Text>
                  </View>
                  <View style={[styles.gridCell, styles.gridCellBorder]}>
                    <Text style={styles.gridCellLabel}>SETTLED ON</Text>
                    <Text style={styles.gridCellValue}>
                      {settleDate ? formatDate(settleDate) : formatDate(new Date().toISOString())}
                    </Text>
                  </View>
                  <View style={styles.gridCell}>
                    <Text style={styles.gridCellLabel}>CURRENCY</Text>
                    <Text style={styles.gridCellValue}>{currency}</Text>
                  </View>
                </View>

                {(purpose || notes) && (
                  <View style={styles.notesContainer}>
                    {purpose && (
                      <View style={styles.noteItem}>
                        <Text style={styles.noteLabel}>PURPOSE</Text>
                        <Text style={styles.noteValue}>{purpose}</Text>
                      </View>
                    )}
                    {notes && (
                      <View style={[styles.noteItem, purpose && styles.noteItemMargin]}>
                        <Text style={styles.noteLabel}>NOTES</Text>
                        <Text style={styles.noteValue}>{notes}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.footerRow}>
                  <View style={styles.footerLeft}>
                    <Text style={styles.footerDocText}>Transaction Receipt</Text>
                    <Text style={styles.footerSubText}>Verified Local Storage</Text>
                  </View>
                  <View style={styles.footerRight}>
                    <Text style={styles.refCodeLabel}>REFERENCE ID</Text>
                    <Text style={styles.refCodeValue}>{refCode}</Text>
                  </View>
                </View>
              </View>
            </ViewShot>
          </ScrollView>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.85}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.shareBtnText}>
                {sharing ? 'Generating Image...' : 'Share Receipt Image'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
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
      backgroundColor: isDark ? '#0B0F17' : '#FFFFFF',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderTopWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    scrollArea: {
      width: '100%',
      flexShrink: 1,
    },
    scrollContentContainer: {
      alignItems: 'center',
      paddingBottom: 4,
    },
    viewShotWrapper: {
      width: CARD_WIDTH,
      borderRadius: 20,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 18,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    receiptCard: {
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    brandIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
    },
    brandName: {
      fontSize: 14,
      fontWeight: '800',
      color: '#0F172A',
      letterSpacing: -0.2,
    },
    brandSubtitle: {
      fontSize: 8.5,
      fontWeight: '700',
      color: '#64748B',
      letterSpacing: 0.8,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    statusBadgeDebt: {
      backgroundColor: 'rgba(5, 150, 105, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(5, 150, 105, 0.25)',
    },
    statusBadgeCredit: {
      backgroundColor: 'rgba(13, 148, 136, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(13, 148, 136, 0.25)',
    },
    statusText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    statusTextDebt: {
      color: '#059669',
    },
    statusTextCredit: {
      color: '#0D9488',
    },
    amountSection: {
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
      marginBottom: 16,
    },
    checkCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    checkCircleDebt: {
      backgroundColor: 'rgba(5, 150, 105, 0.12)',
    },
    checkCircleCredit: {
      backgroundColor: 'rgba(13, 148, 136, 0.12)',
    },
    amountLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#64748B',
      letterSpacing: 1.2,
      marginBottom: 4,
    },
    amountValue: {
      fontSize: 34,
      fontWeight: '900',
      color: '#0F172A',
      letterSpacing: -0.8,
    },
    partyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 14,
      padding: 12,
      gap: 12,
      marginBottom: 14,
    },
    avatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#0F172A',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '800',
    },
    partyDetails: {
      flex: 1,
    },
    partyName: {
      fontSize: 15,
      fontWeight: '800',
      color: '#0F172A',
    },
    partyRole: {
      fontSize: 11,
      color: '#64748B',
      fontWeight: '500',
      marginTop: 2,
    },
    detailsGrid: {
      flexDirection: 'row',
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      marginBottom: 14,
    },
    gridCell: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'center',
    },
    gridCellBorder: {
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: '#E2E8F0',
    },
    gridCellLabel: {
      fontSize: 8.5,
      fontWeight: '700',
      color: '#64748B',
      letterSpacing: 0.6,
      marginBottom: 3,
    },
    gridCellValue: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#0F172A',
      textAlign: 'center',
    },
    notesContainer: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
    },
    noteItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    noteItemMargin: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    },
    noteLabel: {
      fontSize: 8.5,
      fontWeight: '800',
      color: '#64748B',
      letterSpacing: 0.8,
      width: 58,
      marginTop: 1,
    },
    noteValue: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: '#1E293B',
      lineHeight: 17,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
    },
    footerLeft: {},
    footerDocText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: '#0F172A',
    },
    footerSubText: {
      fontSize: 8.5,
      fontWeight: '500',
      color: '#64748B',
      marginTop: 1,
    },
    footerRight: {
      alignItems: 'flex-end',
    },
    refCodeLabel: {
      fontSize: 8,
      fontWeight: '700',
      color: '#64748B',
      letterSpacing: 0.6,
    },
    refCodeValue: {
      fontSize: 10.5,
      fontWeight: '800',
      color: '#0F172A',
      letterSpacing: 0.4,
      marginTop: 1,
    },
    actionsRow: {
      width: CARD_WIDTH,
      marginTop: 16,
      gap: 10,
    },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: '#0D9488',
    },
    shareBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    closeBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    closeBtnText: {
      color: colors.text.secondary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
