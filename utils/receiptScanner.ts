import { CategoryDefinition } from '../constants/categories';
import { predictCategory } from './smartCategorizer';

export interface ScannedReceiptData {
  merchant?: string;
  amount?: number;
  date?: Date;
  suggestedCategory?: string;
  confidence: number;
}

/**
 * Intelligent pattern extractor for receipt text
 */
export const extractReceiptData = async (
  rawText: string,
  availableCategories: CategoryDefinition[]
): Promise<ScannedReceiptData> => {
  if (!rawText || typeof rawText !== 'string') {
    return { confidence: 0 };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { confidence: 0 };
  }

  let merchant: string | undefined = undefined;
  let amount: number | undefined = undefined;
  let date: Date | undefined = undefined;
  let confidence = 0.5;

  // 1. Merchant Detection: First 1-3 lines usually contain merchant name
  const ignoredKeywords = ['receipt', 'tax invoice', 'invoice', 'bill', 'customer copy', 'welcome', 'thank you', 'order'];
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const isIgnored = ignoredKeywords.some((k) => lower === k || lower.startsWith(k));
    const hasNumbers = /\d{3,}/.test(line);
    if (!isIgnored && !hasNumbers && line.length >= 3 && line.length <= 40) {
      merchant = line.replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
      break;
    }
  }

  // 2. Amount Detection: Look for Total / Grand Total / Amount Due or highest numeric price
  const totalRegex = /(?:total|grand\s*total|net\s*amount|amount\s*due|balance\s*due|amount\s*paid|subtotal)[\s:]*[$₹€£]?\s*(\d+[\.,]\d{2})/i;
  for (const line of lines) {
    const match = line.match(totalRegex);
    if (match && match[1]) {
      const parsed = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        confidence += 0.3;
        break;
      }
    }
  }

  // Fallback amount detection: search for any currency pattern or numbers near the end
  if (amount === undefined) {
    const priceRegex = /[$₹€£]\s*(\d+[\.,]\d{2})/g;
    const candidates: number[] = [];
    for (const line of lines) {
      let m;
      while ((m = priceRegex.exec(line)) !== null) {
        const val = parseFloat(m[1].replace(',', '.'));
        if (!isNaN(val)) candidates.push(val);
      }
    }
    if (candidates.length > 0) {
      amount = Math.max(...candidates);
      confidence += 0.15;
    }
  }

  // 3. Date Detection: standard formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.)
  const dateRegex = /\b(\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4})\b/;
  for (const line of lines) {
    const match = line.match(dateRegex);
    if (match && match[1]) {
      const parsedDate = new Date(match[1]);
      if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000) {
        date = parsedDate;
        confidence += 0.2;
        break;
      }
    }
  }

  // 4. Category Prediction based on detected merchant
  let suggestedCategory: string | undefined = undefined;
  if (merchant) {
    const predicted = await predictCategory(merchant, availableCategories);
    if (predicted) {
      suggestedCategory = predicted.name;
    }
  }

  return {
    merchant,
    amount,
    date,
    suggestedCategory,
    confidence: Math.min(confidence, 1.0),
  };
};
