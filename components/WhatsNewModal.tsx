import { useTheme } from '../hooks/useTheme';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface WhatsNewModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ visible, onDismiss }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const handleDismiss = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDismiss();
  };

  const features = [
    {
      icon: 'contrast-outline',
      color: '#38BDF8',
      title: 'Pure AMOLED Dark Theme',
      desc: 'True pitch black surfaces across all cards, navigation, and sheets with zero murky purple tint.',
    },
    {
      icon: 'albums-outline',
      color: '#A855F7',
      title: 'Instant Floating Header',
      desc: 'Synchronous mounting eliminates top bar flickering and text overflow during tab switching.',
    },
    {
      icon: 'shield-checkmark-outline',
      color: '#10B981',
      title: 'Adaptive Layout Bounds',
      desc: 'Auto-scaling typography and responsive containers prevent number clipping on all screen sizes.',
    },
    {
      icon: 'document-text-outline',
      color: '#F59E0B',
      title: 'High-Contrast Reports',
      desc: 'PDF statements updated with deep black styling, refined table lines, and enhanced legibility.',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.heroSection}>
            <View style={styles.logoRing}>
              <Image
                source={require('../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>WHAT IS NEW IN v2.15.1</Text>
            </View>
            <Text style={styles.heroTitle}>Pure Dark & Performance</Text>
            <Text style={styles.heroSubtitle}>
              True black display optimization, seamless navigation, and responsive layout hardening.
            </Text>
          </View>

          <ScrollView style={styles.featuresList} showsVerticalScrollIndicator={false}>
            {features.map((item, idx) => (
              <View key={idx} style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.actionButton} onPress={handleDismiss} activeOpacity={0.8}>
            <Text style={styles.actionButtonText}>Continue to SubDebt</Text>
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
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalCard: {
      width: '100%',
      maxHeight: '85%',
      backgroundColor: isDark ? colors.glass.card : '#FFFFFF',
      borderRadius: 28,
      padding: 24,
      borderWidth: 1,
      borderColor: isDark ? colors.glass.cardBorder : 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 10,
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 20,
    },
    logoRing: {
      width: 64,
      height: 64,
      borderRadius: 18,
      backgroundColor: 'rgba(13, 148, 136, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(13, 148, 136, 0.3)',
    },
    logoImage: {
      width: 48,
      height: 48,
      borderRadius: 14,
    },
    versionBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: 'rgba(13, 148, 136, 0.15)',
      marginBottom: 8,
    },
    versionBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#0D9488',
      letterSpacing: 0.8,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: 6,
      letterSpacing: -0.2,
    },
    heroSubtitle: {
      fontSize: 12,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 17,
      paddingHorizontal: 10,
    },
    featuresList: {
      marginBottom: 20,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 16,
    },
    featureIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 2,
    },
    featureDesc: {
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 16,
    },
    actionButton: {
      backgroundColor: '#0D9488',
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  });
