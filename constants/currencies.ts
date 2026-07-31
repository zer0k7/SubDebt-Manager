export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', flag: '🇯🇵' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', flag: '🇨🇦' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN', flag: '🇨🇳' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR', flag: '🇰🇷' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', flag: '🇸🇬' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', flag: '🇦🇪' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA', flag: '🇸🇦' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR', flag: '🇧🇷' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', locale: 'es-MX', flag: '🇲🇽' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH', flag: '🇹🇭' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID', flag: '🇮🇩' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR', flag: '🇹🇷' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA', flag: '🇿🇦' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH', flag: '🇨🇭' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE', flag: '🇸🇪' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ', flag: '🇳🇿' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', locale: 'ur-PK', flag: '🇵🇰' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD', flag: '🇧🇩' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', locale: 'si-LK', flag: '🇱🇰' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG', flag: '🇳🇬' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', locale: 'ar-EG', flag: '🇪🇬' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH', flag: '🇵🇭' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY', flag: '🇲🇾' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN', flag: '🇻🇳' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU', flag: '🇷🇺' },
];

export const DEFAULT_CURRENCY_CODE = 'INR';

export const getCurrencyByCode = (code: string): Currency => {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
};
