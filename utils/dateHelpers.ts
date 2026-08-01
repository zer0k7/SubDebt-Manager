export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  try {
    const { storage } = require('../storage/mmkv');
    const { STORAGE_KEYS } = require('../storage/keys');
    const dateFormat = storage.getString(STORAGE_KEYS.DATE_FORMAT) || 'DD/MM/YYYY';

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
  } catch {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
};

export const formatShortDate = (date: Date): string => {
  return formatDate(date.toISOString());
};

export const formatDateRelative = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d ago`;
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays < 30) {
    return `${diffDays}d left`;
  } else {
    return formatDate(dateString);
  }
};

export const getDaysRemaining = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isExpired = (dateString: string): boolean => {
  return getDaysRemaining(dateString) < 0;
};

export const isExpiringSoon = (dateString: string, days: number = 7): boolean => {
  const daysRemaining = getDaysRemaining(dateString);
  return daysRemaining >= 0 && daysRemaining <= days;
};

export const getProgressPercentage = (startDate: string, expiryDate: string): number => {
  const start = new Date(startDate).getTime();
  const end = new Date(expiryDate).getTime();
  const now = new Date().getTime();

  if (now >= end) return 100;
  if (now <= start) return 0;

  const total = end - start;
  const elapsed = now - start;
  return Math.round((elapsed / total) * 100);
};

export const formatCurrency = (amount: number, currencyCode: string = 'INR'): string => {
  try {
    const { storage } = require('../storage/mmkv');
    const { STORAGE_KEYS } = require('../storage/keys');
    const numberFormat = storage.getString(STORAGE_KEYS.NUMBER_FORMAT) || 'standard';
    const { getCurrencyByCode } = require('../constants/currencies');
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
};

export const getCurrentDateISO = (): string => {
  return new Date().toISOString();
};
