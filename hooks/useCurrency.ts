import { useState, useCallback, useEffect } from 'react';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { getCurrencyByCode, convertCurrency, DEFAULT_CURRENCY_CODE, Currency } from '../constants/currencies';

const listeners = new Set<(code: string) => void>();

export const useCurrency = () => {
  const [currencyCode, setCurrencyCode] = useState<string>('INR');
  const [isLoaded, setIsLoaded] = useState(true);

  const loadCurrency = useCallback(async () => {
    try {
      const saved = await storage.getString(STORAGE_KEYS.CURRENCY);
      if (saved) {
        setCurrencyCode(saved);
      } else {
        await storage.set(STORAGE_KEYS.CURRENCY, 'INR');
        setCurrencyCode('INR');
      }
    } catch {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadCurrency();
  }, [loadCurrency]);

  useEffect(() => {
    const handleUpdate = (code: string) => {
      setCurrencyCode(code);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const setCurrency = useCallback(async (code: string) => {
    await storage.set(STORAGE_KEYS.CURRENCY, code);
    listeners.forEach((cb) => cb(code));
  }, []);

  const convertAmount = useCallback((amount: number, fromCode?: string, targetCode?: string) => {
    const from = fromCode || 'INR';
    const to = targetCode || currencyCode;
    return convertCurrency(amount, from, to);
  }, [currencyCode]);

  return {
    currencyCode,
    currency: getCurrencyByCode(currencyCode),
    setCurrency,
    isLoaded,
    refresh: loadCurrency,
    convertAmount,
  };
};

