import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import {
  UpdateInfo,
  skipVersion,
  openDownloadUrl,
  downloadAndInstallAPK,
} from '../utils/updateChecker';

const { width } = Dimensions.get('window');

interface UpdatePromptProps {
  visible: boolean;
  updateInfo: UpdateInfo;
  onDismiss: () => void;
}

type UpdateState = 'idle' | 'downloading' | 'installing' | 'error';

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({
  visible,
  updateInfo,
  onDismiss,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  const handleStartInAppUpdate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUpdateState('downloading');
    setProgress(0);

    const success = await downloadAndInstallAPK(
      updateInfo.downloadUrl,
      (pct, written, total) => {
        setProgress(pct);
        setDownloadedBytes(written);
        setTotalBytes(total);
        if (pct >= 100) {
          setUpdateState('installing');
        }
      }
    );

    if (!success) {
      setUpdateState('error');
    }
  };

  const handleBrowserDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openDownloadUrl(updateInfo.downloadUrl);
    onDismiss();
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipVersion(updateInfo.latestVersion);
    onDismiss();
  };

  const formatMB = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formattedDate = updateInfo.publishedAt
    ? new Date(updateInfo.publishedAt).toLocaleDateString('en-IN', {
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
          {/* Top Status Icon */}
          <View
            style={[
              styles.iconWrap,
              updateState === 'downloading' && { backgroundColor: `${colors.accent.blue}20` },
              updateState === 'installing' && { backgroundColor: `${colors.accent.green}20` },
            ]}
          >
            <Ionicons
              name={
                updateState === 'installing'
                  ? 'checkmark-circle'
                  : updateState === 'downloading'
                  ? 'cloud-download-outline'
                  : 'rocket-outline'
              }
              size={30}
              color={
                updateState === 'installing'
                  ? colors.accent.green
                  : updateState === 'downloading'
                  ? colors.accent.blue
                  : colors.accent.purple
              }
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {updateState === 'downloading'
              ? 'Downloading Update...'
              : updateState === 'installing'
              ? 'Opening Package Installer'
              : 'New Version Available'}
          </Text>

          {/* Version Pill Row */}
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

          {formattedDate && updateState === 'idle' ? (
            <Text style={styles.dateText}>Released {formattedDate}</Text>
          ) : null}

          {/* DOWNLOADING STATE UI */}
          {updateState === 'downloading' && (
            <View style={styles.downloadingContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressStatusText}>
                  {progress < 100 ? 'Downloading APK...' : 'Finalizing download...'}
                </Text>
                <Text style={styles.progressPctText}>{progress}%</Text>
              </View>

              {/* Progress Bar Track */}
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>

              <View style={styles.progressMetaRow}>
                <Text style={styles.progressMetaText}>
                  {formatMB(downloadedBytes)} / {totalBytes > 0 ? formatMB(totalBytes) : 'calculating...'}
                </Text>
                <ActivityIndicator size="small" color={colors.accent.blue} />
              </View>
            </View>
          )}

          {/* INSTALLING STATE UI */}
          {updateState === 'installing' && (
            <View style={styles.installingContainer}>
              <Ionicons name="phone-portrait-outline" size={24} color={colors.accent.green} />
              <Text style={styles.installingText}>
                The system package installer window is opening. Confirm the prompt to complete installation!
              </Text>
            </View>
          )}

          {/* IDLE STATE RELEASE NOTES */}
          {updateState === 'idle' && bulletPoints.length > 0 && (
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

          {/* ACTION BUTTONS */}
          {updateState === 'idle' && (
            <View style={styles.btnStack}>
              {/* Primary In-App Direct Installer */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleStartInAppUpdate}
                activeOpacity={0.85}
              >
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Update Inside App</Text>
              </TouchableOpacity>

              {/* Secondary Option: Open in Browser */}
              <TouchableOpacity
                style={styles.browserBtn}
                onPress={handleBrowserDownload}
                activeOpacity={0.85}
              >
                <Ionicons name="open-outline" size={16} color={colors.text.primary} />
                <Text style={styles.browserBtnText}>Open Download Link in Browser</Text>
              </TouchableOpacity>

              {/* Dismiss / Skip */}
              <View style={styles.secondaryRow}>
                <TouchableOpacity onPress={onDismiss} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryText}>Remind Me Later</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSkip} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryText}>Skip This Version</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* CANCEL BUTTON WHILE DOWNLOADING */}
          {updateState === 'downloading' && (
            <TouchableOpacity
              onPress={() => setUpdateState('idle')}
              style={[styles.secondaryBtn, { marginTop: 16 }]}
            >
              <Text style={styles.secondaryText}>Cancel Download</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    card: {
      width: width - 40,
      maxWidth: 380,
      backgroundColor: isDark ? '#141420' : '#ffffff',
      borderRadius: 28,
      padding: 24,
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    iconWrap: {
      width: 60,
      height: 60,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      color: colors.text.primary,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.3,
      marginBottom: 10,
      textAlign: 'center',
    },
    versionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    versionBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    },
    versionBadgeNew: {
      backgroundColor: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)',
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(124,58,237,0.35)' : 'rgba(124,58,237,0.25)',
    },
    versionLabel: {
      color: colors.text.secondary,
      fontSize: 13,
      fontWeight: '600',
    },
    versionLabelNew: {
      color: colors.accent.purple,
      fontWeight: '700',
    },
    dateText: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 16,
    },
    notesContainer: {
      width: '100%',
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderRadius: 16,
      padding: 14,
      marginBottom: 20,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    notesTitle: {
      color: colors.text.tertiary,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    bulletDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.accent.purple,
      marginTop: 6,
      marginRight: 10,
    },
    bulletText: {
      color: colors.text.secondary,
      fontSize: 13,
      fontWeight: '500',
      flex: 1,
      lineHeight: 18,
    },
    btnStack: {
      width: '100%',
      gap: 10,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: colors.accent.purple,
    },
    primaryBtnText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },
    browserBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    browserBtnText: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    secondaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 6,
    },
    secondaryBtn: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    secondaryText: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '600',
    },

    // DOWNLOADING UI STYLES
    downloadingContainer: {
      width: '100%',
      marginVertical: 16,
      gap: 10,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressStatusText: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    progressPctText: {
      color: colors.accent.blue,
      fontSize: 14,
      fontWeight: '800',
    },
    progressBg: {
      height: 10,
      borderRadius: 5,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 5,
      backgroundColor: colors.accent.blue,
    },
    progressMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressMetaText: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '500',
    },

    // INSTALLING UI STYLES
    installingContainer: {
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(102,187,106,0.1)' : 'rgba(102,187,106,0.05)',
      borderRadius: 16,
      padding: 16,
      marginVertical: 16,
      gap: 10,
      borderWidth: 0.5,
      borderColor: 'rgba(102,187,106,0.3)',
    },
    installingText: {
      color: colors.text.primary,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
      fontWeight: '500',
    },
  });
