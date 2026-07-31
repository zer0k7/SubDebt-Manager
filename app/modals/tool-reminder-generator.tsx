import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { AmbientBackground } from '../../components/AmbientBackground';
import { useCredits, Credit } from '../../hooks/useCredits';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency, formatDate } from '../../utils/dateHelpers';
import { GlassButton } from '../../components/GlassButton';

type Tone = 'friendly' | 'casual' | 'polite' | 'direct' | 'formal';

const TONES: { id: Tone; label: string; icon: string }[] = [
  { id: 'friendly', label: 'Friendly', icon: 'happy-outline' },
  { id: 'casual', label: 'Casual', icon: 'chatbubble-ellipses-outline' },
  { id: 'polite', label: 'Polite', icon: 'sparkles-outline' },
  { id: 'direct', label: 'Direct', icon: 'flash-outline' },
  { id: 'formal', label: 'Formal', icon: 'briefcase-outline' },
];

export default function ToolReminderGeneratorModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const { credits } = useCredits();
  const { currencyCode, convertAmount } = useCurrency();

  const pendingCredits = useMemo(() => credits.filter((c) => !c.isReturned), [credits]);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(() => pendingCredits[0] || null);
  const [selectedTone, setSelectedTone] = useState<Tone>('friendly');

  React.useEffect(() => {
    if (!selectedCredit && pendingCredits.length > 0) {
      setSelectedCredit(pendingCredits[0]);
    }
  }, [pendingCredits, selectedCredit]);

  const generatedMessage = useMemo(() => {
    if (!selectedCredit) {
      return 'No pending credit selected. Choose or add a credit record to generate a payment reminder.';
    }

    const name = selectedCredit.personName || 'Friend';
    const amountStr = formatCurrency(convertAmount(selectedCredit.amount, selectedCredit.currency), currencyCode);
    const dateStr = formatDate(selectedCredit.lentDate);
    const note = selectedCredit.notes ? ` (${selectedCredit.notes})` : '';

    switch (selectedTone) {
      case 'casual':
        return `Hey ${name}! Just a quick check-in about the ${amountStr} for${note ? note : ' dinner/expenses'} back on ${dateStr}. Let me know whenever you're ready to settle it up! 👍`;
      case 'polite':
        return `Hi ${name}, hope you're doing well! Just wanted to gently remind you about the outstanding balance of ${amountStr}${note} from ${dateStr}. Whenever it's convenient for you, please let me know! Thanks! 😊`;
      case 'direct':
        return `Hi ${name}, following up on the ${amountStr} balance from ${dateStr}${note}. Please transfer it when you have a moment. Thank you!`;
      case 'formal':
        return `Dear ${name},\nThis is a formal reminder regarding the outstanding balance of ${amountStr} lent on ${dateStr}${note}.\nPlease arrange for repayment at your earliest convenience.\nBest regards.`;
      case 'friendly':
      default:
        return `Hey ${name}! Hope all is good with you. Whenever you get a chance, could you please transfer the ${amountStr}${note} from ${dateStr}? Appreciate it! 🙌`;
    }
  }, [selectedCredit, selectedTone, currencyCode, convertAmount]);

  const handleShare = async () => {
    if (!selectedCredit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await Share.share({
        message: generatedMessage,
      });
    } catch (err) {
      Alert.alert('Share Failed', 'Unable to share payment reminder text.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Reminder Generator</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Step 1: Select Person / Credit */}
        <Text style={styles.sectionTitle}>1. SELECT PERSON (CREDIT ITEM)</Text>
        {pendingCredits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color={colors.accent.green} />
            <Text style={styles.emptyTitle}>All Credits Settle Up!</Text>
            <Text style={styles.emptyDesc}>You have zero unreturned credits. Everyone has paid you back!</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.creditsListHorizontal}>
            {pendingCredits.map((item) => {
              const isSelected = selectedCredit?.id === item.id;
              const converted = convertAmount(item.amount, item.currency);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.creditChip, isSelected && styles.creditChipSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCredit(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.creditChipName, isSelected && styles.creditChipNameSelected]}>
                    {item.personName}
                  </Text>
                  <Text style={[styles.creditChipAmount, isSelected && styles.creditChipAmountSelected]}>
                    {formatCurrency(converted, currencyCode)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Step 2: Choose Tone */}
        <Text style={styles.sectionTitle}>2. CHOOSE MESSAGE TONE</Text>
        <View style={styles.toneGrid}>
          {TONES.map((tone) => {
            const isActive = selectedTone === tone.id;
            return (
              <TouchableOpacity
                key={tone.id}
                style={[styles.toneCard, isActive && styles.toneCardActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTone(tone.id);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tone.icon as any}
                  size={18}
                  color={isActive ? colors.accent.green : colors.text.secondary}
                />
                <Text style={[styles.toneLabel, isActive && styles.toneLabelActive]}>{tone.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Step 3: Message Preview Box */}
        <Text style={styles.sectionTitle}>3. GENERATED REMINDER TEXT</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color={colors.accent.green} />
            <Text style={styles.previewTitle}>Ready to Share</Text>
          </View>
          <Text style={styles.previewText}>{generatedMessage}</Text>
        </View>

        {/* Share Button */}
        <View style={{ marginTop: 24 }}>
          <GlassButton
            title="Share Reminder (WhatsApp / SMS)"
            onPress={handleShare}
            size="large"
            disabled={!selectedCredit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  headerTitle: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },

  sectionTitle: { color: colors.text.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  
  emptyCard: {
    backgroundColor: colors.glass.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    marginBottom: 20,
  },
  emptyTitle: { color: colors.text.primary, fontSize: 16, fontWeight: '700', marginTop: 8 },
  emptyDesc: { color: colors.text.secondary, fontSize: 12, textAlign: 'center', marginTop: 4 },

  creditsListHorizontal: { marginBottom: 20, flexDirection: 'row' },
  creditChip: {
    backgroundColor: colors.glass.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    marginRight: 10,
    minWidth: 120,
  },
  creditChipSelected: {
    backgroundColor: isDark ? 'rgba(102,187,106,0.15)' : 'rgba(102,187,106,0.1)',
    borderColor: colors.accent.green,
  },
  creditChipName: { color: colors.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  creditChipNameSelected: { color: colors.accent.green },
  creditChipAmount: { color: colors.text.muted, fontSize: 12, fontWeight: '600' },
  creditChipAmountSelected: { color: colors.accent.green },

  toneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  toneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.glass.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  toneCardActive: {
    backgroundColor: isDark ? 'rgba(102,187,106,0.15)' : 'rgba(102,187,106,0.08)',
    borderColor: colors.accent.green,
  },
  toneLabel: { color: colors.text.muted, fontSize: 13, fontWeight: '500' },
  toneLabelActive: { color: colors.accent.green, fontWeight: '700' },

  previewCard: {
    backgroundColor: colors.glass.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    gap: 12,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewTitle: { color: colors.accent.green, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  previewText: { color: colors.text.primary, fontSize: 14, lineHeight: 22, fontWeight: '400' },
});
