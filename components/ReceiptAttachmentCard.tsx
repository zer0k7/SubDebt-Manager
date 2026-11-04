import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

export interface ReceiptAttachmentCardProps {
  receiptImage: string | null;
  onTakePhoto: () => void;
  onPickGallery: () => void;
  onRemove: () => void;
  onInspect: () => void;
}

export const ReceiptAttachmentCard: React.FC<ReceiptAttachmentCardProps> = ({
  receiptImage,
  onTakePhoto,
  onPickGallery,
  onRemove,
  onInspect,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const [loadError, setLoadError] = useState(false);

  if (receiptImage) {
    return (
      <View style={styles.cardAttached}>
        <TouchableOpacity
          style={styles.thumbWrapper}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onInspect();
          }}
          activeOpacity={0.85}
        >
          {!loadError ? (
            <Image
              source={{ uri: receiptImage }}
              style={styles.thumbnail}
              resizeMode="cover"
              onError={() => setLoadError(true)}
            />
          ) : (
            <View style={styles.thumbFallback}>
              <Ionicons name="image-outline" size={24} color={colors.text.muted} />
            </View>
          )}
          <View style={styles.viewBadge}>
            <Ionicons name="scan-outline" size={10} color="#FFFFFF" />
            <Text style={styles.viewBadgeText}>VIEW</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.attachedMeta}>
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.accent.green} />
            <Text style={styles.statusTitle} numberOfLines={1}>
              Receipt Attached
            </Text>
          </View>
          <Text style={styles.statusSubtitle} numberOfLines={1}>
            Stored securely on device
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionPill}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onInspect();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="eye-outline" size={13} color={colors.accent.blue} />
              <Text style={styles.actionPillTextBlue}>Inspect</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPill}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPickGallery();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={13} color={colors.accent.purple} />
              <Text style={styles.actionPillTextPurple}>Replace</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionPill, styles.actionPillDanger]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onRemove();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={13} color={colors.accent.red} />
              <Text style={styles.actionPillTextRed}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.pickerRow}>
      <TouchableOpacity
        style={styles.pickerBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTakePhoto();
        }}
        activeOpacity={0.75}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${colors.accent.blue}18` }]}>
          <Ionicons name="camera" size={20} color={colors.accent.blue} />
        </View>
        <View style={styles.pickerTextCol}>
          <Text style={styles.pickerTitle}>Take Photo</Text>
          <Text style={styles.pickerSub}>Camera</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.pickerBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPickGallery();
        }}
        activeOpacity={0.75}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${colors.accent.purple}18` }]}>
          <Ionicons name="images" size={20} color={colors.accent.purple} />
        </View>
        <View style={styles.pickerTextCol}>
          <Text style={styles.pickerTitle}>From Gallery</Text>
          <Text style={styles.pickerSub}>Photo Library</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    pickerRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    pickerBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickerTextCol: {
      flex: 1,
      minWidth: 0,
    },
    pickerTitle: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    pickerSub: {
      color: colors.text.muted,
      fontSize: 10.5,
      fontWeight: '500',
      marginTop: 1,
    },
    cardAttached: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 18,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(79, 195, 247, 0.25)' : 'rgba(2, 132, 199, 0.2)',
      marginBottom: 10,
    },
    thumbWrapper: {
      position: 'relative',
      width: 66,
      height: 66,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    thumbFallback: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewBadge: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingVertical: 2.5,
    },
    viewBadgeText: {
      color: '#FFFFFF',
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    attachedMeta: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusTitle: {
      color: colors.text.primary,
      fontSize: 13.5,
      fontWeight: '700',
    },
    statusSubtitle: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '500',
      marginBottom: 4,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    actionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4.5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(79, 195, 247, 0.12)' : 'rgba(2, 132, 199, 0.08)',
    },
    actionPillDanger: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
    },
    actionPillTextBlue: {
      color: colors.accent.blue,
      fontSize: 11,
      fontWeight: '700',
    },
    actionPillTextPurple: {
      color: colors.accent.purple,
      fontSize: 11,
      fontWeight: '700',
    },
    actionPillTextRed: {
      color: colors.accent.red,
      fontSize: 11,
      fontWeight: '700',
    },
  });
