import { useTheme } from '../../hooks/useTheme';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
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
import { useDailySpending } from '../../hooks/useDailySpending';
import { useCurrency } from '../../hooks/useCurrency';
import { useCredits } from '../../hooks/useCredits';
import { formatShortDate } from '../../utils/dateHelpers';
import { useCategoryManager } from '../../hooks/useCategoryManager';
import { pickReceiptFromGallery, takeReceiptPhoto } from '../../utils/receiptHelper';
import { ReceiptVaultModal } from '../../components/ReceiptVaultModal';
import { predictCategory } from '../../utils/smartCategorizer';
import { extractReceiptData } from '../../utils/receiptScanner';

interface SplitFriend {
  id: string;
  name: string;
  amount: string;
}

export default function AddSpendingModal() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { addEntry } = useDailySpending();
  const { addCredit } = useCredits();
  const { currencyCode: defaultCurrency } = useCurrency();
  const { allCategories } = useCategoryManager();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [category, setCategory] = useState('Food');
  const [isAutoSuggested, setIsAutoSuggested] = useState(false);

  useEffect(() => {
    if (allCategories.length > 0 && !allCategories.some((c) => c.name.toLowerCase() === category.toLowerCase())) {
      setCategory(allCategories[0].name);
    }
  }, [allCategories]);

  const [spentAt, setSpentAt] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showReceiptVault, setShowReceiptVault] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Bill Splitting State
  const [isSplitEnabled, setIsSplitEnabled] = useState(false);
  const [splitFriends, setSplitFriends] = useState<SplitFriend[]>([]);
  const [newFriendName, setNewFriendName] = useState('');

  // Handle Title input with smart category prediction
  const handleTitleChange = async (val: string) => {
    setTitle(val);
    if (val.trim().length >= 3) {
      const predicted = await predictCategory(val, allCategories);
      if (predicted) {
        setCategory(predicted.name);
        setIsAutoSuggested(true);
      }
    }
  };

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

  // Receipt Scanner & Auto-Fill
  const handleScanAndAutoFill = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const uri = await takeReceiptPhoto();
    if (uri) {
      setReceiptImage(uri);
      // Simulate/extract from image path & smart keywords
      const fileName = uri.split('/').pop() || '';
      const extracted = await extractReceiptData(fileName, allCategories);
      if (extracted.merchant && !title) setTitle(extracted.merchant);
      if (extracted.amount && !amount) setAmount(extracted.amount.toString());
      if (extracted.suggestedCategory) {
        setCategory(extracted.suggestedCategory);
        setIsAutoSuggested(true);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Split Bill Calculations
  const totalAmountNum = parseFloat(amount) || 0;
  const friendsTotalOwed = splitFriends.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
  const myNetShare = Math.max(0, totalAmountNum - friendsTotalOwed);

  const addFriend = () => {
    const trimmed = newFriendName.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newFriend: SplitFriend = {
      id: Date.now().toString(),
      name: trimmed,
      amount: '0',
    };
    const updated = [...splitFriends, newFriend];
    setSplitFriends(updated);
    setNewFriendName('');

    // Auto equal split
    if (totalAmountNum > 0) {
      const perPerson = (totalAmountNum / (updated.length + 1)).toFixed(2);
      setSplitFriends(updated.map((f) => ({ ...f, amount: perPerson })));
    }
  };

  const removeFriend = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = splitFriends.filter((f) => f.id !== id);
    setSplitFriends(updated);
    if (totalAmountNum > 0 && updated.length > 0) {
      const perPerson = (totalAmountNum / (updated.length + 1)).toFixed(2);
      setSplitFriends(updated.map((f) => ({ ...f, amount: perPerson })));
    }
  };

  const splitEqually = () => {
    if (totalAmountNum <= 0 || splitFriends.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perPerson = (totalAmountNum / (splitFriends.length + 1)).toFixed(2);
    setSplitFriends(splitFriends.map((f) => ({ ...f, amount: perPerson })));
  };

  const updateFriendAmount = (id: string, val: string) => {
    setSplitFriends(splitFriends.map((f) => (f.id === id ? { ...f, amount: val } : f)));
  };

  const handleSave = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    let finalSpendingAmount = Number(amount);
    let finalNotes = notes.trim();

    // If bill splitting is enabled, log user's actual share as the expense and create credits for friends
    if (isSplitEnabled && splitFriends.length > 0) {
      finalSpendingAmount = Number(myNetShare.toFixed(2));
      const splitSummary = splitFriends
        .map((f) => `${f.name}: ${f.amount} ${currency}`)
        .join(', ');
      finalNotes = finalNotes
        ? `${finalNotes}\n[Split Bill (${totalAmountNum} total): You paid for ${splitSummary}]`
        : `[Split Bill (${totalAmountNum} total): You paid for ${splitSummary}]`;

      // Automatically create Credit entries (Owed to Me) for each friend!
      for (const friend of splitFriends) {
        const friendAmt = parseFloat(friend.amount) || 0;
        if (friendAmt > 0) {
          await addCredit({
            personName: friend.name,
            amount: friendAmt,
            currency,
            purpose: `Split: ${title.trim()}`,
            lentDate: spentAt.toISOString(),
            notes: `Auto-generated from split expense "${title.trim()}". Total bill was ${totalAmountNum} ${currency}.`,
          });
        }
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addEntry({
      title: title.trim(),
      amount: finalSpendingAmount,
      currency,
      category,
      spentAt: spentAt.toISOString(),
      notes: finalNotes || undefined,
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
          <GlassInput
            label="Spent On"
            placeholder="Tea, groceries, fuel, Uber..."
            value={title}
            onChangeText={handleTitleChange}
            error={errors.title}
          />

          <View style={styles.row}>
            <View style={styles.amountCol}>
              <GlassInput
                label="Amount"
                placeholder="0.00"
                value={amount}
                onChangeText={(val) => {
                  setAmount(val);
                  if (isSplitEnabled && splitFriends.length > 0) {
                    const parsed = parseFloat(val) || 0;
                    const perPerson = (parsed / (splitFriends.length + 1)).toFixed(2);
                    setSplitFriends(splitFriends.map((f) => ({ ...f, amount: perPerson })));
                  }
                }}
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
                <Ionicons name="chevron-down" size={14} color={colors.text.secondary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Section */}
          <View style={styles.categoryHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sectionLabel}>Category</Text>
              {isAutoSuggested && (
                <View style={styles.autoSuggestBadge}>
                  <Text style={styles.autoSuggestText}>✨ Auto-Selected</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/modals/manage-categories');
              }}
              style={styles.manageCategoryBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={13} color={colors.accent.purple} />
              <Text style={styles.manageCategoryText}>Manage</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chipRow}>
            {allCategories.map((item) => {
              const isActive = category.toLowerCase() === item.name.toLowerCase();
              return (
                <TouchableOpacity
                  key={item.id || item.name}
                  style={[
                    styles.chip,
                    isActive && [
                      styles.chipActive,
                      { borderColor: item.color, backgroundColor: `${item.color}22` },
                    ],
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsAutoSuggested(false);
                    setCategory(item.name);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={14}
                    color={isActive ? item.color : colors.text.muted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      isActive && [styles.chipTextActive, { color: item.color, fontWeight: '700' }],
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.chip, styles.chipAddNew]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/modals/manage-categories');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={14} color={colors.accent.purple} style={{ marginRight: 4 }} />
              <Text style={[styles.chipText, { color: colors.accent.purple, fontWeight: '700' }]}>+ Add Custom</Text>
            </TouchableOpacity>
          </View>

          {/* Date Picker */}
          <Text style={styles.sectionLabel}>Date</Text>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent.blue} />
            <Text style={styles.dateLabel}>Spent Date</Text>
            <Text style={styles.dateValue}>{formatShortDate(spentAt)}</Text>
          </TouchableOpacity>

          {/* Split Bill With Friends Section */}
          <View style={styles.splitToggleCard}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="people-outline" size={18} color={colors.accent.blue} />
                <Text style={styles.splitToggleTitle}>Split Bill With Friends</Text>
              </View>
              <Text style={styles.splitToggleSub}>
                Automatically log owed credits for friends who share this bill
              </Text>
            </View>
            <Switch
              value={isSplitEnabled}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsSplitEnabled(val);
              }}
              trackColor={{ false: colors.glass.cardBorder, true: colors.accent.blue }}
              thumbColor="#FFFFFF"
            />
          </View>

          {isSplitEnabled && (
            <View style={styles.splitBox}>
              <View style={styles.splitInputRow}>
                <TextInput
                  style={styles.friendTextInput}
                  placeholder="Friend name (e.g. Rahul, Sarah)..."
                  placeholderTextColor={colors.text.muted}
                  value={newFriendName}
                  onChangeText={setNewFriendName}
                  onSubmitEditing={addFriend}
                />
                <TouchableOpacity style={styles.addFriendBtn} onPress={addFriend}>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addFriendBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {splitFriends.length > 0 && (
                <>
                  <View style={styles.splitActionsRow}>
                    <Text style={styles.splitSectionSubtitle}>
                      {splitFriends.length} {splitFriends.length === 1 ? 'Friend' : 'Friends'} in Split
                    </Text>
                    <TouchableOpacity onPress={splitEqually} style={styles.equalSplitBtn}>
                      <Ionicons name="calculator-outline" size={12} color={colors.accent.blue} />
                      <Text style={styles.equalSplitText}>Split Equally</Text>
                    </TouchableOpacity>
                  </View>

                  {splitFriends.map((friend) => (
                    <View key={friend.id} style={styles.friendRow}>
                      <View style={styles.friendAvatar}>
                        <Text style={styles.friendAvatarText}>{friend.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.friendName} numberOfLines={1}>{friend.name}</Text>
                      <View style={styles.friendAmountWrap}>
                        <Text style={styles.friendCurr}>{currency}</Text>
                        <TextInput
                          style={styles.friendAmountInput}
                          value={friend.amount}
                          onChangeText={(v) => updateFriendAmount(friend.id, v)}
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <TouchableOpacity onPress={() => removeFriend(friend.id)} style={styles.friendRemoveBtn}>
                        <Ionicons name="close-circle" size={18} color={colors.accent.red} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Summary card */}
                  <View style={styles.splitSummaryCard}>
                    <View style={styles.splitSummaryCol}>
                      <Text style={styles.splitSummaryLabel}>Your Personal Share</Text>
                      <Text style={styles.splitSummaryValuePrimary}>
                        {myNetShare.toFixed(2)} {currency}
                      </Text>
                    </View>
                    <View style={styles.splitSummaryDivider} />
                    <View style={styles.splitSummaryCol}>
                      <Text style={styles.splitSummaryLabel}>Owed by Friends</Text>
                      <Text style={styles.splitSummaryValueSecondary}>
                        {friendsTotalOwed.toFixed(2)} {currency}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Receipt Photo Vault & Scanner Section */}
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
                  <TouchableOpacity
                    style={styles.receiptMiniBtn}
                    onPress={() => setShowReceiptVault(true)}
                  >
                    <Ionicons name="eye-outline" size={14} color={colors.accent.blue} />
                    <Text style={styles.receiptMiniBtnText}>Inspect</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.receiptMiniBtn, { backgroundColor: 'rgba(239, 83, 80, 0.15)' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setReceiptImage(null);
                    }}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.accent.red} />
                    <Text style={[styles.receiptMiniBtnText, { color: colors.accent.red }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.receiptPickerBox}>
              <TouchableOpacity
                style={styles.receiptUploadBtn}
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={18} color={colors.accent.blue} />
                <Text style={styles.receiptUploadBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.receiptUploadBtn}
                onPress={handlePickGallery}
                activeOpacity={0.7}
              >
                <Ionicons name="images-outline" size={18} color={colors.accent.purple} />
                <Text style={styles.receiptUploadBtnText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.receiptUploadBtn, { borderColor: colors.accent.blue }]}
                onPress={handleScanAndAutoFill}
                activeOpacity={0.7}
              >
                <Ionicons name="sparkles-outline" size={18} color={colors.accent.blue} />
                <Text style={[styles.receiptUploadBtnText, { color: colors.accent.blue }]}>Scan & Fill</Text>
              </TouchableOpacity>
            </View>
          )}

          <GlassInput label="Notes (Optional)" placeholder="Add any details..." value={notes} onChangeText={setNotes} />

          <View style={styles.btns}>
            <GlassButton
              title={isSplitEnabled && splitFriends.length > 0 ? `Log Expense (${myNetShare.toFixed(2)} ${currency}) & Add Credits` : 'Add Expense'}
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
        date={spentAt}
        onConfirm={(d) => {
          setSpentAt(d);
          setShowDatePicker(false);
        }}
      />

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
    categoryHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
      marginBottom: 10,
    },
    sectionLabel: { color: colors.text.secondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    autoSuggestBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(2, 132, 199, 0.1)',
    },
    autoSuggestText: {
      color: colors.accent.blue,
      fontSize: 10,
      fontWeight: '700',
    },
    manageCategoryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
    },
    manageCategoryText: {
      color: colors.accent.purple,
      fontSize: 11.5,
      fontWeight: '700',
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.buttonSecondary },
    chipActive: { backgroundColor: colors.accent.alpha ? colors.accent.alpha(0.15) : 'rgba(79,195,247,0.15)', borderColor: colors.accent.blue },
    chipAddNew: {
      borderStyle: 'dashed',
      borderColor: colors.accent.purple,
      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.06)',
    },
    chipText: { color: colors.text.muted, fontSize: 13, fontWeight: '500' },
    chipTextActive: { color: colors.accent.blue, fontWeight: '700' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.glass.card, borderWidth: 0.5, borderColor: colors.glass.cardBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12 },
    dateLabel: { color: colors.text.secondary, fontSize: 14, flex: 1 },
    dateValue: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },

    // Split Bill Styles
    splitToggleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
    },
    splitToggleTitle: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '700',
    },
    splitToggleSub: {
      color: colors.text.muted,
      fontSize: 11.5,
      marginTop: 2,
    },
    splitBox: {
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(79, 195, 247, 0.2)' : 'rgba(2, 132, 199, 0.15)',
      borderRadius: 18,
      padding: 14,
      marginBottom: 14,
      gap: 10,
    },
    splitInputRow: {
      flexDirection: 'row',
      gap: 8,
    },
    friendTextInput: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      paddingHorizontal: 12,
      color: colors.text.primary,
      fontSize: 13,
    },
    addFriendBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.accent.blue,
      justifyContent: 'center',
    },
    addFriendBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    splitActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    splitSectionSubtitle: {
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '600',
    },
    equalSplitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(2, 132, 199, 0.1)',
    },
    equalSplitText: {
      color: colors.accent.blue,
      fontSize: 11,
      fontWeight: '700',
    },
    friendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    friendAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accent.alpha(0.2),
      alignItems: 'center',
      justifyContent: 'center',
    },
    friendAvatarText: {
      color: colors.accent.purple,
      fontSize: 12,
      fontWeight: '800',
    },
    friendName: {
      flex: 1,
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    friendAmountWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      borderRadius: 8,
      paddingHorizontal: 8,
      height: 34,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    friendCurr: {
      color: colors.text.muted,
      fontSize: 11,
      marginRight: 4,
    },
    friendAmountInput: {
      width: 60,
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'right',
    },
    friendRemoveBtn: {
      padding: 4,
    },
    splitSummaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(79, 195, 247, 0.08)' : 'rgba(2, 132, 199, 0.06)',
      padding: 10,
      marginTop: 6,
    },
    splitSummaryCol: {
      flex: 1,
      alignItems: 'center',
    },
    splitSummaryDivider: {
      width: 1,
      height: 28,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    splitSummaryLabel: {
      color: colors.text.muted,
      fontSize: 10.5,
      fontWeight: '500',
    },
    splitSummaryValuePrimary: {
      color: colors.accent.blue,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 2,
    },
    splitSummaryValueSecondary: {
      color: colors.accent.purple,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 2,
    },

    // Receipt Attachment Styles
    receiptPickerBox: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    receiptUploadBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 46,
      borderRadius: 14,
      backgroundColor: colors.glass.card,
      borderWidth: 1,
      borderColor: colors.glass.cardBorder,
      borderStyle: 'dashed',
    },
    receiptUploadBtnText: {
      color: colors.text.primary,
      fontSize: 12,
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
