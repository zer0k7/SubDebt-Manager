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
import { AmbientBackground } from '../../components/AmbientBackground';
import { CurrencyPicker } from '../../components/CurrencyPicker';
import { useDebts } from '../../hooks/useDebts';
import { formatShortDate } from '../../utils/dateHelpers';
import { getCurrencyByCode } from '../../constants/currencies';

export default function EditDebtModal() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateDebt, deleteDebt, getDebtById, addPayment, deletePayment, getRemainingAmount } = useDebts();
  const debt = getDebtById(id);
  
  const remaining = debt ? getRemainingAmount(debt) : 0;
  
  const [personName, setPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [takenDate, setTakenDate] = useState(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showTakenPicker, setShowTakenPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [hasDueDate, setHasDueDate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [popupConfig, setPopupConfig] = useState<any>(null);
  const showPopup = (config: any) => setPopupConfig(config);
  const closePopup = () => setPopupConfig(null);

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentNotes, setInstallmentNotes] = useState('');

  const handleAddInstallment = () => {
    if (!installmentAmount.trim() || isNaN(Number(installmentAmount)) || Number(installmentAmount) <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const amt = Number(installmentAmount);
    if (amt > remaining) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showPopup({
        title: 'Overpayment',
        message: 'Installment amount cannot exceed the remaining balance.',
        icon: 'alert-circle-outline',
        iconColor: colors.accent.amber,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
      return;
    }
    
    addPayment(id, amt, installmentNotes.trim() || undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInstallmentAmount('');
    setInstallmentNotes('');
  };

  const handleDeletePayment = (paymentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    showPopup({
      title: 'Delete Installment',
      message: 'Are you sure you want to delete this installment payment record?',
      icon: 'trash-outline',
      iconColor: colors.accent.red,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onCancel: closePopup,
      onConfirm: () => {
        closePopup();
        deletePayment(id, paymentId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
    });
  };

  useEffect(() => {
    if (debt) {
      setPersonName(debt.personName); setPhoneNumber(debt.phoneNumber || '');
      setAmount(debt.amount.toString()); setCurrency(debt.currency);
      setPurpose(debt.purpose || ''); setNotes(debt.notes || '');
      setIsPaid(debt.isPaid); setTakenDate(new Date(debt.takenDate));
      if (debt.dueDate) { setDueDate(new Date(debt.dueDate)); setHasDueDate(true); }
    }
  }, [debt]);

  if (!debt) {
    return (
      <SafeAreaView style={styles.container}>
        <AmbientBackground />
        <View style={styles.center}>
          <Text style={styles.notFound}>Debt not found</Text>
          <GlassButton title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

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
    updateDebt(id, {
      personName: personName.trim(), phoneNumber: phoneNumber.trim() || undefined,
      amount: Number(amount), currency, purpose: purpose.trim() || undefined,
      takenDate: takenDate.toISOString(), dueDate: dueDate?.toISOString(),
      notes: notes.trim() || undefined, isPaid,
    });
    router.back();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    showPopup({
      title: 'Delete Debt Record',
      message: `Are you sure you want to delete this debt for ${debt.personName}?`,
      icon: 'trash-outline',
      iconColor: colors.accent.red,
      cancelText: 'Cancel',
      confirmText: 'Delete',
      isDestructive: true,
      onCancel: closePopup,
      onConfirm: () => {
        closePopup();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        deleteDebt(id);
        router.back();
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Debt</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={22} color={colors.accent.red} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.statusRow}>
            <Text style={styles.fieldLabel}>Payment Status</Text>
            <TouchableOpacity style={[styles.statusPill, isPaid && styles.statusActive]} onPress={() => setIsPaid(!isPaid)}>
              <Text style={[styles.statusText, isPaid && styles.statusTextActive]}>{isPaid ? 'Paid' : 'Pending'}</Text>
            </TouchableOpacity>
          </View>
          <GlassInput label="Person Name" placeholder="Who do you need to pay?" value={personName} onChangeText={setPersonName} error={errors.personName} />
          <GlassInput label="Phone (Optional)" placeholder="Contact number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
          <GlassInput label="Amount (₹)" placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" error={errors.amount} />
          <GlassInput label="Purpose (Optional)" placeholder="What is this for?" value={purpose} onChangeText={setPurpose} />
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
          
          {/* Installments Logger */}
          {!isPaid && (
            <>
              <Text style={styles.sectionLabel}>Log Installment</Text>
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <GlassInput 
                      placeholder="0.00" 
                      value={installmentAmount} 
                      onChangeText={setInstallmentAmount} 
                      keyboardType="decimal-pad"
                      label={`Amount (Remaining: ${getCurrencyByCode(currency).symbol}${remaining})`}
                    />
                  </View>
                </View>
                <GlassInput 
                  placeholder="E.g., Cash, Bank Transfer, Note..." 
                  value={installmentNotes} 
                  onChangeText={setInstallmentNotes}
                  label="Payment Note (Optional)"
                />
                <TouchableOpacity 
                  style={styles.addPaymentBtn}
                  onPress={handleAddInstallment}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.addPaymentBtnText}>Log Payment</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Payment Timeline / Installments History */}
          {debt.payments && debt.payments.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Installments History</Text>
              <View style={styles.card}>
                {debt.payments.map((p, index) => (
                  <View key={p.id} style={[styles.paymentRow, index > 0 && styles.paymentRowBorder]}>
                    <View style={styles.paymentIconContainer}>
                      <View style={styles.paymentIcon}>
                        <Ionicons name="cash" size={16} color={colors.accent.blue} />
                      </View>
                      {index < debt.payments!.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.paymentDetails}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.paymentAmountText}>
                          {getCurrencyByCode(currency).symbol}{p.amount}
                        </Text>
                        <TouchableOpacity 
                          onPress={() => handleDeletePayment(p.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.accent.red} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.paymentDateText}>
                        {new Date(p.paidDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      {p.notes && <Text style={styles.paymentNotesText}>{p.notes}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.btns}>
            <GlassButton title="Save Changes" onPress={handleSave} size="large" />
            <GlassButton title="Cancel" variant="ghost" onPress={() => router.back()} size="large" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppDatePicker visible={showTakenPicker} date={takenDate} onConfirm={(d) => { setShowTakenPicker(false); setTakenDate(d); }} onCancel={() => setShowTakenPicker(false)} />
      <AppDatePicker visible={showDuePicker} date={dueDate || new Date()} minimumDate={takenDate} onConfirm={(d) => { setShowDuePicker(false); setDueDate(d); }} onCancel={() => setShowDuePicker(false)} />

      <AppPopup 
        visible={!!popupConfig}
        title={popupConfig?.title || ''}
        message={popupConfig?.message || ''}
        icon={popupConfig?.icon || 'information-circle-outline'}
        iconColor={popupConfig?.iconColor}
        cancelText={popupConfig?.cancelText}
        confirmText={popupConfig?.confirmText || 'OK'}
        isDestructive={popupConfig?.isDestructive || false}
        onCancel={popupConfig?.onCancel || closePopup}
        onConfirm={popupConfig?.onConfirm || closePopup}
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
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  fieldLabel: { color: colors.text.secondary, fontSize: 13, marginBottom: 8, fontWeight: '500' },
  statusPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder },
  statusActive: { backgroundColor: 'rgba(102,187,106,0.15)', borderColor: 'rgba(102,187,106,0.4)' },
  statusText: { color: colors.text.muted, fontSize: 13, fontWeight: '500' },
  statusTextActive: { color: '#66BB6A', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  amountCol: { flex: 1 },
  currBox: { width: 110, marginBottom: 14 },
  currPill: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder, borderRadius: 14, height: 48 },
  currText: { color: colors.text.primary, fontSize: 15 },
  sectionLabel: { color: colors.text.secondary, fontSize: 13, marginBottom: 10, marginTop: 16, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
  dueToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
  dateLabel: { color: colors.text.secondary, fontSize: 14, flex: 1 },
  dateValue: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },
  err: { color: colors.accent.red, fontSize: 12, marginTop: -4, marginBottom: 8 },
  btns: { gap: 10, marginTop: 24 },

  // Installment Styles
  card: {
    backgroundColor: colors.glass.card,
    borderColor: colors.glass.cardBorder,
    borderWidth: 0.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  addPaymentBtn: {
    flexDirection: 'row',
    height: 44,
    backgroundColor: colors.accent.blue,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  addPaymentBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  paymentRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  paymentRowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: colors.glass.cardBorder,
  },
  paymentIconContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  paymentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.1) : 'rgba(79, 195, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: colors.glass.cardBorder,
    marginTop: 6,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentAmountText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  paymentDateText: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  paymentNotesText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
