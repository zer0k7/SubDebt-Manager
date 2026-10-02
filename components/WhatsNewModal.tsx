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
  Platform,
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
      icon: 'color-palette-outline',
      color: '#0D9488',
      title: 'New Brand Identity',
      desc: 'Redesigned full-bleed icon, deep pine teal aesthetics, and compliant Android status-bar notification silhouette.',
    },
    {
      icon: 'cut-outline',
      color: '#EF4444',
      title: '1-Tap Unsubscribe Assistant',
      desc: 'Direct cancellation portals for Google Play, Apple, & web, plus pre-filled cancellation email generator.',
    },
    {
      icon: 'sparkles-outline',
      color: '#38BDF8',
      title: 'Aesthetic Financial Snapshot',
      desc: 'Generate and share beautiful monthly debt & subscription cards with built-in privacy masking.',
    },
    {
      icon: 'shield-checkmark-outline',
      color: '#10B981',
      title: 'Google Play Ready',
      desc: 'Optimized permissions, scoped storage compliance, and enhanced database reliability.',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Hero Branding */}
          <View style={styles.heroSection}>
            <View style={styles.logoRing}>
              <Image
                source={require('../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>WHAT'S NEW • v2.12.0</Text>
            </View>
            <Text style={styles.heroTitle}>Brand Refresh & Play Store Edition</Text>
            <Text style={styles.heroSubtitle}>
              Experience our upgraded visual identity and powerful new debt & subscription utilities.
            </Text>
          </View>

          {/* Feature List */}
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

          {/* Action Button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleDismiss} activeOpacity={0.8}>
            <Text style={styles.actionButtonText}>Explore SubDebt v2.12 🎉</Text>
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
      backgroundColor: 'rgba(0,0,0,0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalCard: {
      width: '100%',
      maxHeight: '85%',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 28,
      paddingHorizontal: 22,
      paddingTop: 24,
      paddingBottom: Platform.OS === 'ios' ? 24 : 20,
      borderWidth: 1.5,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 10,
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 16,
    },
    logoRing: {
      width: 76,
      height: 76,
      borderRadius: 24,
      backgroundColor: '#042723',
      borderWidth: 2,
      borderColor: '#0D9488',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#0D9488',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
      marginBottom: 12,
    },
    logoImage: {
      width: 58,
      height: 58,
      borderRadius: 16,
    },
    versionBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: 'rgba(13, 148, 136, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(13, 148, 136, 0.3)',
      marginBottom: 8,
    },
    versionBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#2DD4BF',
      letterSpacing: 0.8,
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text.primary,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    heroSubtitle: {
      fontSize: 12,
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 17,
      paddingHorizontal: 10,
    },
    featuresList: {
      marginVertical: 10,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    },
    featureIconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    featureTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 2,
    },
    featureDesc: {
      fontSize: 11,
      color: colors.text.secondary,
      lineHeight: 16,
    },
    actionButton: {
      backgroundColor: '#0D9488',
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 14,
      shadowColor: '#0D9488',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
