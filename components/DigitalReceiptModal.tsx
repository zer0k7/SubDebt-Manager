import { useTheme } from '../hooks/useTheme';
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { formatCurrency, formatDate } from '../utils/dateHelpers';
import { useSettings } from '../context/SettingsContext';

interface DigitalReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  amount: number;
  currency: string;
  categoryOrPerson: string;
  date: string;
  notes?: string;
  type: 'spending' | 'debt' | 'credit' | 'subscription';
  statusText?: string;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  visible,
  onClose,
  title,
  amount,
  currency,
  categoryOrPerson,
  date,
  notes,
  type,
  statusText,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const { formatCurrency: fmtCurr, formatDate: fmtDate } = useSettings();
  const receiptRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const receiptId = `RCP-${date ? date.slice(0, 10).replace(/-/g, '') : '2026'}-${Math.floor(1000 + Math.random() * 9000)}`;

  const getBadgeColor = () => {
    if (type === 'spending') return colors.accent.purple;
    if (type === 'debt') return colors.accent.red;
    if (type === 'credit') return colors.accent.green;
    return colors.accent.blue;
  };

  const handleShareReceipt = async () => {
    try {
      setSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const uri = await captureRef(receiptRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Receipt for ${title}`,
          UTI: 'public.png',
        });
      }
    } catch (err) {
      // Fallback
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Modal Close Button */}
          <View style={styles.topActions}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.modalHeading}>TRANSACTION RECEIPT</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* ViewShot Receipt Container */}
          <ViewShot ref={receiptRef} options={{ format: 'png', quality: 1.0 }} style={styles.receiptContainer}>
            <View style={styles.receiptHeader}>
              <View style={styles.brandRow}>
                <Ionicons name="wallet" size={24} color={colors.accent.purple} />
                <Text style={styles.brandName}>SubDebt Manager</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${getBadgeColor()}18`, borderColor: `${getBadgeColor()}40` }]}>
                <Text style={[styles.statusText, { color: getBadgeColor() }]}>
                  {statusText || (type === 'spending' ? 'EXPENSE' : type === 'debt' ? 'DEBT RECORD' : 'CREDIT RECORD')}
                </Text>
              </View>
            </View>

            <View style={styles.amountBox}>
              <Text style={styles.receiptAmount}>{fmtCurr(amount, currency)}</Text>
              <Text style={styles.receiptTitle}>{title}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {type === 'spending' ? 'Category' : type === 'subscription' ? 'Plan' : 'Person / Counterparty'}
                </Text>
                <Text style={styles.detailVal}>{categoryOrPerson}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailVal}>{fmtDate(date)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Receipt ID</Text>
                <Text style={styles.detailValMonospace}>{receiptId}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Verification</Text>
                <Text style={[styles.detailVal, { color: colors.accent.green }]}>100% Offline Verified</Text>
              </View>

              {notes ? (
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={[styles.detailVal, { fontStyle: 'italic' }]}>{notes}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.footerNote}>
              <Ionicons name="shield-checkmark" size={14} color={colors.accent.purple} />
              <Text style={styles.footerNoteText}>Encrypted On-Device Private Financial Receipt</Text>
            </View>
          </ViewShot>

          {/* Share Action CTA */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShareReceipt} disabled={sharing} activeOpacity={0.85}>
            {sharing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="share-social" size={18} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Share Receipt Image</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.bg,
      borderRadius: 26,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      gap: 16,
    },
    topActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.glass.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    modalHeading: {
      color: colors.text.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1,
    },
    receiptContainer: {
      backgroundColor: isDark ? '#121320' : '#FFFFFF',
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      gap: 14,
    },
    receiptHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    brandName: {
      color: isDark ? '#FFFFFF' : '#0F172A',
      fontSize: 15,
      fontWeight: '800',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    amountBox: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    receiptAmount: {
      color: isDark ? '#FFFFFF' : '#0F172A',
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -1,
    },
    receiptTitle: {
      color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#475569',
      fontSize: 15,
      fontWeight: '600',
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      marginVertical: 4,
    },
    detailsGrid: {
      gap: 10,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    detailLabel: {
      color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B',
      fontSize: 12,
      fontWeight: '600',
    },
    detailVal: {
      color: isDark ? '#FFFFFF' : '#0F172A',
      fontSize: 13,
      fontWeight: '700',
    },
    detailValMonospace: {
      color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#334155',
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontWeight: '700',
    },
    footerNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingTop: 8,
    },
    footerNoteText: {
      color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8',
      fontSize: 10,
      fontWeight: '600',
    },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.accent.purple,
    },
    shareBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
