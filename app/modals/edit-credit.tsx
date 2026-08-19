import { useTheme } from '../../hooks/useTheme';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
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
import { useCredits } from '../../hooks/useCredits';
import { formatShortDate } from '../../utils/dateHelpers';
import { getCurrencyByCode } from '../../constants/currencies';

export default function EditCreditModal() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateCredit, deleteCredit, getCreditById, addPayment, deletePayment, getRemainingAmount } = useCredits();
  const credit = getCreditById(id);

  const remaining = credit ? getRemainingAmount(credit) : 0;

  const [personName, setPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [isReturned, setIsReturned] = useState(false);
  const [lentDate, setLentDate] = useState(new Date());
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date | null>(null);
  const [showLentPicker, setShowLentPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [hasReturnDate, setHasReturnDate] = useState(false);
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
    if (credit) {
      setPersonName(credit.personName);
      setPhoneNumber(credit.phoneNumber || '');
      setAmount(credit.amount.toString());
      setCurrency(credit.currency);
      setPurpose(credit.purpose || '');
      setNotes(credit.notes || '');
      setIsReturned(credit.isReturned);
      setLentDate(new Date(credit.lentDate));
      if (credit.expectedReturnDate) {
        setExpectedReturnDate(new Date(credit.expectedReturnDate));
        setHasReturnDate(true);
      }
    }
  }, [credit]);

  if (!credit) {
    return (
      <SafeAreaView style={styles.container}>
        <AmbientBackground />
        <View style={styles.center}>
          <Text style={styles.notFound}>Lent money record not found</Text>
          <GlassButton title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

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
    updateCredit(id, {
      personName: personName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      amount: Number(amount),
      currency,
      purpose: purpose.trim() || undefined,
      lentDate: lentDate.toISOString(),
      expectedReturnDate: expectedReturnDate?.toISOString(),
      notes: notes.trim() || undefined,
      isReturned,
    });
    router.back();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    showPopup({
      title: 'Delete Lent Money Record',
      message: `Are you sure you want to delete this record for ${credit.personName}?`,
      icon: 'trash-outline',
      iconColor: colors.accent.red,
      cancelText: 'Cancel',
      confirmText: 'Delete',
      isDestructive: true,
      onCancel: closePopup,
      onConfirm: () => {
        closePopup();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        deleteCredit(id);
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
        <Text style={styles.title}>Edit Lent Money</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={22} color={colors.accent.red} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.statusRow}>
            <Text style={styles.fieldLabel}>Return Status</Text>
            <TouchableOpacity style={[styles.statusPill, isReturned && styles.statusActive]} onPress={() => setIsReturned(!isReturned)}>
              <Text style={[styles.statusText, isReturned && styles.statusTextActive]}>{isReturned ? 'Returned' : 'Pending'}</Text>
            </TouchableOpacity>
          </View>
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

          {/* Installments Logger */}
          {!isReturned && (
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
          {credit.payments && credit.payments.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Installments History</Text>
              <View style={styles.card}>
                {credit.payments.map((p, index) => (
                  <View key={p.id} style={[styles.paymentRow, index > 0 && styles.paymentRowBorder]}>
                    <View style={styles.paymentIconContainer}>
                      <View style={styles.paymentIcon}>
                        <Ionicons name="cash" size={16} color={colors.accent.green} />
                      </View>
                      {index < credit.payments!.length - 1 && <View style={styles.timelineLine} />}
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
                        {new Date(p.returnedDate).toLocaleDateString(undefined, {
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
      <AppDatePicker visible={showLentPicker} date={lentDate} onConfirm={(d) => { setShowLentPicker(false); setLentDate(d); }} onCancel={() => setShowLentPicker(false)} />
      <AppDatePicker visible={showReturnPicker} date={expectedReturnDate || new Date()} minimumDate={lentDate} onConfirm={(d) => { setShowReturnPicker(false); setExpectedReturnDate(d); }} onCancel={() => setShowReturnPicker(false)} />
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
      <CurrencyPicker visible={showCurrencyPicker} selectedCode={currency} onSelect={setCurrency} onClose={() => setShowCurrencyPicker(false)} />
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
  statusTextActive: { color: colors.accent.green, fontWeight: '600' },
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
    backgroundColor: colors.accent.green,
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
    backgroundColor: 'rgba(102, 187, 106, 0.1)',
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
