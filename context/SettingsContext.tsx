import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { getCurrencyByCode } from '../constants/currencies';

export type NumberFormatType = 'standard' | 'european' | 'space';
export type DateFormatType = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type WeekStartDayType = 'monday' | 'sunday' | 'saturday';
export type DefaultPaymentMethodType = 'card' | 'cash' | 'upi' | 'transfer';
export type AutoArchiveType = 'never' | '30_days' | '90_days' | '1_year';
export type CardDensityType = 'comfortable' | 'compact';

interface SettingsContextType {
  numberFormat: NumberFormatType;
  dateFormat: DateFormatType;
  weekStartDay: WeekStartDayType;
  defaultPaymentMethod: DefaultPaymentMethodType;
  autoArchiveSettled: AutoArchiveType;
  cardDensityMode: CardDensityType;
  setNumberFormat: (val: NumberFormatType) => void;
  setDateFormat: (val: DateFormatType) => void;
  setWeekStartDay: (val: WeekStartDayType) => void;
  setDefaultPaymentMethod: (val: DefaultPaymentMethodType) => void;
  setAutoArchiveSettled: (val: AutoArchiveType) => void;
  setCardDensityMode: (val: CardDensityType) => void;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  formatDate: (dateString: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [numberFormat, setNumberFormatState] = useState<NumberFormatType>('standard');
  const [dateFormat, setDateFormatState] = useState<DateFormatType>('DD/MM/YYYY');
  const [weekStartDay, setWeekStartDayState] = useState<WeekStartDayType>('monday');
  const [defaultPaymentMethod, setDefaultPaymentMethodState] = useState<DefaultPaymentMethodType>('card');
  const [autoArchiveSettled, setAutoArchiveSettledState] = useState<AutoArchiveType>('never');
  const [cardDensityMode, setCardDensityModeState] = useState<CardDensityType>('comfortable');

  const loadSettings = useCallback(async () => {
    try {
      const nf = await storage.getString(STORAGE_KEYS.NUMBER_FORMAT);
      if (nf) setNumberFormatState(nf as NumberFormatType);

      const df = await storage.getString(STORAGE_KEYS.DATE_FORMAT);
      if (df) setDateFormatState(df as DateFormatType);

      const wsd = await storage.getString(STORAGE_KEYS.WEEK_START_DAY);
      if (wsd) setWeekStartDayState(wsd as WeekStartDayType);

      const dpm = await storage.getString(STORAGE_KEYS.DEFAULT_PAYMENT_METHOD);
      if (dpm) setDefaultPaymentMethodState(dpm as DefaultPaymentMethodType);

      const aas = await storage.getString(STORAGE_KEYS.AUTO_ARCHIVE_SETTLED);
      if (aas) setAutoArchiveSettledState(aas as AutoArchiveType);

      const cdm = await storage.getString(STORAGE_KEYS.CARD_DENSITY_MODE);
      if (cdm) setCardDensityModeState(cdm as CardDensityType);
    } catch {
      // Fallbacks
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const setNumberFormat = useCallback((val: NumberFormatType) => {
    setNumberFormatState(val);
    storage.set(STORAGE_KEYS.NUMBER_FORMAT, val);
  }, []);

  const setDateFormat = useCallback((val: DateFormatType) => {
    setDateFormatState(val);
    storage.set(STORAGE_KEYS.DATE_FORMAT, val);
  }, []);

  const setWeekStartDay = useCallback((val: WeekStartDayType) => {
    setWeekStartDayState(val);
    storage.set(STORAGE_KEYS.WEEK_START_DAY, val);
  }, []);

  const setDefaultPaymentMethod = useCallback((val: DefaultPaymentMethodType) => {
    setDefaultPaymentMethodState(val);
    storage.set(STORAGE_KEYS.DEFAULT_PAYMENT_METHOD, val);
  }, []);

  const setAutoArchiveSettled = useCallback((val: AutoArchiveType) => {
    setAutoArchiveSettledState(val);
    storage.set(STORAGE_KEYS.AUTO_ARCHIVE_SETTLED, val);
  }, []);

  const setCardDensityMode = useCallback((val: CardDensityType) => {
    setCardDensityModeState(val);
    storage.set(STORAGE_KEYS.CARD_DENSITY_MODE, val);
  }, []);

  const formatCurrency = useCallback((amount: number, currencyCode: string = 'INR'): string => {
    try {
      const currency = getCurrencyByCode(currencyCode);
      let locale = currency.locale;
      if (numberFormat === 'european') locale = 'de-DE';
      else if (numberFormat === 'space') locale = 'fr-FR';

      const formatted = amount.toLocaleString(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      return `${currency.symbol}${formatted}`;
    } catch {
      return `${currencyCode} ${amount.toLocaleString()}`;
    }
  }, [numberFormat]);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    if (dateFormat === 'MM/DD/YYYY') {
      return `${month}/${day}/${year}`;
    } else if (dateFormat === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`;
    } else {
      return `${day}/${month}/${year}`;
    }
  }, [dateFormat]);

  return (
    <SettingsContext.Provider
      value={{
        numberFormat,
        dateFormat,
        weekStartDay,
        defaultPaymentMethod,
        autoArchiveSettled,
        cardDensityMode,
        setNumberFormat,
        setDateFormat,
        setWeekStartDay,
        setDefaultPaymentMethod,
        setAutoArchiveSettled,
        setCardDensityMode,
        formatCurrency,
        formatDate,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
