import { useTheme, ACCENT_PALETTE, AccentColor } from '../../hooks/useTheme';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '../../components/AmbientBackground';
import { CurrencyPicker } from '../../components/CurrencyPicker';
import { AppPopup } from '../../components/AppPopup';
import { useCurrency } from '../../hooks/useCurrency';
import { useBudget } from '../../hooks/useBudget';
import { useSettings } from '../../context/SettingsContext';
import { useDailySpending } from '../../hooks/useDailySpending';
import { storage } from '../../storage/mmkv';
import { STORAGE_KEYS } from '../../storage/keys';
import { useAuthLock } from '../../context/AuthLockContext';
import { checkForUpdate, UpdateInfo } from '../../utils/updateChecker';
import { UpdatePrompt } from '../../components/UpdatePrompt';
import { exportAllData } from '../../utils/exportData';
import { exportSpendingCSV } from '../../utils/backupRestore';
import { SPENDING_CATEGORIES, getCategoryIcon } from '../../constants/categories';
import { hasBiometrics, toggleBiometricAuth } from '../../utils/authHelpers';
import Constants from 'expo-constants';

export default function SettingsModal() {
  const { colors, isDark, mode, setMode, accentColor, setAccentColor } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();

  const {
    numberFormat, setNumberFormat,
    dateFormat, setDateFormat,
    weekStartDay, setWeekStartDay,
    cardDensityMode, setCardDensityMode,
  } = useSettings();

  const { enableLock, disableLock, removePin } = useAuthLock();
  const { currency, setCurrency: setSelectedCurrency } = useCurrency();
  const { budget, setBudget, setCategoryLimit } = useBudget();
  const { entries: spendingEntries } = useDailySpending();

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricsSupported, setBiometricsSupported] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  const [dailyRemindersEnabled, setDailyRemindersEnabled] = useState(true);
  const [morningTime, setMorningTime] = useState('09:00');
  const [middayTime, setMiddayTime] = useState('14:00');

  const [budgetInput, setBudgetInput] = useState('');
  const [categoryLimitsInput, setCategoryLimitsInput] = useState<Record<string, string>>({});
  const [categoryLimitsExpanded, setCategoryLimitsExpanded] = useState(false);

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState<any>({});

  const showPopup = (config: any) => {
    setPopupConfig(config);
    setPopupVisible(true);
  };
  const closePopup = () => setPopupVisible(false);

  // Load Settings Data
  useEffect(() => {
    async function loadData() {
      try {
        const bioSupp = await hasBiometrics();
        setBiometricsSupported(bioSupp);

        const bioVal = await storage.getString(STORAGE_KEYS.IS_BIOMETRIC_AUTH_ENABLED);
        setBiometricEnabled(bioVal === 'true');

        const savedPin = await storage.getString('security_pin_code');
        if (savedPin) setPinCode(savedPin);

        const notiVal = await storage.getString('daily_reminder_enabled');
        setDailyRemindersEnabled(notiVal !== 'false');

        const mTime = await storage.getString('morning_reminder_time');
        if (mTime) setMorningTime(mTime);

        const dTime = await storage.getString('midday_reminder_time');
        if (dTime) setMiddayTime(dTime);

        if (budget.amount > 0) {
          setBudgetInput(budget.amount.toString());
        }

        if (budget.categoryLimits) {
          const limitsStr: Record<string, string> = {};
          Object.keys(budget.categoryLimits).forEach((cat) => {
            if (budget.categoryLimits[cat] > 0) {
              limitsStr[cat] = budget.categoryLimits[cat].toString();
            }
          });
          setCategoryLimitsInput(limitsStr);
        }
      } catch {}
    }
    loadData();
  }, [budget]);

  // Handlers
  const handleToggleBiometrics = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newVal = !biometricEnabled;
    if (newVal) {
      const success = await toggleBiometricAuth(true);
      await enableLock(pinCode || undefined);
      setBiometricEnabled(true);
    } else {
      await disableLock();
      setBiometricEnabled(false);
      setPinCode('');
      setShowPinInput(false);
    }
  };

  const handleSavePin = async () => {
    if (pinCode.length !== 4 || isNaN(Number(pinCode))) {
      Alert.alert('Invalid PIN', 'Please enter a 4-digit numeric PIN code.');
      return;
    }
    await enableLock(pinCode);
    setBiometricEnabled(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowPinInput(false);
    Alert.alert('PIN Saved', 'Your 4-digit security PIN has been updated and App Lock is enabled.');
  };

  const handleRemovePin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await removePin();
    setPinCode('');
    setShowPinInput(false);
    Alert.alert('PIN Removed', 'Your 4-digit security PIN code has been removed.');
  };

  const handleToggleReminders = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = !dailyRemindersEnabled;
    setDailyRemindersEnabled(newVal);
    await storage.set('daily_reminder_enabled', newVal ? 'true' : 'false');
  };

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetInput);
    if (!isNaN(amount) && amount >= 0) {
      setBudget(amount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Budget Saved', 'Monthly budget limit updated successfully.');
    }
  };

  const handleSaveCategoryLimit = (cat: string, val: string) => {
    setCategoryLimitsInput((prev) => ({ ...prev, [cat]: val }));
    const parsed = parseFloat(val) || 0;
    setCategoryLimit(cat, parsed);
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const info = await checkForUpdate(true);
      if (info && info.available) {
        setUpdateInfo(info);
        setShowUpdatePrompt(true);
      } else {
        showPopup({
          title: 'Up to Date',
          message: 'You are using the latest version of SubDebt Manager.',
          icon: 'checkmark-circle-outline',
          iconColor: colors.accent.green,
          confirmText: 'OK',
          onConfirm: closePopup,
        });
      }
    } catch {
      showPopup({
        title: 'Check Failed',
        message: 'Could not connect to GitHub releases.',
        icon: 'alert-circle-outline',
        iconColor: colors.accent.red,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await exportAllData();
    setExporting(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Export Complete', 'Ledger backup exported successfully.');
    }
  };

  const currentVersion = Constants.expoConfig?.version || '2.4.0';

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS & PREFERENCES</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Subtitle Badge */}
        <View style={styles.topInfoBadge}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent.purple} />
          <Text style={styles.topInfoText}>SubDebt Manager v{currentVersion} · 100% Offline Vault</Text>
        </View>

        {/* SECTION 1: DISPLAY & REGIONAL */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="options-outline" size={18} color={colors.accent.purple} />
            <Text style={styles.sectionTitle}>DISPLAY & REGIONAL PREFERENCES</Text>
          </View>

          {/* Primary Base Currency */}
          <TouchableOpacity style={styles.settingRow} onPress={() => setShowCurrencyPicker(true)} activeOpacity={0.8}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Primary Base Currency</Text>
              <Text style={styles.settingSub}>{currency.code} ({currency.symbol}) · {currency.name}</Text>
            </View>
            <View style={styles.rowRightPill}>
              <Text style={styles.rowRightPillText}>{currency.code}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            </View>
          </TouchableOpacity>

          {/* Theme Mode Selector */}
          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Theme Mode</Text>
              <Text style={styles.settingSub}>Select light or dark app theme</Text>
            </View>
            <View style={styles.segmentedRow}>
              {(['dark', 'light'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.segBtn, mode === m && styles.segBtnActive]}
                  onPress={() => { setMode(m); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segBtnText, mode === m && styles.segBtnTextActive]}>
                    {m === 'dark' ? 'Dark' : 'Light'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Accent Color */}
          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Accent Color</Text>
              <Text style={styles.settingSub}>Customize app-wide highlight color</Text>
            </View>
            <View style={styles.accentRow}>
              {(['blue', 'green', 'purple', 'amber', 'red'] as AccentColor[]).map((c) => {
                const isSelected = accentColor === c;
                const swatchColor = isDark ? ACCENT_PALETTE[c].dark.primary : ACCENT_PALETTE[c].light.primary;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => { setAccentColor(c); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    activeOpacity={0.8}
                    style={[
                      styles.accentSwatch,
                      { backgroundColor: swatchColor },
                      isSelected && styles.accentSwatchSelected,
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Card Density Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Card Density Mode</Text>
              <Text style={styles.settingSub}>Choose card list layout padding</Text>
            </View>
            <View style={styles.segmentedRow}>
              {(['comfortable', 'compact'] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.segBtn, cardDensityMode === d && styles.segBtnActive]}
                  onPress={() => { setCardDensityMode(d); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segBtnText, cardDensityMode === d && styles.segBtnTextActive]}>
                    {d === 'comfortable' ? 'Comfort' : 'Compact'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Number Format */}
          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Number Formatting</Text>
              <Text style={styles.settingSub}>Standard (1,234) vs European (1.234) vs Space (1 234)</Text>
            </View>
            <View style={styles.segmentedRow}>
              {(['standard', 'european', 'space'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.segBtn, numberFormat === f && styles.segBtnActive]}
                  onPress={() => { setNumberFormat(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segBtnText, numberFormat === f && styles.segBtnTextActive]}>
                    {f === 'standard' ? 'Std' : f === 'european' ? 'Euro' : 'Space'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Week Start Day */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Week Start Day</Text>
              <Text style={styles.settingSub}>Calendar matrix starting day</Text>
            </View>
            <View style={styles.segmentedRow}>
              {(['monday', 'sunday', 'saturday'] as const).map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[styles.segBtn, weekStartDay === w && styles.segBtnActive]}
                  onPress={() => { setWeekStartDay(w); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segBtnText, weekStartDay === w && styles.segBtnTextActive]}>
                    {w === 'monday' ? 'Mon' : w === 'sunday' ? 'Sun' : 'Sat'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* SECTION 2: SECURITY & PRIVACY */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent.blue} />
            <Text style={styles.sectionTitle}>SECURITY & PRIVACY LOCK</Text>
          </View>

          {/* Biometric / PIN Lock Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>App Lock (Biometric & PIN)</Text>
              <Text style={styles.settingSub}>Require authentication upon launch</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: isDark ? '#2A2A3C' : '#E2E8F0', true: colors.accent.purple }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* 4-Digit PIN Configuration */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={() => setShowPinInput(!showPinInput)} activeOpacity={0.8}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>4-Digit Security PIN</Text>
              <Text style={styles.settingSub}>{pinCode ? 'PIN Enabled (Tap to edit)' : 'Set 4-Digit Security PIN'}</Text>
            </View>
            <Ionicons name={showPinInput ? 'chevron-up' : 'chevron-forward'} size={18} color={colors.text.muted} />
          </TouchableOpacity>

          {showPinInput && (
            <View style={styles.pinFormBox}>
              <Text style={styles.pinFormLabel}>Set Secret 4-Digit PIN</Text>
              <View style={styles.pinInputRow}>
                <TextInput
                  style={styles.pinInput}
                  value={pinCode}
                  onChangeText={setPinCode}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  placeholder="0000"
                  placeholderTextColor={colors.text.muted}
                />
                <TouchableOpacity style={styles.savePinBtn} onPress={handleSavePin} activeOpacity={0.8}>
                  <Text style={styles.savePinBtnText}>Save</Text>
                </TouchableOpacity>
                {Boolean(pinCode) && (
                  <TouchableOpacity style={styles.removePinBtn} onPress={handleRemovePin} activeOpacity={0.8}>
                    <Text style={styles.removePinBtnText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* SECTION 3: NOTIFICATIONS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="notifications-outline" size={18} color={colors.accent.amber} />
            <Text style={styles.sectionTitle}>SMART NOTIFICATION SCHEDULE</Text>
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Daily Reminders</Text>
              <Text style={styles.settingSub}>Receive daily allowance & debt notifications</Text>
            </View>
            <Switch
              value={dailyRemindersEnabled}
              onValueChange={handleToggleReminders}
              trackColor={{ false: isDark ? '#2A2A3C' : '#E2E8F0', true: colors.accent.purple }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* SECTION 4: BUDGET & CATEGORY MANAGER */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="pie-chart-outline" size={18} color={colors.accent.green} />
            <Text style={styles.sectionTitle}>BUDGET CAPS & CATEGORIES</Text>
          </View>

          {/* Monthly Budget Input */}
          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Overall Monthly Budget Cap</Text>
              <Text style={styles.settingSub}>Current: {budget.amount > 0 ? `${budget.amount} ${currency.code}` : 'None Set'}</Text>
            </View>
            <View style={styles.budgetInputWrap}>
              <TextInput
                style={styles.budgetTextInput}
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="numeric"
                placeholder="Amount"
                placeholderTextColor={colors.text.muted}
              />
              <TouchableOpacity style={styles.saveBudgetBtn} onPress={handleSaveBudget}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Manage Custom Categories Route */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modals/manage-categories');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Manage Custom Categories</Text>
              <Text style={styles.settingSub}>Create custom category icons, colors, and groups</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* SECTION 5: DATA VAULT & SYSTEM INFO */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="file-tray-full-outline" size={18} color={colors.accent.purple} />
            <Text style={styles.sectionTitle}>DATA VAULT & SYSTEM BUILD</Text>
          </View>

          {/* Data Vault CTA */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modals/tool-data-vault');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Data Vault & JSON Backup</Text>
              <Text style={styles.settingSub}>Full offline backup and device restore tool</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>

          {/* Export JSON Backup Direct */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={handleExportData} activeOpacity={0.8} disabled={exporting}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Export Ledger JSON File</Text>
              <Text style={styles.settingSub}>Generate encrypted backup file</Text>
            </View>
            {exporting ? <ActivityIndicator size="small" color={colors.accent.purple} /> : <Ionicons name="share-outline" size={18} color={colors.text.muted} />}
          </TouchableOpacity>
        </View>

        {/* ABOUT FOOTER */}
        <View style={styles.aboutFooter}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.aboutLogo}
          />
          <Text style={styles.aboutAppName}>SubDebt Manager</Text>
          <Text style={styles.aboutVersion}>v{currentVersion}</Text>

          <View style={styles.aboutBadgeRow}>
            {[
              { icon: 'shield-checkmark', label: '100% Offline' },
              { icon: 'lock-closed', label: 'On-Device Vault' },
              { icon: 'logo-github', label: 'Open Source' },
              { icon: 'ban', label: 'Zero Ads' },
            ].map((item) => (
              <View key={item.label} style={styles.aboutBadge}>
                <Ionicons name={item.icon as any} size={12} color={colors.accent.purple} />
                <Text style={styles.aboutBadgeText}>{item.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.aboutCheckUpdateBtn}
            onPress={handleCheckUpdate}
            activeOpacity={0.8}
            disabled={checkingUpdate}
          >
            {checkingUpdate ? (
              <ActivityIndicator size="small" color={colors.accent.purple} />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color={colors.accent.purple} />
                <Text style={styles.aboutCheckUpdateText}>Check for Updates</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.aboutMadeWith}>
            Made with ❤️ for financial freedom
          </Text>
        </View>
      </ScrollView>

      {/* Currency Picker Modal */}
      <CurrencyPicker
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        selectedCode={currency.code}
        onSelect={(code) => {
          setSelectedCurrency(code);
          setShowCurrencyPicker(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />

      <AppPopup
        visible={popupVisible}
        title={popupConfig.title || ''}
        message={popupConfig.message || ''}
        icon={popupConfig.icon}
        iconColor={popupConfig.iconColor}
        confirmText={popupConfig.confirmText}
        cancelText={popupConfig.cancelText}
        onConfirm={popupConfig.onConfirm || closePopup}
        onCancel={popupConfig.onCancel || closePopup}
      />

      {updateInfo && (
        <UpdatePrompt
          visible={showUpdatePrompt}
          updateInfo={updateInfo}
          onDismiss={() => setShowUpdatePrompt(false)}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.glass.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
    },
    headerTitle: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    content: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
    topInfoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.accent.alpha(isDark ? 0.12 : 0.06),
      borderWidth: 0.5,
      borderColor: colors.accent.alpha(0.2),
    },
    topInfoText: {
      color: colors.accent.purple,
      fontSize: 11,
      fontWeight: '700',
    },
    sectionCard: {
      padding: 16,
      borderRadius: 22,
      backgroundColor: colors.glass.card,
      borderWidth: 0.5,
      borderColor: colors.glass.cardBorder,
      gap: 10,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    sectionTitle: {
      color: colors.text.tertiary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    settingMeta: { flex: 1, paddingRight: 10 },
    settingTitle: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    settingSub: {
      color: colors.text.secondary,
      fontSize: 11,
      marginTop: 2,
    },
    rowRightPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    },
    rowRightPillText: {
      color: colors.text.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    segmentedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: 10,
      padding: 2,
      gap: 2,
      height: 36,
    },
    segBtn: {
      height: 32,
      paddingHorizontal: 10,
      minWidth: 48,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segBtnActive: {
      backgroundColor: colors.accent.purple,
    },
    segBtnText: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
    },
    segBtnTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    pinFormBox: {
      padding: 12,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
      gap: 8,
    },
    pinFormLabel: { color: colors.text.secondary, fontSize: 11, fontWeight: '700' },
    pinInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    pinInput: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
      paddingHorizontal: 12,
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 4,
      textAlign: 'center',
    },
    savePinBtn: {
      paddingHorizontal: 12,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.accent.purple,
      alignItems: 'center',
      justifyContent: 'center',
    },
    savePinBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    removePinBtn: {
      paddingHorizontal: 12,
      height: 40,
      borderRadius: 10,
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    removePinBtnText: { color: colors.accent.red, fontSize: 12, fontWeight: '700' },
    budgetInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    budgetTextInput: {
      width: 80,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      paddingHorizontal: 10,
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
    },
    saveBudgetBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.accent.purple,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    accentSwatch: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    accentSwatchSelected: {
      borderColor: '#FFFFFF',
      transform: [{ scale: 1.15 }],
    },
    aboutFooter: {
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 20,
      gap: 6,
    },
    aboutLogo: {
      width: 56,
      height: 56,
      borderRadius: 16,
      marginBottom: 8,
    },
    aboutAppName: {
      color: colors.text.primary,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    aboutVersion: {
      color: colors.text.tertiary,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 12,
    },
    aboutBadgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 16,
    },
    aboutBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.accent.alpha(isDark ? 0.1 : 0.06),
      borderWidth: 0.5,
      borderColor: colors.accent.alpha(isDark ? 0.2 : 0.12),
    },
    aboutBadgeText: {
      color: colors.text.secondary,
      fontSize: 10,
      fontWeight: '700',
    },
    aboutCheckUpdateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.accent.alpha(isDark ? 0.12 : 0.08),
      borderWidth: 0.5,
      borderColor: colors.accent.alpha(isDark ? 0.25 : 0.15),
      marginBottom: 12,
    },
    aboutCheckUpdateText: {
      color: colors.accent.purple,
      fontSize: 13,
      fontWeight: '700',
    },
    aboutMadeWith: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '500',
    },
  });
