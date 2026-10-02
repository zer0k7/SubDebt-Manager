import { useTheme } from '../hooks/useTheme';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';

interface CancelSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  subscription: {
    name: string;
    amount: number;
    currency: string;
    billingCycle: string;
    nextBillingDate?: string;
    isActive?: boolean;
  };
  onMarkCancelled?: () => void;
}

// Map common subscriptions to their direct cancellation / subscription management portals
function getDirectPortalUrl(name: string): { url: string; label: string; isDirect: boolean } {
  const n = (name || '').toLowerCase().trim();

  if (n.includes('google') || n.includes('play store') || n.includes('youtube')) {
    return {
      url: 'https://play.google.com/store/account/subscriptions',
      label: 'Google Play Subscriptions',
      isDirect: true,
    };
  }
  if (n.includes('apple') || n.includes('icloud') || n.includes('app store')) {
    return {
      url: 'https://apps.apple.com/account/subscriptions',
      label: 'Apple App Store Subscriptions',
      isDirect: true,
    };
  }
  if (n.includes('netflix')) {
    return {
      url: 'https://www.netflix.com/youraccount',
      label: 'Netflix Account & Cancel',
      isDirect: true,
    };
  }
  if (n.includes('spotify')) {
    return {
      url: 'https://www.spotify.com/account/subscription/',
      label: 'Spotify Subscription Plan',
      isDirect: true,
    };
  }
  if (n.includes('amazon') || n.includes('prime')) {
    return {
      url: 'https://www.amazon.com/mc/manage',
      label: 'Amazon Prime Memberships',
      isDirect: true,
    };
  }
  if (n.includes('chatgpt') || n.includes('openai')) {
    return {
      url: 'https://chatgpt.com/#settings/Subscription',
      label: 'ChatGPT Plus Settings',
      isDirect: true,
    };
  }
  if (n.includes('disney') || n.includes('hotstar')) {
    return {
      url: 'https://www.disneyplus.com/account',
      label: 'Disney+ / Hotstar Account',
      isDirect: true,
    };
  }
  if (n.includes('github')) {
    return {
      url: 'https://github.com/settings/billing',
      label: 'GitHub Billing & Plans',
      isDirect: true,
    };
  }
  if (n.includes('adobe')) {
    return {
      url: 'https://account.adobe.com/plans',
      label: 'Adobe Plans & Products',
      isDirect: true,
    };
  }
  if (n.includes('microsoft') || n.includes('office') || n.includes('xbox')) {
    return {
      url: 'https://account.microsoft.com/services',
      label: 'Microsoft Services & Subscriptions',
      isDirect: true,
    };
  }
  if (n.includes('linkedin')) {
    return {
      url: 'https://www.linkedin.com/premium/cancel',
      label: 'LinkedIn Premium Cancel',
      isDirect: true,
    };
  }

  // Fallback to Google Search specifically for how to cancel
  return {
    url: `https://www.google.com/search?q=how+to+cancel+${encodeURIComponent(name)}+subscription`,
    label: `Search "How to cancel ${name}"`,
    isDirect: false,
  };
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  visible,
  onClose,
  subscription,
  onMarkCancelled,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const portal = getDirectPortalUrl(subscription.name);

  const cancellationLetter = `Subject: Formal Cancellation Request - ${subscription.name}

Dear Support Team,

I am writing to formally request the immediate cancellation of my subscription for "${subscription.name}".

Subscription Details:
- Service: ${subscription.name}
- Recurring Outlay: ${subscription.currency} ${subscription.amount} (${subscription.billingCycle})
- Date of Request: ${new Date().toLocaleDateString()}

Please ensure that all recurring automatic debits are halted immediately and that no future renewal fees are billed to my payment method. Kindly reply to confirm that this cancellation has been processed.

Thank you,
[Your Name]`;

  const handleOpenPortal = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (portal.url.startsWith('https://')) {
        await WebBrowser.openBrowserAsync(portal.url);
      } else {
        await Linking.openURL(portal.url);
      }
    } catch {
      await Linking.openURL(portal.url);
    }
  };

  const handleOpenPlayStoreSubscriptions = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const playUrl = 'https://play.google.com/store/account/subscriptions';
    try {
      await Linking.openURL(playUrl);
    } catch {
      await WebBrowser.openBrowserAsync(playUrl);
    }
  };

  const handleShareOrCopyLetter = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: cancellationLetter,
        title: `Cancellation Request for ${subscription.name}`,
      });
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch {}
  };

  const handleEmailSupport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const subject = encodeURIComponent(`Cancellation Request - ${subscription.name}`);
    const body = encodeURIComponent(cancellationLetter);
    const mailto = `mailto:?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(mailto);
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Ionicons name="cut-outline" size={24} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Unsubscribe Assistant</Text>
              <Text style={styles.subtitle}>{subscription.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Step 1: Direct Portal Action */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="globe-outline" size={18} color="#0D9488" />
                <Text style={styles.sectionTitle}>1. Direct Cancellation Link</Text>
              </View>
              <Text style={styles.sectionDesc}>
                Open the official management page to terminate renewal before your next billing cycle.
              </Text>

              <TouchableOpacity style={styles.primaryActionButton} onPress={handleOpenPortal}>
                <Ionicons
                  name={portal.isDirect ? 'open-outline' : 'search-outline'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.primaryActionText}>{portal.label}</Text>
              </TouchableOpacity>

              {/* Universal Google Play Shortcut */}
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={handleOpenPlayStoreSubscriptions}
              >
                <Ionicons name="logo-google-playstore" size={17} color={colors.text.primary} />
                <Text style={styles.secondaryActionText}>Google Play Subscriptions Hub</Text>
              </TouchableOpacity>
            </View>

            {/* Step 2: Email / Support Letter Generator */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="mail-unread-outline" size={18} color="#F59E0B" />
                <Text style={styles.sectionTitle}>2. Cancellation Letter Generator</Text>
              </View>
              <Text style={styles.sectionDesc}>
                If the service requires written notice, use this pre-filled formal cancellation template:
              </Text>

              <View style={styles.templatePreviewBox}>
                <Text style={styles.templateText} numberOfLines={4}>
                  {cancellationLetter}
                </Text>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.halfBtn} onPress={handleShareOrCopyLetter}>
                  <Ionicons
                    name={copiedSuccess ? 'checkmark-circle' : 'share-social-outline'}
                    size={16}
                    color={copiedSuccess ? '#10B981' : colors.text.primary}
                  />
                  <Text style={[styles.halfBtnText, copiedSuccess && { color: '#10B981' }]}>
                    {copiedSuccess ? 'Shared!' : 'Share / Copy'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.halfBtn} onPress={handleEmailSupport}>
                  <Ionicons name="mail-outline" size={16} color={colors.text.primary} />
                  <Text style={styles.halfBtnText}>Email Support</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Step 3: Deactivate in SubDebt */}
            {onMarkCancelled && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="checkmark-done-circle-outline" size={18} color="#10B981" />
                  <Text style={styles.sectionTitle}>3. Update in SubDebt</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Mark this subscription as cancelled to immediately stop renewal alerts and exclude it from your monthly forecast.
                </Text>

                <TouchableOpacity
                  style={[styles.deactivateBtn, !subscription.isActive && styles.disabledBtn]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onMarkCancelled();
                    onClose();
                  }}
                  disabled={!subscription.isActive}
                >
                  <Ionicons
                    name={subscription.isActive ? 'pause-circle-outline' : 'checkmark-circle'}
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.deactivateBtnText}>
                    {subscription.isActive ? 'Mark Inactive in SubDebt' : 'Already Inactive'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
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
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: Platform.OS === 'ios' ? 36 : 24,
      maxHeight: '85%',
      borderTopWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
    subtitle: {
      fontSize: 13,
      color: colors.text.secondary,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollArea: {
      marginTop: 4,
    },
    sectionCard: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.primary,
    },
    sectionDesc: {
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 18,
      marginBottom: 14,
    },
    primaryActionButton: {
      backgroundColor: '#0D9488',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
      marginBottom: 10,
    },
    primaryActionText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    secondaryActionButton: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 11,
      borderRadius: 14,
    },
    secondaryActionText: {
      color: colors.text.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    templatePreviewBox: {
      backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : '#FFFFFF',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
      marginBottom: 12,
    },
    templateText: {
      fontSize: 11,
      color: colors.text.secondary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      lineHeight: 16,
    },
    btnRow: {
      flexDirection: 'row',
      gap: 10,
    },
    halfBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
      paddingVertical: 11,
      borderRadius: 12,
    },
    halfBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.primary,
    },
    deactivateBtn: {
      backgroundColor: '#10B981',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
    },
    disabledBtn: {
      backgroundColor: isDark ? '#334155' : '#94A3B8',
    },
    deactivateBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
  });
