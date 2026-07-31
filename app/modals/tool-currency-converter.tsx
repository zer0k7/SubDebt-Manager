import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { AmbientBackground } from '../../components/AmbientBackground';
import { CURRENCIES, getCurrencyByCode, Currency } from '../../constants/currencies';
import { useCurrency } from '../../hooks/useCurrency';
import { formatCurrency } from '../../utils/dateHelpers';

export default function ToolCurrencyConverterModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const { currencyCode, convertAmount } = useCurrency();

  const [fromCode, setFromCode] = useState<string>('USD');
  const [toCode, setToCode] = useState<string>(currencyCode || 'INR');
  const [amountStr, setAmountStr] = useState<string>('100');

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const fromCurr = useMemo(() => getCurrencyByCode(fromCode), [fromCode]);
  const toCurr = useMemo(() => getCurrencyByCode(toCode), [toCode]);

  const convertedResult = useMemo(() => {
    const numeric = parseFloat(amountStr);
    if (isNaN(numeric) || numeric <= 0) return 0;

    // Convert from `fromCode` to base USD/INR via convertAmount hook logic
    // Step 1: Convert `numeric` in `fromCode` to `toCode`
    // Since convertAmount converts any currency to base user currencyCode,
    // we can calculate: (amt in user currency) / (1 unit of toCurr in user currency)
    const amtInBase = convertAmount(numeric, fromCode);
    const toUnitInBase = convertAmount(1, toCode);

    if (toUnitInBase === 0) return amtInBase;
    return amtInBase / toUnitInBase;
  }, [amountStr, fromCode, toCode, convertAmount]);

  const handleSwap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Currency Converter</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Converter Card */}
        <View style={styles.converterCard}>
          {/* FROM input */}
          <Text style={styles.inputLabel}>AMOUNT TO CONVERT</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.amountInput}
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.text.muted}
            />
            <TouchableOpacity
              style={styles.currencySelectBtn}
              onPress={() => {
                setShowToPicker(false);
                setShowFromPicker((prev) => !prev);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.flagText}>{fromCurr.flag}</Text>
              <Text style={styles.currencyCodeText}>{fromCurr.code}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Swap Divider Button */}
          <View style={styles.swapContainer}>
            <View style={styles.swapLine} />
            <TouchableOpacity style={styles.swapBtn} onPress={handleSwap} activeOpacity={0.8}>
              <Ionicons name="swap-vertical" size={20} color={colors.accent.blue} />
            </TouchableOpacity>
            <View style={styles.swapLine} />
          </View>

          {/* TO output */}
          <Text style={styles.inputLabel}>CONVERTED AMOUNT</Text>
          <View style={styles.inputRow}>
            <Text style={styles.resultText}>
              {formatCurrency(convertedResult, toCurr.code)}
            </Text>
            <TouchableOpacity
              style={styles.currencySelectBtn}
              onPress={() => {
                setShowFromPicker(false);
                setShowToPicker((prev) => !prev);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.flagText}>{toCurr.flag}</Text>
              <Text style={styles.currencyCodeText}>{toCurr.code}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Currency Selector Modal/Sheet view if open */}
        {(showFromPicker || showToPicker) && (
          <View style={styles.pickerSheet}>
            <Text style={styles.sectionTitle}>
              SELECT {showFromPicker ? 'FROM' : 'TO'} CURRENCY
            </Text>
            <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
              <View style={styles.pickerGrid}>
                {CURRENCIES.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    style={styles.pickerItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (showFromPicker) {
                        setFromCode(c.code);
                        setShowFromPicker(false);
                      } else {
                        setToCode(c.code);
                        setShowToPicker(false);
                      }
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{c.flag}</Text>
                    <Text style={styles.pickerItemCode}>{c.code}</Text>
                    <Text style={styles.pickerItemName} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent.blue} style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            Calculated offline using stored exchange rates. Works anywhere without network access!
          </Text>
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

  converterCard: {
    backgroundColor: colors.glass.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    marginBottom: 20,
  },
  inputLabel: { color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  amountInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '800',
    padding: 0,
  },
  resultText: {
    flex: 1,
    color: colors.accent.blue,
    fontSize: 24,
    fontWeight: '800',
  },
  currencySelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.glass.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  flagText: { fontSize: 16 },
  currencyCodeText: { color: colors.text.primary, fontSize: 14, fontWeight: '700' },

  swapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  swapLine: { flex: 1, height: 1, backgroundColor: colors.glass.cardBorder },
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    marginHorizontal: 12,
  },

  pickerSheet: {
    backgroundColor: colors.glass.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    marginBottom: 20,
  },
  sectionTitle: { color: colors.text.secondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  pickerGrid: { gap: 8 },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
  },
  pickerItemCode: { color: colors.text.primary, fontSize: 14, fontWeight: '700', width: 45 },
  pickerItemName: { color: colors.text.secondary, fontSize: 12, flex: 1 },

  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.glass.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
  },
  infoText: { color: colors.text.secondary, fontSize: 12, lineHeight: 18, flex: 1 },
});
