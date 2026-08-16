import { useTheme } from '../../hooks/useTheme';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Switch,
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
import { BrandIconPickerModal } from '../../components/BrandIconPickerModal';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { useSubscriptions, BillingCycle } from '../../hooks/useSubscriptions';
import { formatShortDate } from '../../utils/dateHelpers';
import { IconKey } from '../../utils/subscriptionIcons';

const billingCycles: { key: BillingCycle; label: string }[] = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'custom', label: 'Custom' },
];

const categories = [
  'Entertainment', 'AI', 'Productivity', 'Dev Tools', 'Utilities',
  'Gaming', 'Health & Fitness', 'News & Reading', 'Recharges', 'Other',
];

const paymentMethods = ['UPI', 'Card', 'Net Banking', 'Auto-Debit', 'PayPal', 'Cash'];

const reminderOptions = [
  { label: 'Same Day', days: 0 },
  { label: '1 Day Before', days: 1 },
  { label: '3 Days Before', days: 3 },
  { label: '7 Days Before', days: 7 },
];

export default function EditSubscriptionModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoaded, updateSubscription, deleteSubscription, duplicateSubscription, getSubscriptionById } = useSubscriptions();
  const subscription = getSubscriptionById(id);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [iconKey, setIconKey] = useState<IconKey | undefined>(undefined);
  const [customColor, setCustomColor] = useState<string | undefined>(undefined);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Dates
  const [startDate, setStartDate] = useState(new Date());
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);

  // Free trial
  const [isTrial, setIsTrial] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState(new Date());
  const [showTrialEndPicker, setShowTrialEndPicker] = useState(false);

  // Shared plan
  const [isShared, setIsShared] = useState(false);
  const [sharedWithCount, setSharedWithCount] = useState('2');
  const [myShareAmount, setMyShareAmount] = useState('');

  // Payment method & Reminders
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [reminderDays, setReminderDays] = useState<number[]>([1]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deletePopupVisible, setDeletePopupVisible] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setDescription(subscription.description || '');
      setAmount(subscription.amount.toString());
      setCurrency(subscription.currency);
      setBillingCycle(subscription.billingCycle);
      setCategory(subscription.category || '');
      setIsActive(subscription.isActive);
      setIconKey(subscription.iconKey as IconKey | undefined);
      setCustomColor(subscription.color);
      setStartDate(new Date(subscription.startDate));
      setExpiryDate(new Date(subscription.expiryDate));
      setIsTrial(!!subscription.isTrial);
      if (subscription.trialEndDate) {
        setTrialEndDate(new Date(subscription.trialEndDate));
      }
      setIsShared(!!subscription.isShared);
      if (subscription.sharedWithCount) setSharedWithCount(String(subscription.sharedWithCount));
      if (subscription.myShareAmount) setMyShareAmount(String(subscription.myShareAmount));
      if (subscription.paymentMethod) setPaymentMethod(subscription.paymentMethod);
      if (subscription.reminderDaysBefore) setReminderDays(subscription.reminderDaysBefore);
    }
  }, [subscription]);

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <AmbientBackground />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Subscription</Text>
          <View style={{ width: 38 }} />
        </View>
        <SkeletonLoader variant="debts" />
      </SafeAreaView>
    );
  }

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

  const handleCycleChange = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    const next = new Date(startDate.getTime());
    if (cycle === 'weekly') next.setDate(next.getDate() + 7);
    else if (cycle === 'monthly') next.setMonth(next.getMonth() + 1);
    else if (cycle === 'yearly') next.setFullYear(next.getFullYear() + 1);
    else next.setDate(next.getDate() + 30);
    setExpiryDate(next);
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (isShared && val && !isNaN(Number(val))) {
      const count = Math.max(1, parseInt(sharedWithCount, 10) || 2);
      setMyShareAmount((Number(val) / count).toFixed(0));
    }
  };

  const handleSharedCountChange = (countStr: string) => {
    setSharedWithCount(countStr);
    if (amount && !isNaN(Number(amount))) {
      const count = Math.max(1, parseInt(countStr, 10) || 2);
      setMyShareAmount((Number(amount) / count).toFixed(0));
    }
  };

  const toggleReminderDay = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter(d => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort((a, b) => a - b));
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!amount.trim() || isNaN(Number(amount))) e.amount = 'Valid amount is required';
    if (!isTrial && expiryDate <= startDate) e.expiryDate = 'Expiry must be after start date';
    if (isTrial && trialEndDate <= startDate) e.trialEndDate = 'Trial end must be after start date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const totalAmt = Number(amount);
    const myShare = isShared && myShareAmount ? Number(myShareAmount) : totalAmt;

    await updateSubscription(id, {
      name: name.trim(),
      description: description.trim() || undefined,
      amount: totalAmt,
      currency,
      billingCycle,
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      category: category || undefined,
      color: customColor,
      iconKey,
      isActive,
      isTrial,
      trialEndDate: isTrial ? trialEndDate.toISOString() : undefined,
      isShared,
      totalPlanAmount: isShared ? totalAmt : undefined,
      myShareAmount: isShared ? myShare : undefined,
      sharedWithCount: isShared ? parseInt(sharedWithCount, 10) || 2 : undefined,
      paymentMethod,
      reminderDaysBefore: reminderDays.length > 0 ? reminderDays : [1],
    });

    router.back();
  };

  const handleDuplicate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    duplicateSubscription(id);
    router.back();
  };

  const confirmDelete = async () => {
    setDeletePopupVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await deleteSubscription(id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Subscription</Text>
        <TouchableOpacity onPress={() => setDeletePopupVisible(true)} style={styles.deleteHeaderBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.accent.red} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* Interactive Icon Preview & Picker Trigger */}
          <TouchableOpacity
            style={styles.iconPreview}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowIconPicker(true);
            }}
            activeOpacity={0.8}
          >
            <SubscriptionIcon name={iconKey || name || 'Subscription'} size={60} />
            <View style={styles.changeIconBadge}>
              <Ionicons name="color-palette-outline" size={13} color="#FFFFFF" />
              <Text style={styles.changeIconText}>Customize Icon & Color</Text>
            </View>
          </TouchableOpacity>

          <GlassInput
            label="Service Name"
            placeholder="e.g. Netflix, ChatGPT, Spotify"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            error={errors.name}
          />

          {/* Amount & Currency Selection */}
          <Text style={styles.fieldLabel}>Plan Amount & Currency</Text>
          <View style={styles.amountCurrencyRow}>
            <TouchableOpacity
              style={styles.currencySelector}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <Text style={styles.currencyText}>{currency}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.text.muted} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <GlassInput
                placeholder="0.00"
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                error={errors.amount}
              />
            </View>
          </View>

          {/* Status Switch (Active / Paused) */}
          <View style={styles.switchCard}>
            <View style={styles.switchLeft}>
              <Ionicons
                name={isActive ? 'play-circle-outline' : 'pause-circle-outline'}
                size={20}
                color={isActive ? colors.accent.green : colors.text.muted}
              />
              <View>
                <Text style={styles.switchTitle}>{isActive ? 'Active Subscription' : 'Subscription Paused'}</Text>
                <Text style={styles.switchSubtitle}>{isActive ? 'Reminders & burn rate are active' : 'Paused — excluded from burn rate'}</Text>
              </View>
            </View>
            <Switch
              value={isActive}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsActive(val);
              }}
              trackColor={{ false: colors.glass.cardBorder, true: colors.accent.green }}
            />
          </View>

          {/* Billing Cycle */}
          <Text style={styles.sectionLabel}>Billing Cycle</Text>
          <View style={styles.chipRow}>
            {billingCycles.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.chip, billingCycle === c.key && styles.chipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleCycleChange(c.key);
                }}
              >
                <Text style={[styles.chipText, billingCycle === c.key && styles.chipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category */}
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.chipRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, styles.chipSmall, category === cat && styles.chipCatActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategory(category === cat ? '' : cat);
                }}
              >
                <Text style={[styles.chipText, styles.chipTextSmall, category === cat && styles.chipTextCatActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Free Trial Toggle */}
          <View style={styles.switchCard}>
            <View style={styles.switchLeft}>
              <Ionicons name="timer-outline" size={20} color="#FFA726" />
              <View>
                <Text style={styles.switchTitle}>Free Trial</Text>
                <Text style={styles.switchSubtitle}>Track trial duration and get urgent cancel reminders</Text>
              </View>
            </View>
            <Switch
              value={isTrial}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsTrial(val);
              }}
              trackColor={{ false: colors.glass.cardBorder, true: '#FFA726' }}
            />
          </View>

          {isTrial && (
            <TouchableOpacity style={styles.dateRow} onPress={() => setShowTrialEndPicker(true)}>
              <Ionicons name="hourglass-outline" size={18} color="#FFA726" />
              <Text style={styles.dateLabel}>Trial End Date</Text>
              <Text style={[styles.dateValue, { color: '#FFA726' }]}>{formatShortDate(trialEndDate)}</Text>
            </TouchableOpacity>
          )}

          {/* Shared / Family Plan Split Toggle */}
          <View style={styles.switchCard}>
            <View style={styles.switchLeft}>
              <Ionicons name="people-outline" size={20} color={colors.accent.purple || '#AB47BC'} />
              <View>
                <Text style={styles.switchTitle}>Shared / Family Plan</Text>
                <Text style={styles.switchSubtitle}>Split cost with friends or family members</Text>
              </View>
            </View>
            <Switch
              value={isShared}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsShared(val);
                if (val && amount) {
                  const count = parseInt(sharedWithCount, 10) || 2;
                  setMyShareAmount((Number(amount) / count).toFixed(0));
                }
              }}
              trackColor={{ false: colors.glass.cardBorder, true: colors.accent.purple || '#AB47BC' }}
            />
          </View>

          {isShared && (
            <View style={styles.sharedConfigBox}>
              <View style={styles.sharedInputRow}>
                <View style={{ flex: 1 }}>
                  <GlassInput
                    label="Split among (people)"
                    placeholder="2"
                    value={sharedWithCount}
                    onChangeText={handleSharedCountChange}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <GlassInput
                    label="Your Share"
                    placeholder="0.00"
                    value={myShareAmount}
                    onChangeText={setMyShareAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Payment Method */}
          <Text style={styles.sectionLabel}>Payment Method</Text>
          <View style={styles.chipRow}>
            {paymentMethods.map((pm) => (
              <TouchableOpacity
                key={pm}
                style={[styles.chip, styles.chipSmall, paymentMethod === pm && styles.chipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPaymentMethod(pm);
                }}
              >
                <Text style={[styles.chipText, styles.chipTextSmall, paymentMethod === pm && styles.chipTextActive]}>
                  {pm}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Multi-Stage Reminders */}
          <Text style={styles.sectionLabel}>Renewal Reminders 🔔</Text>
          <View style={styles.chipRow}>
            {reminderOptions.map((opt) => {
              const isSelected = reminderDays.includes(opt.days);
              return (
                <TouchableOpacity
                  key={opt.days}
                  style={[styles.chip, styles.chipSmall, isSelected && styles.chipActive]}
                  onPress={() => toggleReminderDay(opt.days)}
                >
                  <Text style={[styles.chipText, styles.chipTextSmall, isSelected && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dates */}
          <Text style={styles.sectionLabel}>Billing Dates</Text>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowStartPicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent.blue} />
            <Text style={styles.dateLabel}>Start Date</Text>
            <Text style={styles.dateValue}>{formatShortDate(startDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.dateRow, errors.expiryDate && { borderColor: colors.accent.red }]} onPress={() => setShowExpiryPicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent.blue} />
            <Text style={styles.dateLabel}>Next Renewal Date</Text>
            <Text style={styles.dateValue}>{formatShortDate(expiryDate)}</Text>
          </TouchableOpacity>
          {errors.expiryDate && <Text style={styles.errorText}>{errors.expiryDate}</Text>}

          <GlassInput
            label="Notes (Optional)"
            placeholder="Account email, login notes, or plan details..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {/* Action Buttons */}
          <View style={styles.btns}>
            <GlassButton title="Save Changes" onPress={handleSave} size="large" />
            <GlassButton title="Duplicate Subscription" variant="secondary" onPress={handleDuplicate} size="large" />
            <GlassButton title="Cancel" variant="ghost" onPress={() => router.back()} size="large" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppDatePicker
        visible={showStartPicker}
        date={startDate}
        onConfirm={(d) => { setShowStartPicker(false); setStartDate(d); }}
        onCancel={() => setShowStartPicker(false)}
      />
      <AppDatePicker
        visible={showExpiryPicker}
        date={expiryDate}
        minimumDate={startDate}
        onConfirm={(d) => { setShowExpiryPicker(false); setExpiryDate(d); }}
        onCancel={() => setShowExpiryPicker(false)}
      />
      <AppDatePicker
        visible={showTrialEndPicker}
        date={trialEndDate}
        minimumDate={startDate}
        onConfirm={(d) => { setShowTrialEndPicker(false); setTrialEndDate(d); }}
        onCancel={() => setShowTrialEndPicker(false)}
      />
      <CurrencyPicker
        visible={showCurrencyPicker}
        selectedCode={currency}
        onSelect={setCurrency}
        onClose={() => setShowCurrencyPicker(false)}
      />
      <BrandIconPickerModal
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        selectedIconKey={iconKey}
        selectedColor={customColor}
        onSelectIcon={(k, c) => {
          if (k) setIconKey(k);
          if (c) setCustomColor(c);
        }}
      />
      <AppPopup
        visible={deletePopupVisible}
        title="Delete Subscription"
        message={`Are you sure you want to delete "${subscription.name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletePopupVisible(false)}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  notFound: { color: colors.text.secondary, fontSize: 16, marginBottom: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  deleteHeaderBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: isDark ? 'rgba(239,83,80,0.15)' : '#FEE2E2',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239,83,80,0.3)' : '#FCA5A5',
    justifyContent: 'center', alignItems: 'center',
  },
  title: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 50 },
  iconPreview: {
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 8,
  },
  changeIconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: isDark ? 'rgba(79,195,247,0.2)' : '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeIconText: {
    color: isDark ? colors.accent.blue : '#0284C7',
    fontSize: 11,
    fontWeight: '600',
  },
  fieldLabel: {
    color: isDark ? colors.text.secondary : '#475569',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  amountCurrencyRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#CBD5E1',
  },
  currencyText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionLabel: {
    color: isDark ? colors.text.secondary : '#475569',
    fontSize: 13,
    marginBottom: 10,
    marginTop: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#CBD5E1',
  },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: {
    backgroundColor: isDark ? 'rgba(79, 195, 247, 0.18)' : '#E0F2FE',
    borderColor: colors.accent.blue,
  },
  chipCatActive: {
    backgroundColor: isDark ? 'rgba(171, 71, 188, 0.2)' : '#F3E8FF',
    borderColor: colors.accent.purple || '#9333EA',
  },
  chipText: { color: isDark ? colors.text.muted : '#475569', fontSize: 13, fontWeight: '600' },
  chipTextSmall: { fontSize: 12 },
  chipTextActive: { color: isDark ? colors.accent.blue : '#0284C7', fontWeight: '800' },
  chipTextCatActive: { color: colors.accent.purple || '#9333EA', fontWeight: '800' },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? 'rgba(18, 18, 28, 0.88)' : '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    elevation: isDark ? 1 : 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowRadius: 4,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  switchSubtitle: {
    color: isDark ? colors.text.muted : '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  sharedConfigBox: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
  },
  sharedInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: isDark ? 'rgba(18, 18, 28, 0.88)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    elevation: isDark ? 1 : 2,
  },
  dateLabel: { color: isDark ? colors.text.secondary : '#475569', fontSize: 14, flex: 1, fontWeight: '500' },
  dateValue: { color: colors.text.primary, fontSize: 14, fontWeight: '700' },
  errorText: { color: colors.accent.red, fontSize: 12, marginTop: -4, marginBottom: 8 },
  btns: { gap: 10, marginTop: 24 },
});
