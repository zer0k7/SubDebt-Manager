import { useTheme } from '../../hooks/useTheme';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, AppState, TextInput, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '../../components/AmbientBackground';
import { GlassButton } from '../../components/GlassButton';
import { AppPopup } from '../../components/AppPopup';
import { CurrencyPicker } from '../../components/CurrencyPicker';
import { GlassInput } from '../../components/GlassInput';
import { UpdatePrompt } from '../../components/UpdatePrompt';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { exportAllData } from '../../utils/exportData';
import { checkForUpdate, UpdateInfo } from '../../utils/updateChecker';
import { pickAndImportData, clearAllData, importDataObj } from '../../utils/importData';
import { exportSpendingCSV } from '../../utils/backupRestore';
import { useDebts } from '../../hooks/useDebts';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { useCredits } from '../../hooks/useCredits';
import { useDailySpending } from '../../hooks/useDailySpending';
import { useCurrency } from '../../hooks/useCurrency';
import { useBudget } from '../../hooks/useBudget';
import { storage } from '../../storage/mmkv';
import { STORAGE_KEYS } from '../../storage/keys';
import { hasBiometrics, toggleBiometricAuth } from '../../utils/authHelpers';
import Constants from 'expo-constants';
import { CURRENCIES, getCurrencyByCode } from '../../constants/currencies';

const categoriesList = ['Food', 'Groceries', 'Travel', 'Shopping', 'Bills', 'Recharge', 'Study', 'Health', 'Personal Care', 'Home', 'Entertainment', 'Gifts', 'Other'];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Food': return 'restaurant-outline';
    case 'Groceries': return 'cart-outline';
    case 'Travel': return 'car-outline';
    case 'Shopping': return 'bag-handle-outline';
    case 'Bills': return 'document-text-outline';
    case 'Recharge': return 'flash-outline';
    case 'Study': return 'book-outline';
    case 'Health': return 'heart-outline';
    case 'Personal Care': return 'sparkles-outline';
    case 'Home': return 'home-outline';
    case 'Entertainment': return 'film-outline';
    case 'Gifts': return 'gift-outline';
    default: return 'ellipse-outline';
  }
};

