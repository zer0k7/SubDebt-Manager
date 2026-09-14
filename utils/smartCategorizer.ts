import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { CategoryDefinition } from '../constants/categories';

// Comprehensive keyword dictionary mapping common merchant names and keywords to category groups/names
const KEYWORD_CATEGORY_MAP: Record<string, string[]> = {
  // Food & Dining
  'Food': ['lunch', 'dinner', 'breakfast', 'meal', 'bistro', 'dhaba', 'canteen', 'mess', 'buffet', 'snack', 'eating'],
  'Dining Out': ['restaurant', 'dining', 'dine', 'swiggy', 'zomato', 'mcdonalds', 'kfc', 'burger king', 'dominos', 'pizza hut', 'subway', 'wendys', 'taco bell', 'chipotle', 'barbeque', 'bbq', 'nandos'],
  'Groceries': ['grocery', 'groceries', 'supermarket', 'mart', 'walmart', 'costco', 'blinkit', 'zepto', 'instamart', 'bigbasket', 'dmart', 'vegetables', 'veggies', 'fruits', 'milk', 'dairy', 'bread', 'eggs', 'flour', 'spices', 'superstore'],
  'Snacks & Coffee': ['coffee', 'cafe', 'starbucks', 'costa', 'dunkin', 'tim hortons', 'tea', 'chai', 'bakery', 'croissant', 'donut', 'pastry', 'ice cream', 'gelato', 'boba', 'smoothie', 'juice'],
  'Drinks & Bar': ['bar', 'pub', 'beer', 'wine', 'liquor', 'alcohol', 'brewery', 'cocktail', 'whiskey', 'vodka', 'nightclub', 'club'],

  // Transportation
  'Travel': ['travel', 'flight', 'airline', 'airways', 'indigo', 'emirates', 'delta', 'hotel', 'airbnb', 'hostel', 'resort', 'vacation', 'trip', 'booking.com', 'expedia', 'makemytrip', 'agoda'],
  'Fuel & Gas': ['fuel', 'gas', 'petrol', 'diesel', 'cng', 'shell', 'bp', 'chevron', 'exxon', 'hp petrol', 'indian oil', 'bharat petroleum'],
  'Taxi & Rideshare': ['uber', 'lyft', 'ola', 'rapido', 'grab', 'cab', 'taxi', 'rickshaw', 'auto', 'metro card', 'subway pass', 'bus fare', 'transit'],
  'Vehicle Maint.': ['car wash', 'mechanic', 'tyre', 'tire', 'service center', 'oil change', 'car repair', 'bike repair', 'garage', 'spare parts'],
  'Parking & Tolls': ['parking', 'toll', 'fastag', 'tollway', 'toll gate', 'valet'],

  // Shopping
  'Shopping': ['amazon', 'flipkart', 'ebay', 'aliexpress', 'target', 'shopping', 'mall', 'outlet', 'purchase'],
  'Clothing': ['zara', 'h&m', 'uniqlo', 'nike', 'adidas', 'puma', 'clothes', 'clothing', 'shirt', 'jeans', 'tshirt', 'dress', 'shoes', 'footwear', 'jacket', 'hoodie', 'apparel', 'levi'],
  'Electronics': ['apple store', 'best buy', 'gadget', 'croma', 'reliance digital', 'headphone', 'laptop', 'charger', 'cable', 'mouse', 'keyboard', 'monitor', 'samsung', 'sony', 'ipad', 'airpods'],
  'Personal Care': ['shampoo', 'soap', 'toothpaste', 'deodorant', 'perfume', 'skincare', 'lotion', 'sunscreen', 'haircut', 'grooming', 'razor'],
  'Beauty & Salon': ['salon', 'spa', 'massage', 'manicure', 'pedicure', 'sephora', 'nykaa', 'makeup', 'lipstick', 'facial'],

  // Bills & Housing
  'Bills': ['electricity bill', 'water bill', 'power bill', 'gas bill', 'utility', 'broadband', 'wifi bill', 'internet bill', 'maintenance fee'],
  'Recharge': ['mobile recharge', 'prepaid', 'airtel', 'jio', 'vi recharge', 'verizon', 't-mobile', 'at&t', 'phone recharge', 'dth'],
  'Rent & Housing': ['rent', 'landlord', 'society maintenance', 'housing', 'mortgage', 'lease', 'flat maintenance'],
  'Home Repair': ['plumber', 'electrician', 'carpenter', 'hardware store', 'paint', 'furniture', 'ikea', 'curtains', 'appliance repair'],
  'Subscriptions': ['netflix', 'spotify', 'youtube premium', 'apple music', 'disney', 'hulu', 'hbo', 'amazon prime', 'chatgpt', 'openai', 'github', 'icloud', 'google one'],

  // Health & Fitness
  'Health': ['doctor', 'hospital', 'clinic', 'dentist', 'eye checkup', 'blood test', 'lab', 'therapy', 'counseling', 'health checkup'],
  'Pharmacy': ['pharmacy', 'medicine', 'chemist', 'drugs', 'cvs', 'walgreens', 'apollo pharmacy', '1mg', 'medplus', 'pills', 'vitamins'],
  'Fitness & Gym': ['gym', 'fitness', 'cult.fit', 'planet fitness', 'gold gym', 'workout', 'yoga', 'whey protein', 'supplements', 'creatine'],

  // Education & Work
  'Study': ['tuition', 'school fee', 'college fee', 'university', 'exam fee', 'coaching', 'stationery', 'notebook', 'pen'],
  'Courses & Books': ['udemy', 'coursera', 'edx', 'bookstore', 'kindle', 'audible', 'barnes', 'textbook', 'library'],
  'Office & Work': ['coworking', 'wework', 'office supplies', 'printer', 'paper', 'postage', 'courier', 'fedex', 'dhl'],

  // Entertainment
  'Entertainment': ['cinema', 'movie', 'theatre', 'imax', 'pvr', 'inox', 'amc', 'concert', 'event', 'amusement park', 'museum'],
  'Gaming': ['steam', 'playstation', 'ps5', 'xbox', 'nintendo', 'game', 'epic games', 'discord nitro', 'in-game', 'robux'],
  'Events & Outings': ['bowling', 'escape room', 'arcade', 'karting', 'outing', 'picnic', 'party'],

  // Family & Gifts
  'Gifts': ['gift', 'flowers', 'birthday present', 'anniversary', 'wedding gift', 'bouquet', 'ferns n petals'],
  'Pets': ['pet food', 'dog food', 'cat food', 'vet', 'veterinary', 'pet shop', 'pet clinic', 'dog leash'],
  'Kids & Family': ['toys', 'baby food', 'diapers', 'pampers', 'daycare', 'kids clothes'],

  // Financial
  'Investments': ['stocks', 'mutual fund', 'sip', 'zerodha', 'groww', 'robinhood', 'crypto', 'bitcoin', 'etf', 'gold'],
  'Insurance': ['insurance', 'lic', 'health insurance', 'car insurance', 'life insurance', 'term insurance'],
  'Debt & EMI': ['loan', 'emi', 'credit card bill', 'card payment', 'interest', 'mortgage emi'],
};

