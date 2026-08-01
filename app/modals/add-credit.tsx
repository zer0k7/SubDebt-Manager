import { useTheme } from '../../hooks/useTheme';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppDatePicker } from '../../components/AppDatePicker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassInput } from '../../components/GlassInput';
import { GlassButton } from '../../components/GlassButton';
import { AmbientBackground } from '../../components/AmbientBackground';
import { CurrencyPicker } from '../../components/CurrencyPicker';
import { useCredits } from '../../hooks/useCredits';
import { useCurrency } from '../../hooks/useCurrency';
import { formatShortDate } from '../../utils/dateHelpers';
import { getCurrencyByCode } from '../../constants/currencies';

export default function AddCreditModal() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { addCredit } = useCredits();
  const { currencyCode: defaultCurrency } = useCurrency();
  const [personName, setPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [lentDate, setLentDate] = useState(new Date());
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date | null>(null);
  const [showLentPicker, setShowLentPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [hasReturnDate, setHasReturnDate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!personName.trim()) e.personName = 'Person name is required';
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = 'Valid amount is required';
    if (expectedReturnDate && expectedReturnDate < lentDate) e.expectedReturnDate = 'Return date must be after given date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCredit({
      personName: personName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      amount: Number(amount),
      currency,
      purpose: purpose.trim() || undefined,
      lentDate: lentDate.toISOString(),
      expectedReturnDate: expectedReturnDate?.toISOString(),
      notes: notes.trim() || undefined,
      isReturned: false,
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
        <Text style={styles.title}>Add Credit</Text>
        <View style={{ width: 36 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <GlassInput label="Person Name" placeholder="Who did you give money to?" value={personName} onChangeText={setPersonName} error={errors.personName} />
          <GlassInput label="Phone (Optional)" placeholder="Contact number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
          <GlassInput label="Amount (₹)" placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" error={errors.amount} />
          <GlassInput label="Purpose (Optional)" placeholder="Why did you give this money?" value={purpose} onChangeText={setPurpose} />
          <Text style={styles.sectionLabel}>Dates</Text>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowLentPicker(true)}>
            <Ionicons name="cash-outline" size={18} color={colors.accent.green} />
            <Text style={styles.dateLabel}>Date Given</Text>
            <Text style={styles.dateValue}>{formatShortDate(lentDate)}</Text>
          </TouchableOpacity>
          <View style={styles.dueToggle}>
            <Text style={styles.dateLabel}>Set Expected Return Date</Text>
            <TouchableOpacity onPress={() => { setHasReturnDate(!hasReturnDate); if (!hasReturnDate) setExpectedReturnDate(new Date(Date.now()+30*86400000)); else setExpectedReturnDate(null); }}>
              <Ionicons name={hasReturnDate ? 'checkbox' : 'square-outline'} size={24} color={hasReturnDate ? colors.accent.green : colors.text.muted} />
            </TouchableOpacity>
          </View>
          {hasReturnDate && (
            <TouchableOpacity style={[styles.dateRow, errors.expectedReturnDate && {borderColor: colors.accent.red}]} onPress={() => setShowReturnPicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.accent.green} />
              <Text style={styles.dateLabel}>Expected Return</Text>
              <Text style={styles.dateValue}>{expectedReturnDate ? formatShortDate(expectedReturnDate) : 'Select'}</Text>
            </TouchableOpacity>
          )}
          {errors.expectedReturnDate && <Text style={styles.err}>{errors.expectedReturnDate}</Text>}
          <GlassInput label="Notes (Optional)" placeholder="Additional details..." value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
          <View style={styles.btns}>
            <GlassButton title="Save Credit" onPress={handleSave} size="large" />
            <GlassButton title="Cancel" variant="ghost" onPress={() => router.back()} size="large" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppDatePicker visible={showLentPicker} date={lentDate} onConfirm={(d) => { setShowLentPicker(false); setLentDate(d); }} onCancel={() => setShowLentPicker(false)} />
      <AppDatePicker visible={showReturnPicker} date={expectedReturnDate || new Date()} minimumDate={lentDate} onConfirm={(d) => { setShowReturnPicker(false); setExpectedReturnDate(d); }} onCancel={() => setShowReturnPicker(false)} />
      <CurrencyPicker visible={showCurrencyPicker} selectedCode={currency} onSelect={setCurrency} onClose={() => setShowCurrencyPicker(false)} />
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
