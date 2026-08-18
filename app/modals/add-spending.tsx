import { useTheme } from '../../hooks/useTheme';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassInput } from '../../components/GlassInput';
import { GlassButton } from '../../components/GlassButton';
import { AmbientBackground } from '../../components/AmbientBackground';
import { CurrencyPicker } from '../../components/CurrencyPicker';
import { AppDatePicker } from '../../components/AppDatePicker';
import { useDailySpending } from '../../hooks/useDailySpending';
import { useCurrency } from '../../hooks/useCurrency';
import { formatShortDate } from '../../utils/dateHelpers';
import { SPENDING_CATEGORIES } from '../../constants/categories';
import { pickReceiptFromGallery, takeReceiptPhoto } from '../../utils/receiptHelper';
import { ReceiptVaultModal } from '../../components/ReceiptVaultModal';
import { Image } from 'react-native';

export default function AddSpendingModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { addEntry } = useDailySpending();
  const { currencyCode: defaultCurrency } = useCurrency();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [category, setCategory] = useState('Food');
  const [spentAt, setSpentAt] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showReceiptVault, setShowReceiptVault] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'What you spent on is required';
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = 'Valid amount is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePickGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const uri = await pickReceiptFromGallery();
    if (uri) setReceiptImage(uri);
  };

  const handleTakePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const uri = await takeReceiptPhoto();
    if (uri) setReceiptImage(uri);
  };

  const handleSave = () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addEntry({
      title: title.trim(),
      amount: Number(amount),
      currency,
      category,
      spentAt: spentAt.toISOString(),
      notes: notes.trim() || undefined,
      receiptImage: receiptImage || undefined,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Spending</Text>
        <View style={{ width: 36 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <GlassInput label="Spent On" placeholder="Tea, groceries, fuel..." value={title} onChangeText={setTitle} error={errors.title} />
          <GlassInput label="Amount" placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" error={errors.amount} />
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.chipRow}>
            {SPENDING_CATEGORIES.map((item) => {
              const isActive = category === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(item.name);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={14}
                    color={isActive ? colors.accent.blue : colors.text.muted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.sectionLabel}>Date</Text>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent.blue} />
            <Text style={styles.dateLabel}>Spent Date</Text>
            <Text style={styles.dateValue}>{formatShortDate(spentAt)}</Text>
          </TouchableOpacity>

          {/* Receipt Photo Vault Section */}
          <Text style={styles.sectionLabel}>Receipt Photo Vault</Text>
          {receiptImage ? (
            <View style={styles.receiptAttachedCard}>
              <TouchableOpacity
                style={styles.receiptThumbWrap}
                onPress={() => setShowReceiptVault(true)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: receiptImage }} style={styles.receiptThumb} />
                <View style={styles.viewBadge}>
                  <Ionicons name="scan-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.viewBadgeText}>VIEW</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.receiptActions}>
                <Text style={styles.receiptStatusText}>Receipt Attached 🧾</Text>
                <View style={styles.receiptActionBtns}>
                  <TouchableOpacity style={styles.receiptMiniBtn} onPress={handlePickGallery}>
                    <Ionicons name="images-outline" size={13} color={colors.accent.blue} />
                    <Text style={styles.receiptMiniBtnText}>Replace</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.receiptMiniBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
                    onPress={() => setReceiptImage(null)}
                  >
                    <Ionicons name="trash-outline" size={13} color={colors.accent.red} />
                    <Text style={[styles.receiptMiniBtnText, { color: colors.accent.red }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.receiptPickerBox}>
              <TouchableOpacity style={styles.receiptUploadBtn} onPress={handlePickGallery} activeOpacity={0.7}>
                <Ionicons name="images-outline" size={20} color={colors.accent.blue} />
                <Text style={styles.receiptUploadBtnText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.receiptUploadBtn} onPress={handleTakePhoto} activeOpacity={0.7}>
                <Ionicons name="camera-outline" size={20} color={colors.accent.purple} />
                <Text style={styles.receiptUploadBtnText}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}

          <GlassInput label="Notes (Optional)" placeholder="Additional details..." value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
          <View style={styles.btns}>
            <GlassButton title="Save Spending" onPress={handleSave} size="large" />
            <GlassButton title="Cancel" variant="ghost" onPress={() => router.back()} size="large" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppDatePicker
        visible={showDatePicker}
        date={spentAt}
        maximumDate={new Date()}
        onConfirm={(d) => {
          setShowDatePicker(false);
          setSpentAt(d);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
      <CurrencyPicker visible={showCurrencyPicker} selectedCode={currency} onSelect={setCurrency} onClose={() => setShowCurrencyPicker(false)} />

      <ReceiptVaultModal
        visible={showReceiptVault}
        onClose={() => setShowReceiptVault(false)}
        imageUri={receiptImage || undefined}
        title={title || 'Expense Receipt'}
        amount={Number(amount) || 0}
        currency={currency}
        category={category}
        date={spentAt.toISOString()}
        notes={notes}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.primary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.glass.card, justifyContent: 'center', alignItems: 'center' },
    title: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
    content: { padding: 16, paddingBottom: 40 },
    row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    amountCol: { flex: 1 },
    currBox: { width: 110, marginBottom: 14 },
    fieldLabel: { color: colors.text.secondary, fontSize: 13, marginBottom: 8, fontWeight: '500' },
    currPill: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder, borderRadius: 14, height: 48 },
    currText: { color: colors.text.primary, fontSize: 15 },
    sectionLabel: { color: colors.text.secondary, fontSize: 13, marginBottom: 10, marginTop: 16, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.buttonSecondary },
    chipActive: { backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.15) : 'rgba(79,195,247,0.15)', borderColor: colors.accent.blue },
    chipText: { color: colors.text.muted, fontSize: 13, fontWeight: '500' },
    chipTextActive: { color: colors.accent.blue, fontWeight: '700' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
    dateLabel: { color: colors.text.secondary, fontSize: 14, flex: 1 },
    dateValue: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },

    // Receipt Attachment Styles
    receiptPickerBox: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 10,
    },
    receiptUploadBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      borderStyle: 'dashed',
    },
    receiptUploadBtnText: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    receiptAttachedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 12,
      borderRadius: 16,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(2, 132, 199, 0.25)',
      marginBottom: 10,
    },
    receiptThumbWrap: {
      position: 'relative',
      width: 64,
      height: 64,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#000',
    },
    receiptThumb: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    viewBadge: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      paddingVertical: 2,
    },
    viewBadgeText: {
      color: '#FFFFFF',
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    receiptActions: {
      flex: 1,
      gap: 6,
    },
    receiptStatusText: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    receiptActionBtns: {
      flexDirection: 'row',
      gap: 8,
    },
    receiptMiniBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(2, 132, 199, 0.1)',
    },
    receiptMiniBtnText: {
      color: colors.accent.blue,
      fontSize: 11.5,
      fontWeight: '700',
    },

    btns: { gap: 10, marginTop: 24 },
  });