/**
 * Predicts the most matching category for a given expense title.
 * Checks:
 * 1. User's previous transactions with the same or similar title
 * 2. Built-in merchant / keyword rules
 */
export const predictCategory = async (
  title: string,
  availableCategories: CategoryDefinition[]
): Promise<CategoryDefinition | null> => {
  const cleanTitle = (title || '').trim().toLowerCase();
  if (!cleanTitle || cleanTitle.length < 2 || availableCategories.length === 0) {
    return null;
  }

  // 1. Check user transaction history for historical preference
  try {
    const rawSpending = await storage.getString(STORAGE_KEYS.DAILY_SPENDING);
    if (rawSpending) {
      const entries: { title: string; category: string }[] = JSON.parse(rawSpending);
      // Find exact or start match in past entries
      const pastMatch = entries.find(
        (e) =>
          e.title &&
          (e.title.toLowerCase().trim() === cleanTitle ||
            cleanTitle.startsWith(e.title.toLowerCase().trim()) ||
            e.title.toLowerCase().trim().startsWith(cleanTitle))
      );
      if (pastMatch) {
        const found = availableCategories.find(
          (c) => c.name.toLowerCase() === pastMatch.category.toLowerCase()
        );
        if (found) return found;
      }
    }
  } catch {}

  // 2. Check built-in keyword dictionary
  for (const [categoryName, keywords] of Object.entries(KEYWORD_CATEGORY_MAP)) {
    const isMatch = keywords.some(
      (kw) => cleanTitle === kw || cleanTitle.includes(kw) || kw.includes(cleanTitle)
    );
    if (isMatch) {
      // Find this category in the user's available categories (handles case and custom variations)
      const found = availableCategories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (found) return found;

      // Check group match if specific category name not found
      const groupFound = availableCategories.find(
        (c) => c.group && c.group.toLowerCase().includes(categoryName.toLowerCase())
      );
      if (groupFound) return groupFound;
    }
  }

  return null;
};
