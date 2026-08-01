import { useTheme } from '../../hooks/useTheme';
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppDatePicker } from '../../components/AppDatePicker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassInput } from '../../components/GlassInput';
import { GlassButton } from '../../components/GlassButton';
import { AmbientBackground } from '../../components/AmbientBackground';
import { CurrencyPicker } from '../../components/CurrencyPicker';
import { useDebts } from '../../hooks/useDebts';
import { useCurrency } from '../../hooks/useCurrency';
import { formatShortDate } from '../../utils/dateHelpers';
import { getCurrencyByCode } from '../../constants/currencies';

export default function AddDebtModal() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { addDebt } = useDebts();
  const [personName, setPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const { currencyCode: defaultCurrency } = useCurrency();
  const [currency, setCurrency] = useState(defaultCurrency);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [takenDate, setTakenDate] = useState(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showTakenPicker, setShowTakenPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [hasDueDate, setHasDueDate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!personName.trim()) e.personName = 'Person name is required';
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = 'Valid amount is required';
    if (dueDate && dueDate < takenDate) e.dueDate = 'Due date must be after recorded date';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addDebt({
      personName: personName.trim(), phoneNumber: phoneNumber.trim() || undefined,
      amount: Number(amount), currency, purpose: purpose.trim() || undefined,
      takenDate: takenDate.toISOString(), dueDate: dueDate?.toISOString(),
      notes: notes.trim() || undefined, isPaid: false,
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
        <Text style={styles.title}>Add Debt</Text>
        <View style={{ width: 36 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <GlassInput label="Person Name" placeholder="Who do you need to pay?" value={personName} onChangeText={setPersonName} error={errors.personName} />
          <GlassInput label="Phone (Optional)" placeholder="Contact number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
          <GlassInput label="Amount (₹)" placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" error={errors.amount} />
          <GlassInput label="Purpose (Optional)" placeholder="What is this payment for?" value={purpose} onChangeText={setPurpose} />
          <Text style={styles.sectionLabel}>Dates</Text>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowTakenPicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent.amber} />
            <Text style={styles.dateLabel}>Date Recorded</Text>
            <Text style={styles.dateValue}>{formatShortDate(takenDate)}</Text>
          </TouchableOpacity>
          <View style={styles.dueToggle}>
            <Text style={styles.dateLabel}>Set Due Date</Text>
            <TouchableOpacity onPress={() => { setHasDueDate(!hasDueDate); if (!hasDueDate) setDueDate(new Date(Date.now()+30*86400000)); else setDueDate(null); }}>
              <Ionicons name={hasDueDate ? "checkbox" : "square-outline"} size={24} color={hasDueDate ? colors.accent.amber : colors.text.muted} />
            </TouchableOpacity>
          </View>
          {hasDueDate && (
            <TouchableOpacity style={[styles.dateRow, errors.dueDate && {borderColor: colors.accent.red}]} onPress={() => setShowDuePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.accent.amber} />
              <Text style={styles.dateLabel}>Due Date</Text>
              <Text style={styles.dateValue}>{dueDate ? formatShortDate(dueDate) : 'Select'}</Text>
            </TouchableOpacity>
          )}
          {errors.dueDate && <Text style={styles.err}>{errors.dueDate}</Text>}
          <GlassInput label="Notes (Optional)" placeholder="Additional details..." value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
          <View style={styles.btns}>
            <GlassButton title="Save Debt" onPress={handleSave} size="large" />
            <GlassButton title="Cancel" variant="ghost" onPress={() => router.back()} size="large" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppDatePicker visible={showTakenPicker} date={takenDate} onConfirm={(d) => { setShowTakenPicker(false); setTakenDate(d); }} onCancel={() => setShowTakenPicker(false)} />
      <AppDatePicker visible={showDuePicker} date={dueDate || new Date()} minimumDate={takenDate} onConfirm={(d) => { setShowDuePicker(false); setDueDate(d); }} onCancel={() => setShowDuePicker(false)} />
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
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
  dueToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
  dateLabel: { color: colors.text.secondary, fontSize: 14, flex: 1 },
  dateValue: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },
  err: { color: colors.accent.red, fontSize: 12, marginTop: -4, marginBottom: 8 },
  btns: { gap: 10, marginTop: 24 },
});