export default function SettingsModal() {
  const { colors, mode, setMode, accentColor, setAccentColor, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  
  const { refresh: refreshDebts } = useDebts();
  const { refresh: refreshSubs } = useSubscriptions();
  const { refresh: refreshCredits } = useCredits();
  const { entries: spendingEntries, refresh: refreshSpending } = useDailySpending();
  const { currency, setCurrency: setSelectedCurrency } = useCurrency();
  const { budget, setBudget, setCategoryLimit, refresh: refreshBudget } = useBudget();

  const quickCurrencies = React.useMemo(() => {
    const popularCodes = ['USD', 'EUR', 'GBP', 'INR'];
    const codes = new Set<string>();
    codes.add(currency.code);
    popularCodes.forEach(code => {
      if (codes.size < 4) {
        codes.add(code);
      }
    });
    return Array.from(codes).map(code => getCurrencyByCode(code));
  }, [currency.code]);
  
  const [exporting, setExporting] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [biometricsSupported, setBiometricsSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [categoryLimitsInput, setCategoryLimitsInput] = useState<Record<string, string>>({});
  const [categoryLimitsExpanded, setCategoryLimitsExpanded] = useState(false);

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [dailyReminderTime, setDailyReminderTime] = useState('20:00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // New Customization States
  const [privacyMode, setPrivacyMode] = useState(false);
  const [defaultLaunchTab, setDefaultLaunchTab] = useState('home');
  const [hapticsLevel, setHapticsLevel] = useState('medium');
  const [warningThreshold, setWarningThreshold] = useState('80');

  useEffect(() => {
    storage.getString('privacy_mode_enabled').then((val) => setPrivacyMode(val === 'true'));
    storage.getString('default_launch_tab').then((val) => setDefaultLaunchTab(val || 'home'));
    storage.getString('haptic_feedback_level').then((val) => setHapticsLevel(val || 'medium'));
    storage.getString('app_accent_color').then((val) => {
      if (val && ['blue', 'green', 'purple', 'amber', 'red'].includes(val)) {
        setAccentColor(val as any);
      }
    });
    storage.getString('budget_warning_threshold').then((val) => setWarningThreshold(val || '80'));
  }, []);

  useEffect(() => {
    if (budget && budget.amount > 0) {
      setBudgetInput(budget.amount.toString());
    } else {
      setBudgetInput('');
    }
  }, [budget.amount]);

  useEffect(() => {
    if (budget && budget.categoryLimits) {
      const inputs: Record<string, string> = {};
      Object.keys(budget.categoryLimits).forEach((cat) => {
        inputs[cat] = budget.categoryLimits[cat] ? budget.categoryLimits[cat].toString() : '';
      });
      setCategoryLimitsInput(inputs);
    }
  }, [budget]);

  const handleSaveCategoryLimit = (category: string, text: string) => {
    setCategoryLimitsInput(prev => ({ ...prev, [category]: text }));
    const amount = text.trim() === '' || isNaN(Number(text)) ? 0 : Number(text);
    setCategoryLimit(category, amount);
  };

  // Popup state
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState<any>({});

  useEffect(() => {
    hasBiometrics().then(setBiometricsSupported);
    storage.getString(STORAGE_KEYS.IS_BIOMETRIC_AUTH_ENABLED).then((val) => {
      setBiometricEnabled(val === 'true');
    });

    storage.getString('daily_reminder_enabled').then(async (val) => {
      const isStoredEnabled = val === 'true';
      if (isStoredEnabled) {
        try {
          const Notifications = require('expo-notifications');
          const { status } = await Notifications.getPermissionsAsync();
          if (status === 'granted') {
            setDailyReminderEnabled(true);
          } else {
            setDailyReminderEnabled(false);
            storage.set('daily_reminder_enabled', 'false');
          }
        } catch (e) {
          setDailyReminderEnabled(isStoredEnabled);
        }
      } else {
        setDailyReminderEnabled(false);
      }
    });

    storage.getString('daily_reminder_time').then((val) => {
      setDailyReminderTime(val || '20:00');
    });
  }, []);

  const handleSaveBudget = () => {
    const trimmed = budgetInput.trim();
    const amount = trimmed === '' ? 0 : parseFloat(trimmed);
    if (!isNaN(amount) && amount >= 0) {
      setBudget(amount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (amount === 0) {
        showPopup({
          title: 'Budget Removed',
          message: 'Your monthly budget limit has been successfully removed.',
          icon: 'trash-outline',
          iconColor: colors.accent.red,
          confirmText: 'Got it',
          onConfirm: closePopup,
        });
      } else {
        showPopup({
          title: 'Budget Updated',
          message: `Your monthly budget has been set to ${currency.symbol}${amount.toString()}.`,
          icon: 'checkmark-circle-outline',
          iconColor: '#66BB6A',
          confirmText: 'Great',
          onConfirm: closePopup,
        });
      }
    } else {
      showPopup({
        title: 'Invalid Input',
        message: 'Please enter a valid positive budget amount.',
        icon: 'warning-outline',
        iconColor: colors.accent.amber,
        confirmText: 'Retry',
        onConfirm: closePopup,
      });
    }
  };

  const handleToggleBiometrics = async () => {
    const newVal = !biometricEnabled;
    const success = await toggleBiometricAuth(newVal);
    if (success) {
      setBiometricEnabled(newVal);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleToggleDailyReminder = async () => {
    const newVal = !dailyReminderEnabled;
    setDailyReminderEnabled(newVal);
    storage.set('daily_reminder_enabled', newVal ? 'true' : 'false');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const { rescheduleDailyReminder, registerForPushNotificationsAsync } = require('../../utils/notificationHelpers');
    if (newVal) {
      const token = await registerForPushNotificationsAsync();
      if (token === null) {
        showPopup({
          title: 'Permissions Required',
          message: 'Please enable notification permissions in your system settings to receive reminders.',
          icon: 'notifications-off-outline',
          iconColor: colors.accent.red,
          confirmText: 'OK',
          onConfirm: () => {
            closePopup();
            setDailyReminderEnabled(false);
            storage.set('daily_reminder_enabled', 'false');
          }
        });
        return;
      }
    }
    await rescheduleDailyReminder();
  };

  const handleTimeConfirm = async (date: Date) => {
    setShowTimePicker(false);
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hour}:${minute}`;
    setDailyReminderTime(timeStr);
    storage.set('daily_reminder_time', timeStr);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const { rescheduleDailyReminder } = require('../../utils/notificationHelpers');
    await rescheduleDailyReminder();
  };

  const formatTimeAMPM = (time24: string) => {
    const parts = time24.split(':');
    if (parts.length !== 2) return time24;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minute} ${ampm}`;
  };

  const handleTogglePrivacyMode = () => {
    const newVal = !privacyMode;
    setPrivacyMode(newVal);
    storage.set('privacy_mode_enabled', newVal ? 'true' : 'false');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectLaunchTab = (tabKey: string) => {
    setDefaultLaunchTab(tabKey);
    storage.set('default_launch_tab', tabKey);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectHaptics = (level: string) => {
    setHapticsLevel(level);
    storage.set('haptic_feedback_level', level);
    if (level === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else if (level === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (level === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectAccent = (colorKey: string) => {
    setAccentColor(colorKey as any);
    storage.set('app_accent_color', colorKey);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectThreshold = (threshold: string) => {
    setWarningThreshold(threshold);
    storage.set('budget_warning_threshold', threshold);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const showPopup = (config: any) => {
    setPopupConfig(config);
    setPopupVisible(true);
  };

  const closePopup = () => setPopupVisible(false);

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const info = await checkForUpdate(true);
      if (info?.available) {
        setUpdateInfo(info);
        setShowUpdatePrompt(true);
      } else {
        showPopup({
          title: 'Up to date',
          message: 'You are already running the latest version of SubDebt.',
          icon: 'checkmark-circle-outline',
          iconColor: '#66BB6A',
          confirmText: 'Great',
          onConfirm: closePopup,
        });
      }
    } catch {
      showPopup({
        title: 'Update Check Failed',
        message: 'Could not connect to GitHub to check for updates.',
        icon: 'warning-outline',
        iconColor: colors.accent.red,
        confirmText: 'Dismiss',
        onConfirm: closePopup,
      });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    const success = await exportAllData();
    setExporting(false);
    
    showPopup({
      title: success ? 'Export Successful' : 'Export Failed',
      message: success ? 'Your data has been successfully exported.' : 'There was a problem exporting your data.',
      icon: success ? 'checkmark-circle-outline' : 'close-circle-outline',
      iconColor: success ? '#66BB6A' : colors.accent.red,
      confirmText: 'Done',
      onConfirm: closePopup,
    });
  };

  const handleExportCSV = async () => {
    if (!spendingEntries || spendingEntries.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showPopup({
        title: 'No Spending Records',
        message: 'You have no daily spending entries to export in your ledger.',
        icon: 'warning-outline',
        iconColor: colors.accent.amber,
        confirmText: 'OK',
        onConfirm: closePopup,
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExportingCSV(true);
    const success = await exportSpendingCSV(spendingEntries, currency.code);
    setExportingCSV(false);

    showPopup({
      title: success ? 'Export Successful' : 'Export Failed',
      message: success ? 'Your spending ledger has been exported to a standard CSV spreadsheet file.' : 'There was an issue exporting your spending ledger to CSV.',
      icon: success ? 'checkmark-circle-outline' : 'close-circle-outline',
      iconColor: success ? '#66BB6A' : colors.accent.red,
      confirmText: 'Done',
      onConfirm: closePopup,
    });
  };

  const handleImportMerge = async () => {
    setImporting(true);
    const result = await pickAndImportData('merge');
    setImporting(false);
    
    if (result.success) { 
      refreshDebts(); refreshSubs(); refreshCredits(); refreshSpending(); refreshBudget();
      showPopup({
        title: 'Import Successful',
        message: `Merged ${result.subscriptionsCount} subs, ${result.creditsCount} lent, ${result.debtsCount} debts, ${result.spendingCount} spending entries.`,
        icon: 'checkmark-circle-outline',
        iconColor: '#66BB6A',
        confirmText: 'Done',
        onConfirm: closePopup,
      });
    } else if (result.error !== 'User cancelled') {
      showPopup({
        title: 'Import Failed',
        message: result.error || 'Unknown error',
        icon: 'close-circle-outline',
        iconColor: colors.accent.red,
        confirmText: 'Close',
        onConfirm: closePopup,
      });
    }
  };

  const handleImportReplace = () => {
    showPopup({
      title: 'Replace All Data?',
      message: 'This will permanently DELETE all existing data and replace it. This cannot be undone.',
      icon: 'warning-outline',
      iconColor: colors.accent.red,
      cancelText: 'Cancel',
      confirmText: 'Replace',
      isDestructive: true,
      onCancel: closePopup,
      onConfirm: async () => {
        closePopup();
        setImporting(true);
        const result = await pickAndImportData('replace');
        setImporting(false);
        if (result.success) { 
          refreshDebts(); refreshSubs(); refreshCredits(); refreshSpending(); refreshBudget();
          setTimeout(() => showPopup({
            title: 'Import Successful',
            message: `Replaced with ${result.subscriptionsCount} subs, ${result.creditsCount} lent, ${result.debtsCount} debts, ${result.spendingCount} spending entries.`,
            icon: 'checkmark-circle-outline',
            iconColor: '#66BB6A',
            confirmText: 'Done',
            onConfirm: closePopup,
          }), 400);
        } else if (result.error !== 'User cancelled') {
          setTimeout(() => showPopup({
            title: 'Import Failed',
            message: result.error || 'Unknown error',
            icon: 'close-circle-outline',
            iconColor: colors.accent.red,
            confirmText: 'Close',
            onConfirm: closePopup,
          }), 400);
        }
      }
    });
  };

  const handleResetOnboarding = async () => {
    await storage.set(STORAGE_KEYS.HAS_SEEN_ONBOARDING, 'false');
    showPopup({
      title: 'Onboarding Reset',
      message: 'Onboarding slides will be shown next time you open the app.',
      icon: 'refresh-circle-outline',
      iconColor: colors.accent.blue,
      confirmText: 'OK',
      onConfirm: closePopup,
    });
  };

  const handleClearAll = () => {
    showPopup({
      title: 'Clear All Data?',
      message: 'This will permanently delete ALL subscriptions, debts, credits, and spending. This action cannot be undone.',
      icon: 'alert-circle-outline',
      iconColor: colors.accent.red,
      cancelText: 'Cancel',
      confirmText: 'Delete Everything',
      isDestructive: true,
      onCancel: closePopup,
      onConfirm: () => {
        closePopup();
        setTimeout(() => showPopup({
          title: 'Are you sure?',
          message: 'This is your last chance. All data will be lost forever.',
          icon: 'warning-outline',
          iconColor: colors.accent.red,
          cancelText: 'Cancel',
          confirmText: 'Yes, Delete',
          isDestructive: true,
          onCancel: closePopup,
          onConfirm: async () => {
            await clearAllData(); refreshDebts(); refreshSubs(); refreshCredits(); refreshSpending(); refreshBudget();
            closePopup();
            setTimeout(() => showPopup({
              title: 'Data Cleared',
              message: 'All your data has been successfully deleted.',
              icon: 'trash-outline',
              iconColor: '#66BB6A',
              confirmText: 'Done',
              onConfirm: closePopup,
            }), 400);
          }
        }), 400);
      }
    });
  };

  const handleCurrencySelect = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCurrency(code);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Monthly Budget */}
        <Text style={styles.sectionTitle}>MONTHLY BUDGET</Text>
        <View style={styles.card}>
          <View style={styles.cardHeaderWithIcon}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(79, 195, 247, 0.12)' : 'rgba(2, 132, 199, 0.08)' }]}>
              <Ionicons name="wallet-outline" size={20} color={colors.accent.blue} />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={styles.premiumCardTitle}>Monthly spending limit</Text>
              <Text style={styles.cardDescMini}>Set a monthly threshold to keep your outflow on track.</Text>
            </View>
          </View>
          <View style={styles.budgetInputRow}>
            <View style={styles.premiumInputContainer}>
              <Text style={styles.premiumInputPrefix}>{currency.symbol}</Text>
              <TextInput 
                style={styles.premiumTextInput}
                placeholder="0.00" 
                placeholderTextColor={colors.text.placeholder}
                value={budgetInput} 
                onChangeText={setBudgetInput} 
                keyboardType="decimal-pad"
              />
            </View>
            <TouchableOpacity 
              style={[styles.saveBudgetBtnRound, budgetInput ? styles.saveBudgetBtnRoundActive : null]} 
              onPress={handleSaveBudget}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="arrow-forward" 
                size={18} 
                color={budgetInput ? "#fff" : (isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)")} 
              />
            </TouchableOpacity>
          </View>
          {budget.amount > 0 && (
            <TouchableOpacity 
              style={styles.removeBudgetBtn}
              onPress={() => {
                showPopup({
                  title: 'Remove Budget?',
                  message: 'Are you sure you want to remove your monthly budget? This will also hide category limits.',
                  icon: 'trash-outline',
                  iconColor: colors.accent.red,
                  cancelText: 'Cancel',
                  confirmText: 'Remove',
                  isDestructive: true,
                  onCancel: closePopup,
                  onConfirm: () => {
                    closePopup();
                    setBudget(0);
                    setBudgetInput('');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setTimeout(() => {
                      showPopup({
                        title: 'Budget Removed',
                        message: 'Your monthly budget limit has been successfully removed.',
                        icon: 'checkmark-circle-outline',
                        iconColor: '#66BB6A',
                        confirmText: 'Got it',
                        onConfirm: closePopup,
                      });
                    }, 400);
                  }
                });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={15} color={colors.accent.red} />
              <Text style={styles.removeBudgetBtnText}>Remove Budget</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Budget Limits */}
        {budget.amount > 0 && (
          <>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategoryLimitsExpanded(prev => !prev);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>CATEGORY LIMITS</Text>
              <View style={styles.collapsibleChevronWrap}>
                <Ionicons
                  name={categoryLimitsExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.text.muted}
                />
              </View>
            </TouchableOpacity>
            {categoryLimitsExpanded && (
              <View style={styles.card}>
                <Text style={styles.cardDesc}>Set individual spending limits for each category.</Text>
                <View style={styles.categoryLimitsGrid}>
                  {categoriesList.map((cat) => {
                    const icon = getCategoryIcon(cat);
                    const hasLimit = parseFloat(categoryLimitsInput[cat] || '0') > 0;
                    return (
                      <View 
                        key={cat} 
                        style={[
                          styles.categoryLimitTile,
                          hasLimit && styles.categoryLimitTileActive
                        ]}
                      >
                        <View style={styles.categoryTileHeader}>
                          <View style={[
                            styles.categoryTileIconWrap,
                            { backgroundColor: hasLimit ? (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(2, 132, 199, 0.1)') : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)') }
                          ]}>
                            <Ionicons 
                              name={icon as any} 
                              size={13} 
                              color={hasLimit ? colors.accent.blue : colors.text.secondary} 
                            />
                          </View>
                          <Text style={[styles.categoryTileName, hasLimit && styles.categoryTileNameActive]} numberOfLines={1}>
                            {cat}
                          </Text>
                        </View>
                        <View style={[
                          styles.categoryTileInputContainer,
                          hasLimit && styles.categoryTileInputContainerActive
                        ]}>
                          <Text style={styles.categoryTileCurrencyPrefix}>{currency.symbol}</Text>
                          <TextInput
                            style={styles.categoryTileInput}
                            placeholder="0.00"
                            placeholderTextColor={colors.text.placeholder}
                            value={categoryLimitsInput[cat] || ''}
                            onChangeText={(text) => handleSaveCategoryLimit(cat, text)}
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* Appearance Section */}
        <Text style={styles.sectionTitle}>APPEARANCE</Text>
        <View style={styles.card}>
          <Text style={styles.cardDesc}>Choose your preferred app theme.</Text>
          <View style={styles.themeGrid}>
            {[
              { id: 'light', icon: 'sunny-outline', label: 'Light' },
              { id: 'system', icon: 'settings-outline', label: 'System' },
              { id: 'dark', icon: 'moon-outline', label: 'Dark' },
            ].map((t) => {
              const isActive = mode === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={styles.themeOption}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMode(t.id as any);
                  }}
                  activeOpacity={0.8}
                >
                  {/* Theme Mock Card Preview */}
                  <View style={[
                    styles.mockCard, 
                    t.id === 'light' && styles.mockCardLight,
                    t.id === 'dark' && styles.mockCardDark,
                    t.id === 'system' && styles.mockCardSystem,
                    isActive && styles.mockCardActive
                  ]}>
                    {t.id === 'system' ? (
                      // Split theme preview for system theme
                      <View style={styles.systemSplitRow}>
                        {/* Light Half */}
                        <View style={[styles.systemHalf, styles.systemHalfLight]}>
                          <View style={styles.mockHeaderLightMini} />
                          <View style={styles.mockItemLightMini} />
                          <View style={styles.mockItemLightMini} />
                        </View>
                        {/* Dark Half */}
                        <View style={[styles.systemHalf, styles.systemHalfDark]}>
                          <View style={styles.mockHeaderDarkMini} />
                          <View style={styles.mockItemDarkMini} />
                          <View style={styles.mockItemDarkMini} />
                        </View>
                      </View>
                    ) : (
                      // Single theme previews for light/dark
                      <View style={styles.mockInside}>
                        <View style={t.id === 'light' ? styles.mockHeaderLight : styles.mockHeaderDark}>
                          <View style={styles.mockAvatar} />
                          <View style={styles.mockHeaderBar} />
                        </View>
                        <View style={styles.mockContent}>
                          <View style={[styles.mockRow, t.id === 'light' ? styles.mockRowLight : styles.mockRowDark]}>
                            <View style={[styles.mockIcon, { backgroundColor: t.id === 'light' ? '#0284c7' : '#4FC3F7' }]} />
                            <View style={[styles.mockBar, { backgroundColor: t.id === 'light' ? '#cbd5e1' : 'rgba(255,255,255,0.3)' }]} />
                            <View style={[styles.mockPill, { backgroundColor: t.id === 'light' ? '#16a34a' : '#66BB6A' }]} />
                          </View>
                          <View style={[styles.mockRow, t.id === 'light' ? styles.mockRowLight : styles.mockRowDark]}>
                            <View style={[styles.mockIcon, { backgroundColor: t.id === 'light' ? '#7c3aed' : '#7c3aed' }]} />
                            <View style={[styles.mockBar, { backgroundColor: t.id === 'light' ? '#cbd5e1' : 'rgba(255,255,255,0.3)' }]} />
                            <View style={[styles.mockPill, { backgroundColor: t.id === 'light' ? '#dc2626' : '#EF5350' }]} />
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Floating checkmark indicator if active */}
                    {isActive && (
                      <View style={styles.activeIndicatorBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.accent.blue} />
                      </View>
                    )}
                  </View>

                  {/* Label and Icon */}
                  <View style={styles.themeLabelRow}>
                    <Ionicons 
                      name={t.icon as any} 
                      size={12} 
                      color={isActive ? colors.accent.blue : colors.text.muted} 
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.themeLabelText, isActive && styles.themeLabelTextActive]}>
                      {t.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Accent Color Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ACCENT COLOR THEME</Text>
          <Text style={styles.cardDesc}>Select a high-contrast accent color for buttons and highlights.</Text>
          <View style={styles.colorPaletteGrid}>
            {[
              { id: 'blue', color: '#0284c7', label: 'Sapphire' },
              { id: 'green', color: '#16a34a', label: 'Emerald' },
              { id: 'purple', color: '#7c3aed', label: 'Violet' },
              { id: 'amber', color: '#d97706', label: 'Amber' },
              { id: 'red', color: '#dc2626', label: 'Crimson' },
            ].map((c) => {
              const isSelected = accentColor === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.colorTile,
                    { borderColor: c.color },
                    isSelected && { backgroundColor: `${c.color}25`, borderWidth: 2 }
                  ]}
                  onPress={() => handleSelectAccent(c.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.colorCircle, { backgroundColor: c.color }]} />
                  <Text style={[styles.colorLabel, isSelected && { color: c.color, fontWeight: '700' }]}>{c.label}</Text>
                  {isSelected && <Ionicons name="checkmark" size={12} color={c.color} style={{ marginTop: 2 }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Display & Launch Preferences Section */}
        <Text style={styles.sectionTitle}>DISPLAY & PREFERENCES</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Default Startup Screen</Text>
          <Text style={styles.cardDesc}>Choose which screen opens automatically when you launch the app.</Text>
          <View style={styles.optionPillGrid}>
            {[
              { id: 'home', label: 'Home', icon: 'home-outline' },
              { id: 'subscriptions', label: 'Subs', icon: 'card-outline' },
              { id: 'owed', label: 'Owed', icon: 'swap-horizontal-outline' },
              { id: 'spending', label: 'Spending', icon: 'receipt-outline' },
            ].map((t) => {
              const isSelected = defaultLaunchTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.optionPill, isSelected && styles.optionPillActive]}
                  onPress={() => handleSelectLaunchTab(t.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={t.icon as any} size={14} color={isSelected ? colors.accent.blue : colors.text.secondary} />
                  <Text style={[styles.optionPillText, isSelected && styles.optionPillTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', marginVertical: 14 }} />

          {/* Privacy Mode Toggle */}
          <TouchableOpacity
            style={styles.securityRowPremium}
            onPress={handleTogglePrivacyMode}
            activeOpacity={0.7}
          >
            <View style={styles.securityLeftPremium}>
              <View style={[styles.securityIconBox, { backgroundColor: privacyMode ? 'rgba(79,195,247,0.12)' : 'rgba(255,255,255,0.05)' }]}>
                <Ionicons 
                  name={privacyMode ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={privacyMode ? colors.accent.blue : colors.text.secondary} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.securityLabelPremium}>Privacy Mode (Mask Balances)</Text>
                <Text style={styles.cardDescMini}>Hide sensitive total amounts on Home screen when in public.</Text>
              </View>
            </View>
            <View style={[
              styles.toggleSwitchPremium, 
              privacyMode && styles.toggleSwitchPremiumActive
            ]}>
              <View style={[
                styles.toggleHandlePremium,
                privacyMode && styles.toggleHandlePremiumActive
              ]} />
            </View>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', marginVertical: 14 }} />

          {/* Haptic Feedback Level */}
          <Text style={styles.cardTitle}>Haptic Feedback Intensity</Text>
          <Text style={styles.cardDesc}>Adjust tactile vibration feedback for button taps.</Text>
          <View style={styles.optionPillGrid}>
            {[
              { id: 'off', label: 'Off', icon: 'volume-mute-outline' },
              { id: 'light', label: 'Light', icon: 'phone-portrait-outline' },
              { id: 'medium', label: 'Medium', icon: 'hand-left-outline' },
              { id: 'heavy', label: 'Heavy', icon: 'pulse-outline' },
            ].map((h) => {
              const isSelected = hapticsLevel === h.id;
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.optionPill, isSelected && styles.optionPillActive]}
                  onPress={() => handleSelectHaptics(h.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={h.icon as any} size={14} color={isSelected ? colors.accent.blue : colors.text.secondary} />
                  <Text style={[styles.optionPillText, isSelected && styles.optionPillTextActive]}>{h.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Security Section */}
        {biometricsSupported && (
          <>
            <Text style={styles.sectionTitle}>APP SECURITY</Text>
            <View style={styles.card}>
              {/* Security Mockup Panel */}
              <View style={[
                styles.securityVisualPanel,
                biometricEnabled ? styles.securityVisualPanelActive : null
              ]}>
                <View style={[
                  styles.securityVisualLockCircle,
                  biometricEnabled ? styles.securityVisualLockCircleActive : null
                ]}>
                  <Ionicons 
                    name={biometricEnabled ? "shield-checkmark" : "lock-open-outline"} 
                    size={36} 
                    color={biometricEnabled ? colors.accent.green : colors.text.muted} 
                  />
                </View>
                <View style={styles.securityVisualInfo}>
                  <Text style={[styles.securityVisualStatusText, biometricEnabled && styles.securityVisualStatusActive]}>
                    {biometricEnabled ? "BIOMETRICS SECURED" : "SECURITY PASSED / OPEN"}
                  </Text>
                  <Text style={styles.securityVisualDesc}>
                    {biometricEnabled ? "Encrypted offline logs requiring biometric verification on launch." : "Instant access enabled. Ledgers are visible to anyone opening the app."}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.securityRowPremium}
                onPress={handleToggleBiometrics}
                activeOpacity={0.7}
              >
                <View style={styles.securityLeftPremium}>
                  <View style={[styles.securityIconBox, { backgroundColor: biometricEnabled ? 'rgba(79,195,247,0.12)' : 'rgba(255,255,255,0.05)' }]}>
                    <Ionicons 
                      name="finger-print-outline" 
                      size={20} 
                      color={biometricEnabled ? colors.accent.blue : colors.text.secondary} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securityLabelPremium}>FaceID / Fingerprint Lock</Text>
                    <Text style={styles.cardDescMini}>Toggle biometric authentication lock on startup.</Text>
                  </View>
                </View>
                <View style={[
                  styles.toggleSwitchPremium, 
                  biometricEnabled && styles.toggleSwitchPremiumActive
                ]}>
                  <View style={[
                    styles.toggleHandlePremium,
                    biometricEnabled && styles.toggleHandlePremiumActive
                  ]} />
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* System Reminders */}
        <Text style={styles.sectionTitle}>SYSTEM REMINDERS</Text>
        <View style={styles.card}>
          <View style={styles.cardHeaderWithIcon}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255, 179, 0, 0.12)' : 'rgba(217, 119, 6, 0.08)' }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.accent.amber || '#f59e0b'} />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={styles.premiumCardTitle}>Local Reminders</Text>
              <Text style={styles.cardDescMini}>Receive dynamic notifications for due debts and subscriptions.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.securityRowPremium}
            onPress={handleToggleDailyReminder}
            activeOpacity={0.7}
          >
            <View style={styles.securityLeftPremium}>
              <View style={[styles.securityIconBox, { backgroundColor: dailyReminderEnabled ? 'rgba(79,195,247,0.12)' : 'rgba(255,255,255,0.05)' }]}>
                <Ionicons 
                  name="calendar-outline" 
                  size={20} 
                  color={dailyReminderEnabled ? colors.accent.blue : colors.text.secondary} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.securityLabelPremium}>Daily Spending Reminder</Text>
                <Text style={styles.cardDescMini}>Get reminded daily to log your expenses and review your budget.</Text>
              </View>
            </View>
            <View style={[
              styles.toggleSwitchPremium, 
              dailyReminderEnabled && styles.toggleSwitchPremiumActive
            ]}>
              <View style={[
                styles.toggleHandlePremium,
                dailyReminderEnabled && styles.toggleHandlePremiumActive
              ]} />
            </View>
          </TouchableOpacity>

          {dailyReminderEnabled && (
            <>
              <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', marginVertical: 12 }} />
              <TouchableOpacity
                style={styles.securityRowPremium}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.securityLeftPremium}>
                  <View style={[styles.securityIconBox, { backgroundColor: 'rgba(79,195,247,0.12)' }]}>
                    <Ionicons 
                      name="time-outline" 
                      size={20} 
                      color={colors.accent.blue} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securityLabelPremium}>Reminder Time</Text>
                    <Text style={styles.cardDescMini}>Choose when you want to receive your daily check-in.</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: colors.accent.blue, fontWeight: '700', fontSize: 15 }}>
                    {formatTimeAMPM(dailyReminderTime)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.muted} style={{ marginLeft: 6 }} />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Backup & Restore */}
        <Text style={styles.sectionTitle}>BACKUP & RESTORE</Text>
        <View style={styles.card}>
          <View style={styles.cardHeaderWithIcon}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(79, 195, 247, 0.12)' : 'rgba(2, 132, 199, 0.08)' }]}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.accent.blue} />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={styles.premiumCardTitle}>Local Data Export</Text>
              <Text style={styles.cardDescMini}>Export your ledgers and spending records offline locally on your device.</Text>
            </View>
          </View>

          <View style={styles.importRowPremium}>
            <TouchableOpacity 
              style={styles.importChoiceCard} 
              onPress={handleExport} 
              disabled={exporting}
              activeOpacity={0.8}
            >
              {exporting ? (
                <ActivityIndicator color={colors.accent.blue} />
              ) : (
                <>
                  <View style={[styles.importChoiceIconWrap, { backgroundColor: 'rgba(79,195,247,0.1)' }]}>
                    <Ionicons name="document-text-outline" size={18} color={colors.accent.blue} />
                  </View>
                  <Text style={styles.importChoiceLabel}>JSON Backup</Text>
                  <Text style={styles.importChoiceDesc}>Export entire database for full system migration and backup.</Text>
                  <View style={styles.importSafeBadge}>
                    <Ionicons name="checkmark-circle" size={10} color={colors.accent.green} style={{ marginRight: 2 }} />
                    <Text style={styles.importSafeText}>Full Ledger</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.importChoiceCard} 
              onPress={handleExportCSV} 
              disabled={exportingCSV}
              activeOpacity={0.8}
            >
              {exportingCSV ? (
                <ActivityIndicator color={colors.accent.green} />
              ) : (
                <>
                  <View style={[styles.importChoiceIconWrap, { backgroundColor: 'rgba(102,187,106,0.1)' }]}>
                    <Ionicons name="grid-outline" size={18} color={colors.accent.green} />
                  </View>
                  <Text style={[styles.importChoiceLabel, { color: colors.accent.green }]}>Excel CSV</Text>
                  <Text style={styles.importChoiceDesc}>Export spreadsheet-ready CSV log of daily transactions.</Text>
                  <View style={[styles.importSafeBadge, { backgroundColor: isDark ? 'rgba(102,187,106,0.15)' : 'rgba(22,163,74,0.06)' }]}>
                    <Ionicons name="checkmark-circle" size={10} color={colors.accent.green} style={{ marginRight: 2 }} />
                    <Text style={styles.importSafeText}>Spreadsheet</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderWithIcon}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.12)' : 'rgba(124, 58, 237, 0.08)' }]}>
              <Ionicons name="cloud-download-outline" size={20} color={colors.accent.purple} />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={[styles.premiumCardTitle, { color: colors.accent.purple }]}>Local Data Import</Text>
              <Text style={styles.cardDescMini}>Restore files or merge with existing local logs.</Text>
            </View>
          </View>
          <View style={styles.importRowPremium}>
            <TouchableOpacity 
              style={styles.importChoiceCard} 
              onPress={handleImportMerge} 
              disabled={importing}
              activeOpacity={0.8}
            >
              {importing ? (
                <ActivityIndicator color={colors.accent.blue} />
              ) : (
                <>
                  <View style={[styles.importChoiceIconWrap, { backgroundColor: 'rgba(79,195,247,0.1)' }]}>
                    <Ionicons name="git-merge-outline" size={18} color={colors.accent.blue} />
                  </View>
                  <Text style={styles.importChoiceLabel}>Merge Data</Text>
                  <Text style={styles.importChoiceDesc}>Safely append to current ledgers without deleting anything.</Text>
                  <View style={styles.importSafeBadge}>
                    <Ionicons name="checkmark-circle" size={10} color={colors.accent.green} style={{ marginRight: 2 }} />
                    <Text style={styles.importSafeText}>Safe Append</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.importChoiceCard, styles.importChoiceCardDanger]} 
              onPress={handleImportReplace} 
              disabled={importing}
              activeOpacity={0.8}
            >
              {importing ? (
                <ActivityIndicator color={colors.accent.red} />
              ) : (
                <>
                  <View style={[styles.importChoiceIconWrap, { backgroundColor: 'rgba(239,83,80,0.1)' }]}>
                    <Ionicons name="refresh-outline" size={18} color={colors.accent.red} />
                  </View>
                  <Text style={[styles.importChoiceLabel, { color: colors.accent.red }]}>Replace All</Text>
                  <Text style={styles.importChoiceDesc}>Completely wipe current records and load backup.</Text>
                  <View style={styles.importDestructiveBadge}>
                    <Ionicons name="warning" size={10} color={colors.accent.red} style={{ marginRight: 2 }} />
                    <Text style={styles.importDestructiveText}>Destructive</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: colors.accent.red }]}>DANGER ZONE</Text>
        <View style={[styles.card, styles.dangerCard]}>
          <View style={styles.dangerHeaderPanel}>
            <View style={styles.dangerHeaderPulseOuter}>
              <View style={styles.dangerHeaderPulse} />
              <Ionicons name="warning" size={16} color={colors.accent.red} style={styles.dangerHeaderIcon} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerHeaderTitle}>Administrative Safe-Guards</Text>
              <Text style={styles.dangerHeaderDesc}>Perform full system wipes or reset onboarding tutorials.</Text>
            </View>
          </View>
          
          <View style={styles.dangerActionsGrid}>
            <TouchableOpacity style={styles.dangerActionTile} onPress={handleResetOnboarding} activeOpacity={0.8}>
              <View style={styles.dangerTileIconWrap}>
                <Ionicons name="refresh-circle" size={24} color={colors.accent.red} />
              </View>
              <Text style={styles.dangerTileLabel}>Reset Onboarding</Text>
              <Text style={styles.dangerTileDesc}>Reshow welcome screen tutorials next time.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.dangerActionTile, styles.dangerActionTileWipe]} onPress={handleClearAll} activeOpacity={0.8}>
              <View style={[styles.dangerTileIconWrap, styles.dangerTileIconWrapWipe]}>
                <Ionicons name="trash" size={20} color="#fff" />
              </View>
              <Text style={[styles.dangerTileLabel, { color: '#ff6b6b' }]}>Pristine Wipe</Text>
              <Text style={styles.dangerTileDesc}>Wipe all debts, credits, settings, and logs forever.</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.aboutBrandingWrap}>
            <View style={styles.aboutLogoContainer}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.aboutLogoImage}
              />
            </View>
            <Text style={styles.aboutAppName}>SubDebt Manager</Text>
            <Text style={styles.aboutAppTagline}>Beautiful Offline Ledger & Installments Tracker</Text>
          </View>

          {/* Premium Meta Grid */}
          <View style={styles.aboutMetaGrid}>
            <View style={styles.aboutMetaPill}>
              <Ionicons name="shield-checkmark" size={12} color={colors.accent.green} />
              <Text style={styles.aboutMetaPillText}>100% Offline</Text>
            </View>
            <View style={styles.aboutMetaPill}>
              <Ionicons name="lock-closed" size={12} color={colors.accent.blue} />
              <Text style={styles.aboutMetaPillText}>Zero Trackers</Text>
            </View>
            <View style={styles.aboutMetaPill}>
              <Ionicons name="hardware-chip" size={12} color={colors.accent.purple} />
              <Text style={styles.aboutMetaPillText}>Local MMKV DB</Text>
            </View>
          </View>

          <View style={styles.aboutDivider} />

          <View style={styles.aboutRowPremium}>
            <View style={styles.aboutRowLeft}>
              <View style={[styles.aboutIconBox, { backgroundColor: isDark ? 'rgba(79,195,247,0.12)' : 'rgba(2,132,199,0.06)' }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.accent.blue} />
              </View>
              <Text style={styles.aboutLabelPremium}>Version</Text>
            </View>
            <Text style={styles.aboutValuePremium}>{Constants.expoConfig?.version || '1.0.0'}</Text>
          </View>

          <TouchableOpacity style={styles.aboutRowPremium} onPress={handleCheckUpdate} disabled={checkingUpdate} activeOpacity={0.7}>
            <View style={styles.aboutRowLeft}>
              <View style={[styles.aboutIconBox, { backgroundColor: 'rgba(102,187,106,0.1)' }]}>
                <Ionicons name="cloud-download-outline" size={18} color={colors.accent.green} />
              </View>
              <Text style={styles.aboutLabelPremium}>Check for Updates</Text>
            </View>
            {checkingUpdate ? (
              <ActivityIndicator size="small" color={colors.accent.blue} />
            ) : (
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            )}
          </TouchableOpacity>

          <View style={styles.aboutRowPremium}>
            <View style={styles.aboutRowLeft}>
              <View style={[styles.aboutIconBox, { backgroundColor: 'rgba(124,58,237,0.1)' }]}>
                <Ionicons name="server-outline" size={18} color={colors.accent.purple} />
              </View>
              <Text style={styles.aboutLabelPremium}>Storage Engine</Text>
            </View>
            <Text style={styles.aboutValuePremium}>MMKV Offline DB</Text>
          </View>

          <View style={[styles.aboutRowPremium, { borderBottomWidth: 0 }]}>
            <View style={styles.aboutRowLeft}>
              <View style={[styles.aboutIconBox, { backgroundColor: 'rgba(255,167,38,0.1)' }]}>
                <Ionicons name="cash-outline" size={18} color="#ffa726" />
              </View>
              <Text style={styles.aboutLabelPremium}>Active Currency</Text>
            </View>
            <Text style={styles.aboutValuePremium}>{currency.flag} {currency.code}</Text>
          </View>
        </View>
        
        <Text style={styles.footerPremium}>Crafted with absolute privacy. No clouds, no trackers.</Text>
      </ScrollView>

      <CurrencyPicker
        visible={showCurrencyPicker}
        selectedCode={currency.code}
        onSelect={handleCurrencySelect}
        onClose={() => setShowCurrencyPicker(false)}
      />

      {updateInfo && (
        <UpdatePrompt
          visible={showUpdatePrompt}
          updateInfo={updateInfo}
          onDismiss={() => setShowUpdatePrompt(false)}
        />
      )}

      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        themeVariant={isDark ? 'dark' : 'light'}
        onConfirm={handleTimeConfirm}
        onCancel={() => setShowTimePicker(false)}
        date={(() => {
          const d = new Date();
          if (dailyReminderTime) {
            const parts = dailyReminderTime.split(':');
            if (parts.length === 2) {
              d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
            }
          }
          return d;
        })()}
      />

      <AppPopup 
        visible={popupVisible}
        title={popupConfig.title}
        message={popupConfig.message}
        icon={popupConfig.icon}
        iconColor={popupConfig.iconColor}
        cancelText={popupConfig.cancelText}
        confirmText={popupConfig.confirmText}
        isDestructive={popupConfig.isDestructive}
        onCancel={popupConfig.onCancel}
        onConfirm={popupConfig.onConfirm}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.glass.card, justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: colors.text.primary, fontSize: 13, fontWeight: '700', letterSpacing: 1, marginTop: 24, marginBottom: 12 },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  collapsibleChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: { backgroundColor: isDark ? 'rgba(30, 30, 45, 0.6)' : colors.glass.buttonSecondary, borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.glass.navBorder, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardDesc: { color: colors.text.secondary, fontSize: 14, marginBottom: 16, lineHeight: 20 },

  // Premium Card Headers & Containers
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  premiumCardTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardDescMini: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },

  // Premium Inputs
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  removeBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239, 83, 80, 0.18)' : 'rgba(220, 38, 38, 0.15)',
    backgroundColor: isDark ? 'rgba(239, 83, 80, 0.06)' : 'rgba(220, 38, 38, 0.04)',
  },
  removeBudgetBtnText: {
    color: colors.accent.red,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  premiumInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: colors.glass.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  premiumInputPrefix: {
    color: colors.accent.blue,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  premiumTextInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveBudgetBtnRound: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBudgetBtnRoundActive: {
    backgroundColor: colors.accent.blue,
  },

  // Category Limits
  categoryLimitsList: {
    marginTop: 8,
  },
  categoryLimitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
  },
  categoryLimitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryLimitName: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryLimitInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    width: 120,
    height: 34,
  },
  categoryLimitCurrencyPrefix: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  categoryLimitInputPremium: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Currency
  currencySelectorPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  currencyLeftPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagBadgeContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
  },
  currencyFlagPremium: {
    fontSize: 22,
  },
  currencyCodePremium: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  currencyNamePremium: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  currencyRightPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  symbolBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencySymbolPremium: {
    color: colors.accent.blue,
    fontSize: 16,
    fontWeight: '700',
  },

  // Security
  securityRowPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityLeftPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  securityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityLabelPremium: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  toggleSwitchPremium: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchPremiumActive: {
    backgroundColor: colors.accent.green,
  },
  toggleHandlePremium: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleHandlePremiumActive: {
    alignSelf: 'flex-end',
  },

  // Notifications
  notificationTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
  notificationTestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  notificationTestIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTestLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  // Backup & Import
  importRowPremium: {
    flexDirection: 'row',
    gap: 12,
  },
  importBtnPremium: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.glass.cardBorder,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importBtnDangerPremium: {
    borderColor: 'rgba(239,83,80,0.15)',
  },
  iconBoxPremium: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  importTextWrapPremium: {
    alignItems: 'center',
  },
  importLabelPremium: {
    color: colors.accent.blue,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  importSubPremium: {
    color: colors.text.muted,
    fontSize: 11,
    textAlign: 'center',
  },

  // Danger Card & Divider
  dangerCard: {
    borderColor: isDark ? 'rgba(239, 83, 80, 0.15)' : 'rgba(220, 38, 38, 0.08)',
    backgroundColor: isDark ? 'rgba(239, 83, 80, 0.02)' : 'rgba(220, 38, 38, 0.01)',
  },
  dangerRowPremium: {
    paddingVertical: 4,
  },
  dangerLeftPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dangerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(239,83,80,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerLabelPremium: {
    color: colors.accent.red,
    fontSize: 15,
    fontWeight: '700',
  },
  dangerDescMini: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  dangerDivider: {
    height: 1,
    backgroundColor: isDark ? 'rgba(239,83,80,0.1)' : 'rgba(220, 38, 38, 0.05)',
    marginVertical: 14,
  },

  // About
  aboutBrandingWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  aboutLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  aboutLogoImage: {
    width: 60,
    height: 60,
    borderRadius: 20,
  },
  aboutAppName: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aboutAppTagline: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  localDataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(102,187,106,0.1)' : 'rgba(22,163,74,0.06)',
    borderColor: isDark ? 'rgba(102,187,106,0.15)' : 'rgba(22,163,74,0.1)',
    borderWidth: 0.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  localDataBadgeText: {
    color: colors.accent.green,
    fontSize: 11,
    fontWeight: '600',
  },
  aboutDivider: {
    height: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    marginVertical: 14,
  },
  aboutRowPremium: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
  },
  aboutLabelPremium: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  aboutValuePremium: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  footerPremium: {
    color: colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },

  // Theme Grid
  themeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    width: '100%',
  },
  themeOption: {
    width: '31%',
    alignItems: 'center',
  },
  mockCard: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)',
    backgroundColor: isDark ? '#141420' : '#f8fafc',
    overflow: 'hidden',
    position: 'relative',
  },
  mockCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: 'rgba(0,0,0,0.06)',
  },
  mockCardDark: {
    backgroundColor: '#0a0a0f',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mockCardSystem: {
    backgroundColor: '#f8fafc',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)',
  },
  mockCardActive: {
    borderColor: colors.accent.blue,
    shadowColor: colors.accent.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  activeIndicatorBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: isDark ? '#0a0a0f' : '#ffffff',
    borderRadius: 10,
    padding: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 10,
  },
  mockInside: {
    flex: 1,
    padding: 6,
  },
  mockHeaderLight: {
    height: 14,
    backgroundColor: '#bae6fd',
    borderRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  mockHeaderDark: {
    height: 14,
    backgroundColor: '#1e1b4b',
    borderRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  mockAvatar: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
    marginRight: 4,
  },
  mockHeaderBar: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  mockContent: {
    flex: 1,
    justifyContent: 'center',
  },
  mockRow: {
    height: 12,
    borderRadius: 3,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 0.5,
  },
  mockRowLight: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0,0,0,0.03)',
  },
  mockRowDark: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.02)',
  },
  mockIcon: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  mockBar: {
    width: 14,
    height: 2.5,
    borderRadius: 1.2,
  },
  mockPill: {
    width: 10,
    height: 4,
    borderRadius: 2,
    marginLeft: 'auto',
  },
  systemSplitRow: {
    flex: 1,
    flexDirection: 'row',
  },
  systemHalf: {
    flex: 1,
    padding: 6,
    justifyContent: 'center',
  },
  systemHalfLight: {
    backgroundColor: '#f8fafc',
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(0,0,0,0.08)',
  },
  systemHalfDark: {
    backgroundColor: '#0a0a0f',
  },
  mockHeaderLightMini: {
    height: 10,
    backgroundColor: '#bae6fd',
    borderRadius: 2,
    marginBottom: 4,
  },
  mockHeaderDarkMini: {
    height: 10,
    backgroundColor: '#1e1b4b',
    borderRadius: 2,
    marginBottom: 4,
  },
  mockItemLightMini: {
    height: 8,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.03)',
    marginBottom: 3,
  },
  mockItemDarkMini: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    marginBottom: 3,
  },
  themeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  themeLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
  },
  themeLabelTextActive: {
    color: colors.accent.blue,
  },

  // Category Limits Redesign
  categoryLimitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  categoryLimitTile: {
    width: '48.5%',
    padding: 10,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
    marginBottom: 10,
    shadowColor: isDark ? 'transparent' : 'rgba(0, 0, 0, 0.03)',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: isDark ? 0 : 0.8,
    shadowRadius: 2,
    elevation: isDark ? 0 : 1.5,
  },
  categoryLimitTileActive: {
    borderColor: colors.accent.blue,
    backgroundColor: isDark ? 'rgba(79, 195, 247, 0.04)' : 'rgba(2, 132, 199, 0.05)',
    shadowColor: isDark ? 'transparent' : colors.accent.blue,
    shadowOpacity: isDark ? 0 : 0.08,
    shadowRadius: 3,
  },
  categoryTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTileIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  categoryTileName: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  categoryTileNameActive: {
    color: colors.text.primary,
  },
  categoryTileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9',
    borderWidth: 0.5,
    borderColor: isDark ? colors.glass.inputBorder : 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 32,
  },
  categoryTileInputContainerActive: {
    borderColor: colors.accent.blue,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
  },
  categoryTileCurrencyPrefix: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  categoryTileInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    padding: 0,
  },

  // Currency Grid Redesign
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  currencyCard: {
    width: '48.5%',
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.glass.cardBorder,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    minHeight: 110,
    justifyContent: 'center',
    marginBottom: 10,
  },
  currencyCardActive: {
    borderColor: colors.accent.blue,
    backgroundColor: isDark ? 'rgba(79, 195, 247, 0.04)' : 'rgba(2, 132, 199, 0.03)',
  },
  currencyCardFlagContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencyCardFlag: {
    fontSize: 20,
  },
  currencyCardTextWrap: {
    alignItems: 'center',
    marginBottom: 6,
  },
  currencyCardCode: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  currencyCardCodeActive: {
    color: colors.accent.blue,
  },
  currencyCardName: {
    color: colors.text.muted,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
    width: 100,
  },
  currencyCardSymbolBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currencyCardSymbol: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  currencyCardSymbolActive: {
    color: colors.accent.blue,
  },
  moreCurrenciesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.glass.cardBorder,
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
  },
  moreCurrenciesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moreCurrenciesIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCurrenciesText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  moreCurrenciesRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreCurrenciesCount: {
    color: colors.text.muted,
    fontSize: 12,
  },

  // Security Lock Redesign
  securityVisualPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.glass.cardBorder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  securityVisualPanelActive: {
    borderColor: 'rgba(102,187,106,0.2)',
    backgroundColor: isDark ? 'rgba(102,187,106,0.03)' : 'rgba(22,163,74,0.02)',
  },
  securityVisualLockCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityVisualLockCircleActive: {
    backgroundColor: 'rgba(102,187,106,0.1)',
  },
  securityVisualInfo: {
    flex: 1,
  },
  securityVisualStatusText: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  securityVisualStatusActive: {
    color: colors.accent.green,
  },
  securityVisualDesc: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },

  // Backup & Import Redesign
  backupVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.glass.cardBorder,
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
  },
  backupVisualNode: {
    alignItems: 'center',
    gap: 6,
  },
  backupNodeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backupVisualLabel: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  backupVisualArrowWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupOfflineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.green,
    marginTop: 4,
  },
  backupOfflineText: {
    color: colors.text.muted,
    fontSize: 9,
    marginTop: 2,
  },
  importChoiceCard: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.glass.cardBorder,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  importChoiceCardDanger: {
    borderColor: 'rgba(239,83,80,0.15)',
  },
  importChoiceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  importChoiceLabel: {
    color: colors.accent.blue,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  importChoiceDesc: {
    color: colors.text.muted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    height: 42,
    marginBottom: 8,
  },
  importSafeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(102,187,106,0.1)' : 'rgba(22,163,74,0.06)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  importSafeText: {
    color: colors.accent.green,
    fontSize: 9,
    fontWeight: '700',
  },
  importDestructiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,83,80,0.08)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  importDestructiveText: {
    color: colors.accent.red,
    fontSize: 9,
    fontWeight: '700',
  },

  // Danger Zone Redesign
  dangerHeaderPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dangerHeaderPulseOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239,83,80,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dangerHeaderPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(239,83,80,0.2)',
  },
  dangerHeaderIcon: {
    zIndex: 2,
  },
  dangerHeaderTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  dangerHeaderDesc: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  dangerActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dangerActionTile: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.glass.cardBorder,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  dangerActionTileWipe: {
    borderColor: 'rgba(239,83,80,0.15)',
    backgroundColor: isDark ? 'rgba(239,83,80,0.01)' : 'rgba(239,83,80,0.005)',
  },
  dangerTileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerTileIconWrapWipe: {
    backgroundColor: colors.accent.red,
  },
  dangerTileLabel: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  dangerTileDesc: {
    color: colors.text.muted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },

  // About Redesign
  aboutMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  aboutMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    borderWidth: 0.5,
    borderColor: colors.glass.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aboutMetaPillText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  aboutRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aboutIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },

  // Color Palette & Option Pill Customizations
  colorPaletteGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 10,
  },
  colorTile: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderWidth: 1,
  },
  colorCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginBottom: 4,
  },
  colorLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  optionPillGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  optionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  },
  optionPillActive: {
    backgroundColor: isDark ? 'rgba(79, 195, 247, 0.16)' : 'rgba(2, 132, 199, 0.1)',
    borderColor: colors.accent.blue,
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  optionPillTextActive: {
    color: colors.accent.blue,
    fontWeight: '700',
  },
});
