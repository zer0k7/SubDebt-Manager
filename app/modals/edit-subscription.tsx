import { useTheme } from '../../hooks/useTheme';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppDatePicker } from '../../components/AppDatePicker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassInput } from '../../components/GlassInput';
import { GlassButton } from '../../components/GlassButton';
import { AppPopup } from '../../components/AppPopup';
import { SubscriptionIcon } from '../../components/SubscriptionIcon';
import { AmbientBackground } from '../../components/AmbientBackground';
import { CurrencyPicker } from '../../components/CurrencyPicker';
import { useSubscriptions, BillingCycle } from '../../hooks/useSubscriptions';
import { getCurrencyByCode } from '../../constants/currencies';
import { formatShortDate } from '../../utils/dateHelpers';
import { spacing } from '../../constants/typography';

const billingCycles: { key: BillingCycle; label: string }[] = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'custom', label: 'Custom' },
];
const categories = ['Entertainment','Productivity','Utilities','Gaming','Health & Fitness','News & Reading','AI','Dev Tools','Recharges','Other'];

export default function EditSubscriptionModal() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateSubscription, deleteSubscription, getSubscriptionById } = useSubscriptions();
  const subscription = getSubscriptionById(id);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [popupVisible, setPopupVisible] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    if (subscription) {
      setName(subscription.name); setDescription(subscription.description || '');
      setAmount(subscription.amount.toString()); setCurrency(subscription.currency);
      setBillingCycle(subscription.billingCycle); setCategory(subscription.category || '');
      setIsActive(subscription.isActive);
      setStartDate(new Date(subscription.startDate)); setExpiryDate(new Date(subscription.expiryDate));
    }
  }, [subscription]);

  if (!subscription) {
    return (
      <SafeAreaView style={styles.container}>
        <AmbientBackground />
        <View style={styles.center}>
          <Text style={styles.notFound}>Subscription not found</Text>
          <GlassButton title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!amount.trim() || isNaN(Number(amount))) e.amount = 'Valid amount is required';
    if (expiryDate <= startDate) e.expiryDate = 'Expiry must be after start date';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateSubscription(id, {
      name: name.trim(), description: description.trim() || undefined,
      amount: Number(amount), currency, billingCycle,
      startDate: startDate.toISOString(), expiryDate: expiryDate.toISOString(),
      category: category || undefined, isActive,
    });
    router.back();
  };

  const handleDelete = () => {
    setPopupVisible(true);
  };

  const confirmDelete = () => {
    setPopupVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    deleteSubscription(id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Subscription</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={22} color={colors.accent.red} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.iconPreview}>
            <SubscriptionIcon name={name || 'Subscription'} size={56} />
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.fieldLabel}>Status</Text>
            <TouchableOpacity style={[styles.statusPill, isActive && styles.statusActive]} onPress={() => setIsActive(!isActive)}>
              <Text style={[styles.statusText, isActive && styles.statusTextActive]}>{isActive ? 'Active' : 'Inactive'}</Text>
            </TouchableOpacity>
          </View>
          <GlassInput label="Name" placeholder="e.g., Netflix, Spotify" value={name} onChangeText={setName} error={errors.name} />
          <GlassInput label="Description (Optional)" placeholder="Notes" value={description} onChangeText={setDescription} multiline numberOfLines={2} />
          <GlassInput label="Amount (₹)" placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" error={errors.amount} />
          <Text style={styles.sectionLabel}>Billing Cycle</Text>
          <View style={styles.chipRow}>
            {billingCycles.map((c) => (
              <TouchableOpacity key={c.key} style={[styles.chip, billingCycle === c.key && styles.chipActive]} onPress={() => setBillingCycle(c.key)}>
                <Text style={[styles.chipText, billingCycle === c.key && styles.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.chipRow}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat} style={[styles.chip, styles.chipSmall, category === cat && styles.chipCatActive]} onPress={() => setCategory(category === cat ? '' : cat)}>
                <Text style={[styles.chipText, styles.chipTextSmall, category === cat && styles.chipTextCatActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.sectionLabel}>Dates</Text>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowStartPicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent.blue} />
            <Text style={styles.dateLabel}>Start Date</Text>
            <Text style={styles.dateValue}>{formatShortDate(startDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dateRow, errors.expiryDate && { borderColor: colors.accent.red }]} onPress={() => setShowExpiryPicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent.blue} />
            <Text style={styles.dateLabel}>Expiry Date</Text>
            <Text style={styles.dateValue}>{formatShortDate(expiryDate)}</Text>
          </TouchableOpacity>
          {errors.expiryDate && <Text style={styles.errorText}>{errors.expiryDate}</Text>}
          <View style={styles.btns}>
            <GlassButton title="Save Changes" onPress={handleSave} size="large" />
            <GlassButton title="Cancel" variant="ghost" onPress={() => router.back()} size="large" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppDatePicker visible={showStartPicker} date={startDate} onConfirm={(d) => { setShowStartPicker(false); setStartDate(d); }} onCancel={() => setShowStartPicker(false)} />
      <AppDatePicker visible={showExpiryPicker} date={expiryDate} minimumDate={startDate} onConfirm={(d) => { setShowExpiryPicker(false); setExpiryDate(d); }} onCancel={() => setShowExpiryPicker(false)} />
      
      <AppPopup 
        visible={popupVisible}
        title="Delete Subscription"
        message={`Are you sure you want to delete "${subscription.name}"?`}
        icon="trash-outline"
        iconColor={colors.accent.red}
        cancelText="Cancel"
        confirmText="Delete"
        isDestructive={true}
        onCancel={() => setPopupVisible(false)}
        onConfirm={confirmDelete}
      />
      <CurrencyPicker
        visible={showCurrencyPicker}
        selectedCode={currency}
        onSelect={setCurrency}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  notFound: { color: colors.text.secondary, fontSize: 18, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.glass.card, justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239,83,80,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  iconPreview: { alignItems: 'center', marginBottom: 16, paddingVertical: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  statusPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder },
  statusActive: { backgroundColor: 'rgba(102,187,106,0.15)', borderColor: 'rgba(102,187,106,0.4)' },
  statusText: { color: colors.text.muted, fontSize: 13, fontWeight: '500' },
  statusTextActive: { color: '#66BB6A', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  amountCol: { flex: 1 },
  currBox: { width: 110, marginBottom: 14 },
  fieldLabel: { color: colors.text.secondary, fontSize: 13, marginBottom: 8, fontWeight: '500' },
  currPill: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder, borderRadius: 14, height: 48 },
  currText: { color: colors.text.primary, fontSize: 15 },
  sectionLabel: { color: colors.text.secondary, fontSize: 13, marginBottom: 10, marginTop: 16, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.buttonSecondary },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.15) : 'rgba(79,195,247,0.15)', borderColor: colors.accent.alpha ? colors.accent.alpha(0.4) : 'rgba(79,195,247,0.4)' },
  chipCatActive: { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: 'rgba(124,58,237,0.4)' },
  chipText: { color: colors.text.muted, fontSize: 13, fontWeight: '500' },
  chipTextSmall: { fontSize: 12 },
  chipTextActive: { color: colors.accent.blue, fontWeight: '600' },
  chipTextCatActive: { color: colors.accent.purple, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
  dateLabel: { color: colors.text.secondary, fontSize: 14, flex: 1 },
  dateValue: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },
  errorText: { color: colors.accent.red, fontSize: 12, marginTop: -4, marginBottom: 8 },
  btns: { gap: 10, marginTop: 24 },
});
