import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme } from '../hooks/useTheme';
import { shareReceiptImage } from '../utils/receiptHelper';
import { formatCurrency, formatDate } from '../utils/dateHelpers';

const { width, height } = Dimensions.get('window');

interface ReceiptVaultModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri?: string;
  title: string;
  amount?: number;
  currency?: string;
  category?: string;
  date?: string;
  notes?: string;
}

export const ReceiptVaultModal: React.FC<ReceiptVaultModalProps> = ({
  visible,
  onClose,
  imageUri,
  title,
  amount,
  currency,
  category,
  date,
  notes,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  if (!visible) return null;

  const handleShare = async () => {
    if (!imageUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await shareReceiptImage(imageUri, title);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: isDark ? 'rgba(8, 8, 14, 0.95)' : 'rgba(15, 23, 42, 0.88)' },
            ]}
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <View style={styles.headerBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#4FC3F7" />
              <Text style={styles.headerBadgeText}>PHOTO VAULT</Text>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleShare}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="share-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Center Image Container */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noImageWrap}>
              <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.4)" />
              <Text style={styles.noImageText}>Receipt photo not available</Text>
            </View>
          )}
        </View>

        {/* Footer Details Card */}
        <View style={styles.footerCard}>
          <View style={styles.footerRow}>
            <View style={styles.footerInfo}>
              <Text style={styles.footerCategory}>{category || 'Expense'}</Text>
              {date && <Text style={styles.footerDate}>{formatDate(date)}</Text>}
            </View>

            {amount !== undefined && currency && (
              <Text style={styles.footerAmount}>
                {formatCurrency(amount, currency)}
              </Text>
            )}
          </View>

          {notes ? (
            <View style={styles.notesBox}>
              <Ionicons name="document-text-outline" size={13} color="rgba(255,255,255,0.6)" />
              <Text style={styles.notesText} numberOfLines={2}>
                {notes}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'space-between',
      backgroundColor: 'rgba(0,0,0,0.85)',
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 54,
      paddingBottom: Platform.OS === 'ios' ? 38 : 24,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 10,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    headerTitleWrap: {
      alignItems: 'center',
      maxWidth: width * 0.6,
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: 'rgba(79, 195, 247, 0.2)',
      marginBottom: 3,
    },
    headerBadgeText: {
      color: '#4FC3F7',
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    headerTitle: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'center',
    },
    imageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 16,
    },
    receiptImage: {
      width: width - 32,
      height: height * 0.62,
      borderRadius: 16,
    },
    noImageWrap: {
      alignItems: 'center',
      gap: 12,
    },
    noImageText: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 14,
      fontWeight: '600',
    },
    footerCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderRadius: 18,
      padding: 14,
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      gap: 8,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerInfo: {
      gap: 2,
    },
    footerCategory: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    footerDate: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: 11.5,
      fontWeight: '500',
    },
    footerAmount: {
      color: '#4FC3F7',
      fontSize: 18,
      fontWeight: '900',
    },
    notesBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    notesText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 11.5,
      flex: 1,
    },
  });
