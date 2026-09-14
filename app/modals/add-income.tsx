import { useTheme } from '../../hooks/useTheme';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassInput } from '../../components/GlassInput';
import { GlassButton } from '../../components/GlassButton';
import { AmbientBackground } from '../../components/AmbientBackground';
import { CurrencyPicker } from '../../components/CurrencyPicker';
import { AppDatePicker } from '../../components/AppDatePicker';
import { useIncome, INCOME_CATEGORIES, IncomeCategory } from '../../hooks/useIncome';
import { useCurrency } from '../../hooks/useCurrency';
import { formatShortDate } from '../../utils/dateHelpers';

export default function AddIncomeModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { addIncome } = useIncome();
  const { currencyCode: defaultCurrency } = useCurrency();

  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [category, setCategory] = useState<IncomeCategory>('Salary');
  const [receivedAt, setReceivedAt] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!source.trim()) e.source = 'Income source or title is required';
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      e.amount = 'Valid positive amount is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    await addIncome({
      source: source.trim(),
      amount: parseFloat(amount),
      currency,
      category,
      receivedAt: receivedAt.toISOString(),
      notes: notes.trim() || undefined,
      isRecurring,
      recurrence: isRecurring ? 'monthly' : undefined,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Income</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <GlassInput
            label="Income Source"
            placeholder="e.g. Monthly Salary, Freelance Client, Dividend"
            value={source}
            onChangeText={setSource}
            error={errors.source}
          />

          <View style={styles.row}>
            <View style={styles.amountCol}>
              <GlassInput
                label="Amount"
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                error={errors.amount}
              />
            </View>
            <View style={styles.currBox}>
              <Text style={styles.fieldLabel}>Currency</Text>
              <TouchableOpacity
                style={styles.currPill}
                onPress={() => setShowCurrencyPicker(true)}
              >
                <Text style={styles.currText}>{currency}</Text>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={colors.text.secondary}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Income Category</Text>
          <View style={styles.chipRow}>
            {INCOME_CATEGORIES.map((item) => {
              const isActive = category === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.chip,
                    isActive && [
                      styles.chipActive,
                      { borderColor: item.color, backgroundColor: `${item.color}22` },
                    ],
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(item.name);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={15}
                    color={isActive ? item.color : colors.text.muted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      isActive && { color: item.color, fontWeight: '700' },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Date Received</Text>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent.blue} />
            <Text style={styles.dateLabel}>Received Date</Text>
            <Text style={styles.dateValue}>{formatShortDate(receivedAt)}</Text>
          </TouchableOpacity>

          {/* Recurring Toggle */}
          <View style={styles.switchCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Recurring Monthly Income</Text>
              <Text style={styles.switchSub}>e.g. Regular monthly salary or fixed rent</Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsRecurring(val);
              }}
              trackColor={{ false: colors.glass.cardBorder, true: colors.accent.blue }}
              thumbColor="#FFFFFF"
            />
          </View>

          <GlassInput
            label="Notes (Optional)"
            placeholder="Bonus details, transaction reference, tax..."
            value={notes}
            onChangeText={setNotes}
          />

          <View style={styles.btns}>
            <GlassButton
              title="Save Income Entry"
              onPress={handleSave}
              variant="primary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CurrencyPicker
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        selectedCode={currency}
        onSelect={setCurrency}
      />

      <AppDatePicker
        visible={showDatePicker}
        onCancel={() => setShowDatePicker(false)}
        date={receivedAt}
        onConfirm={(d) => {
          setReceivedAt(d);
          setShowDatePicker(false);
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.primary },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.glass.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
    content: { padding: 16, paddingBottom: 40 },
    row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    amountCol: { flex: 1 },
    currBox: { width: 110, marginBottom: 14 },
    fieldLabel: { color: colors.text.secondary, fontSize: 13, marginBottom: 8, fontWeight: '500' },
    currPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      borderRadius: 14,
      height: 48,
    },
    currText: { color: colors.text.primary, fontSize: 15, fontWeight: '600' },
    sectionLabel: {
      color: colors.text.secondary,
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 14,
      marginBottom: 10,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.buttonSecondary,
    },
    chipActive: {
      backgroundColor: colors.accent.alpha(0.15),
      borderColor: colors.accent.blue,
    },
    chipText: { color: colors.text.muted, fontSize: 13, fontWeight: '500' },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 12,
    },
    dateLabel: { color: colors.text.secondary, fontSize: 14, flex: 1 },
    dateValue: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },
    switchCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      borderRadius: 14,
      padding: 14,
      marginBottom: 14,
    },
    switchTitle: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },
    switchSub: { color: colors.text.muted, fontSize: 11.5, marginTop: 2 },
    btns: { marginTop: 24 },
  });
