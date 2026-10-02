import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import {
  UpdateInfo,
  skipVersion,
  openStore,
} from '../utils/updateChecker';

const { width } = Dimensions.get('window');

interface UpdatePromptProps {
  visible: boolean;
  updateInfo: UpdateInfo;
  onDismiss: () => void;
}

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({
  visible,
  updateInfo,
  onDismiss,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const handleUpdate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await openStore();
    onDismiss();
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipVersion(updateInfo.latestVersion);
    onDismiss();
  };

  const formattedDate = updateInfo.publishedAt
    ? new Date(updateInfo.publishedAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const bulletPoints = (updateInfo.releaseNotes || '')
    .split('\n')
    .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*'))
    .map((line) => line.replace(/^[\s\-\*]+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="arrow-up-circle-outline" size={32} color={colors.accent.blue} />
          </View>

          <Text style={styles.title}>Update Available</Text>

          <View style={styles.versionRow}>
            <View style={styles.versionBadge}>
              <Text style={styles.versionLabel}>v{updateInfo.currentVersion}</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={colors.text.muted} />
            <View style={[styles.versionBadge, styles.versionBadgeNew]}>
              <Text style={[styles.versionLabel, styles.versionLabelNew]}>
                v{updateInfo.latestVersion}
              </Text>
            </View>
          </View>

          {formattedDate ? (
            <Text style={styles.dateText}>Released {formattedDate}</Text>
          ) : null}

          {bulletPoints.length > 0 && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesTitle}>What's New</Text>
              {bulletPoints.map((point, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.btnStack}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleUpdate}
              activeOpacity={0.85}
            >
              <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Update</Text>
            </TouchableOpacity>

            <View style={styles.secondaryRow}>
              <TouchableOpacity onPress={onDismiss} style={styles.secondaryBtn}>
                <Text style={styles.secondaryText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSkip} style={styles.secondaryBtn}>
                <Text style={styles.secondaryText}>Skip Version</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    card: {
      width: Math.min(width - 40, 380),
      backgroundColor: isDark ? '#161922' : '#FFFFFF',
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
    },
    iconWrap: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: `${colors.accent.blue}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text.primary,
      marginBottom: 12,
      letterSpacing: -0.2,
    },
    versionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    versionBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    },
    versionBadgeNew: {
      backgroundColor: `${colors.accent.blue}20`,
    },
    versionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    versionLabelNew: {
      color: colors.accent.blue,
      fontWeight: '700',
    },
    dateText: {
      fontSize: 11,
      color: colors.text.muted,
      marginBottom: 14,
    },
    notesContainer: {
      width: '100%',
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
      borderRadius: 14,
      padding: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0',
    },
    notesTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 6,
    },
    bulletDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.accent.blue,
      marginTop: 6,
    },
    bulletText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
      color: colors.text.primary,
    },
    btnStack: {
      width: '100%',
      gap: 10,
    },
    primaryBtn: {
      backgroundColor: colors.accent.blue,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    secondaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
      marginTop: 4,
    },
    secondaryBtn: {
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    secondaryText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.muted,
    },
  });
