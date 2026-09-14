export interface CategoryDefinition {
  id?: string;
  name: string;
  icon: string;
  color: string;
  group: string;
  isCustom?: boolean;
  isDefault?: boolean;
}

export const CATEGORY_GROUPS = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Housing',
  'Health & Fitness',
  'Education & Work',
  'Entertainment',
  'Family & Gifts',
  'Financial',
  'General',
] as const;

export const DEFAULT_SPENDING_CATEGORIES: CategoryDefinition[] = [
  // Food & Dining
  { id: 'food', name: 'Food', icon: 'restaurant-outline', color: '#EF5350', group: 'Food & Dining', isDefault: true },
  { id: 'dining-out', name: 'Dining Out', icon: 'fast-food-outline', color: '#FF7043', group: 'Food & Dining', isDefault: true },
  { id: 'groceries', name: 'Groceries', icon: 'cart-outline', color: '#66BB6A', group: 'Food & Dining', isDefault: true },
  { id: 'snacks-coffee', name: 'Snacks & Coffee', icon: 'cafe-outline', color: '#FFA726', group: 'Food & Dining', isDefault: true },
  { id: 'drinks-bar', name: 'Drinks & Bar', icon: 'beer-outline', color: '#AB47BC', group: 'Food & Dining', isDefault: true },

  // Transportation
  { id: 'travel', name: 'Travel', icon: 'car-outline', color: '#4FC3F7', group: 'Transportation', isDefault: true },
  { id: 'fuel-gas', name: 'Fuel & Gas', icon: 'flame-outline', color: '#FF5722', group: 'Transportation', isDefault: true },
  { id: 'taxi-rideshare', name: 'Taxi & Rideshare', icon: 'subway-outline', color: '#FFCA28', group: 'Transportation', isDefault: true },
  { id: 'vehicle-maint', name: 'Vehicle Maint.', icon: 'build-outline', color: '#78909C', group: 'Transportation', isDefault: true },
  { id: 'parking-tolls', name: 'Parking & Tolls', icon: 'navigate-outline', color: '#26A69A', group: 'Transportation', isDefault: true },

  // Shopping
  { id: 'shopping', name: 'Shopping', icon: 'bag-handle-outline', color: '#EC407A', group: 'Shopping', isDefault: true },
  { id: 'clothing', name: 'Clothing', icon: 'shirt-outline', color: '#F06292', group: 'Shopping', isDefault: true },
  { id: 'electronics', name: 'Electronics', icon: 'laptop-outline', color: '#42A5F5', group: 'Shopping', isDefault: true },
  { id: 'personal-care', name: 'Personal Care', icon: 'sparkles-outline', color: '#26C6DA', group: 'Shopping', isDefault: true },
  { id: 'beauty-salon', name: 'Beauty & Salon', icon: 'flower-outline', color: '#E91E63', group: 'Shopping', isDefault: true },

  // Bills & Housing
  { id: 'bills', name: 'Bills', icon: 'document-text-outline', color: '#5C6BC0', group: 'Bills & Housing', isDefault: true },
  { id: 'recharge', name: 'Recharge', icon: 'flash-outline', color: '#29B6F6', group: 'Bills & Housing', isDefault: true },
  { id: 'rent-housing', name: 'Rent & Housing', icon: 'home-outline', color: '#8D6E63', group: 'Bills & Housing', isDefault: true },
  { id: 'home-repair', name: 'Home Repair', icon: 'hammer-outline', color: '#A1887F', group: 'Bills & Housing', isDefault: true },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'card-outline', color: '#7E57C2', group: 'Bills & Housing', isDefault: true },

  // Health & Fitness
  { id: 'health', name: 'Health', icon: 'heart-outline', color: '#EF5350', group: 'Health & Fitness', isDefault: true },
  { id: 'pharmacy', name: 'Pharmacy', icon: 'medkit-outline', color: '#E57373', group: 'Health & Fitness', isDefault: true },
  { id: 'fitness-gym', name: 'Fitness & Gym', icon: 'barbell-outline', color: '#9CCC65', group: 'Health & Fitness', isDefault: true },

  // Education & Work
  { id: 'study', name: 'Study', icon: 'book-outline', color: '#7E57C2', group: 'Education & Work', isDefault: true },
  { id: 'courses-books', name: 'Courses & Books', icon: 'library-outline', color: '#5C6BC0', group: 'Education & Work', isDefault: true },
  { id: 'office-work', name: 'Office & Work', icon: 'briefcase-outline', color: '#3F51B5', group: 'Education & Work', isDefault: true },

  // Entertainment
  { id: 'entertainment', name: 'Entertainment', icon: 'film-outline', color: '#AB47BC', group: 'Entertainment', isDefault: true },
  { id: 'gaming', name: 'Gaming', icon: 'game-controller-outline', color: '#9C27B0', group: 'Entertainment', isDefault: true },
  { id: 'events-outings', name: 'Events & Outings', icon: 'ticket-outline', color: '#BA68C8', group: 'Entertainment', isDefault: true },

  // Family & Gifts
  { id: 'gifts', name: 'Gifts', icon: 'gift-outline', color: '#FF4081', group: 'Family & Gifts', isDefault: true },
  { id: 'pets', name: 'Pets', icon: 'paw-outline', color: '#FFA726', group: 'Family & Gifts', isDefault: true },
  { id: 'kids-family', name: 'Kids & Family', icon: 'people-outline', color: '#26A69A', group: 'Family & Gifts', isDefault: true },

  // Financial
  { id: 'investments', name: 'Investments', icon: 'trending-up-outline', color: '#66BB6A', group: 'Financial', isDefault: true },
  { id: 'insurance', name: 'Insurance', icon: 'shield-checkmark-outline', color: '#42A5F5', group: 'Financial', isDefault: true },
  { id: 'debt-emi', name: 'Debt & EMI', icon: 'cash-outline', color: '#FF7043', group: 'Financial', isDefault: true },

  // General
  { id: 'miscellaneous', name: 'Miscellaneous', icon: 'shapes-outline', color: '#78909C', group: 'General', isDefault: true },
  { id: 'other', name: 'Other', icon: 'ellipse-outline', color: '#B0BEC5', group: 'General', isDefault: true },
];

export const SPENDING_CATEGORIES: CategoryDefinition[] = DEFAULT_SPENDING_CATEGORIES;

export interface CategoryIconItem {
  name: string;
  group: string;
  keywords: string[];
}

export const EXTENDED_CATEGORY_ICONS: CategoryIconItem[] = [
  // Food & Dining
  { name: 'restaurant-outline', group: 'Food & Dining', keywords: ['food', 'restaurant', 'dine', 'dinner', 'lunch', 'eat'] },
  { name: 'fast-food-outline', group: 'Food & Dining', keywords: ['fast food', 'burger', 'snack', 'fries'] },
  { name: 'cart-outline', group: 'Food & Dining', keywords: ['cart', 'groceries', 'supermarket', 'market'] },
  { name: 'cafe-outline', group: 'Food & Dining', keywords: ['coffee', 'tea', 'cafe', 'espresso', 'snack'] },
  { name: 'beer-outline', group: 'Food & Dining', keywords: ['beer', 'bar', 'drink', 'alcohol', 'pub'] },
  { name: 'wine-outline', group: 'Food & Dining', keywords: ['wine', 'alcohol', 'cocktail', 'party'] },
  { name: 'pizza-outline', group: 'Food & Dining', keywords: ['pizza', 'italian', 'snack'] },
  { name: 'ice-cream-outline', group: 'Food & Dining', keywords: ['ice cream', 'dessert', 'sweet'] },
  { name: 'nutrition-outline', group: 'Food & Dining', keywords: ['apple', 'fruit', 'nutrition', 'healthy', 'diet'] },
  { name: 'fish-outline', group: 'Food & Dining', keywords: ['fish', 'seafood', 'meat'] },

  // Transportation
  { name: 'car-outline', group: 'Transportation', keywords: ['car', 'vehicle', 'drive', 'travel'] },
  { name: 'car-sport-outline', group: 'Transportation', keywords: ['sports car', 'auto', 'drive'] },
  { name: 'bus-outline', group: 'Transportation', keywords: ['bus', 'transit', 'commute'] },
  { name: 'subway-outline', group: 'Transportation', keywords: ['subway', 'metro', 'train', 'underground'] },
  { name: 'train-outline', group: 'Transportation', keywords: ['train', 'rail', 'railway'] },
  { name: 'airplane-outline', group: 'Transportation', keywords: ['airplane', 'flight', 'travel', 'vacation', 'trip'] },
  { name: 'boat-outline', group: 'Transportation', keywords: ['boat', 'ship', 'cruise', 'ferry'] },
  { name: 'bicycle-outline', group: 'Transportation', keywords: ['bike', 'bicycle', 'cycling', 'ride'] },
  { name: 'flame-outline', group: 'Transportation', keywords: ['fuel', 'gas', 'petrol', 'diesel'] },
  { name: 'build-outline', group: 'Transportation', keywords: ['maintenance', 'repair', 'mechanic', 'service'] },
  { name: 'navigate-outline', group: 'Transportation', keywords: ['toll', 'gps', 'parking', 'navigation', 'map'] },
  { name: 'speedometer-outline', group: 'Transportation', keywords: ['speed', 'mileage', 'odometer'] },

  // Shopping
  { name: 'bag-handle-outline', group: 'Shopping', keywords: ['shopping', 'bag', 'mall', 'buy'] },
  { name: 'bag-outline', group: 'Shopping', keywords: ['bag', 'tote', 'fashion'] },
  { name: 'basket-outline', group: 'Shopping', keywords: ['basket', 'shopping', 'store'] },
  { name: 'shirt-outline', group: 'Shopping', keywords: ['clothes', 'clothing', 'shirt', 'apparel', 'fashion'] },
  { name: 'pricetag-outline', group: 'Shopping', keywords: ['discount', 'sale', 'tag', 'price'] },
  { name: 'pricetags-outline', group: 'Shopping', keywords: ['deals', 'tags', 'coupons'] },
  { name: 'barcode-outline', group: 'Shopping', keywords: ['barcode', 'retail', 'scan'] },
  { name: 'gift-outline', group: 'Shopping', keywords: ['gift', 'present', 'box', 'holiday'] },
  { name: 'watch-outline', group: 'Shopping', keywords: ['watch', 'accessory', 'jewelry', 'time'] },
  { name: 'glasses-outline', group: 'Shopping', keywords: ['glasses', 'spectacles', 'eyewear'] },
  { name: 'diamond-outline', group: 'Shopping', keywords: ['diamond', 'jewelry', 'luxury', 'gem'] },

  // Bills & Housing
  { name: 'home-outline', group: 'Bills & Housing', keywords: ['home', 'house', 'rent', 'mortgage', 'living'] },
  { name: 'business-outline', group: 'Bills & Housing', keywords: ['building', 'apartment', 'property'] },
  { name: 'key-outline', group: 'Bills & Housing', keywords: ['key', 'rent', 'lease', 'access'] },
  { name: 'document-text-outline', group: 'Bills & Housing', keywords: ['bill', 'invoice', 'paper', 'utility'] },
  { name: 'flash-outline', group: 'Bills & Housing', keywords: ['electricity', 'power', 'energy', 'electric'] },
  { name: 'water-outline', group: 'Bills & Housing', keywords: ['water', 'plumbing', 'utility'] },
  { name: 'bulb-outline', group: 'Bills & Housing', keywords: ['light', 'electricity', 'idea'] },
  { name: 'hammer-outline', group: 'Bills & Housing', keywords: ['repair', 'tool', 'renovation', 'home'] },
  { name: 'construct-outline', group: 'Bills & Housing', keywords: ['construction', 'tools', 'fix'] },
  { name: 'wifi-outline', group: 'Bills & Housing', keywords: ['wifi', 'internet', 'broadband', 'network'] },
  { name: 'tv-outline', group: 'Bills & Housing', keywords: ['cable', 'tv', 'television', 'streaming'] },
  { name: 'call-outline', group: 'Bills & Housing', keywords: ['phone', 'mobile', 'cell', 'telecom', 'recharge'] },
  { name: 'card-outline', group: 'Bills & Housing', keywords: ['card', 'subscription', 'membership'] },
  { name: 'receipt-outline', group: 'Bills & Housing', keywords: ['receipt', 'proof', 'statement'] },

  // Tech & Gadgets
  { name: 'laptop-outline', group: 'Tech & Gadgets', keywords: ['laptop', 'computer', 'macbook', 'pc'] },
  { name: 'desktop-outline', group: 'Tech & Gadgets', keywords: ['desktop', 'monitor', 'screen'] },
  { name: 'phone-portrait-outline', group: 'Tech & Gadgets', keywords: ['phone', 'smartphone', 'iphone', 'android'] },
  { name: 'tablet-portrait-outline', group: 'Tech & Gadgets', keywords: ['tablet', 'ipad'] },
  { name: 'headset-outline', group: 'Tech & Gadgets', keywords: ['headphones', 'headset', 'audio'] },
  { name: 'hardware-chip-outline', group: 'Tech & Gadgets', keywords: ['chip', 'processor', 'hardware', 'tech'] },
  { name: 'game-controller-outline', group: 'Tech & Gadgets', keywords: ['gaming', 'console', 'playstation', 'xbox'] },
  { name: 'camera-outline', group: 'Tech & Gadgets', keywords: ['camera', 'photo', 'photography'] },
  { name: 'videocam-outline', group: 'Tech & Gadgets', keywords: ['video', 'camcorder', 'record'] },
  { name: 'server-outline', group: 'Tech & Gadgets', keywords: ['server', 'cloud', 'hosting'] },
  { name: 'mic-outline', group: 'Tech & Gadgets', keywords: ['mic', 'microphone', 'podcast'] },

  // Health & Fitness
  { name: 'heart-outline', group: 'Health & Fitness', keywords: ['health', 'heart', 'medical', 'cardio'] },
  { name: 'medkit-outline', group: 'Health & Fitness', keywords: ['doctor', 'pharmacy', 'medicine', 'firstaid'] },
  { name: 'barbell-outline', group: 'Health & Fitness', keywords: ['gym', 'fitness', 'weights', 'workout'] },
  { name: 'fitness-outline', group: 'Health & Fitness', keywords: ['exercise', 'active', 'run'] },
  { name: 'bandage-outline', group: 'Health & Fitness', keywords: ['bandage', 'injury', 'clinic'] },
  { name: 'body-outline', group: 'Health & Fitness', keywords: ['body', 'therapy', 'massage', 'spa'] },
  { name: 'pulse-outline', group: 'Health & Fitness', keywords: ['pulse', 'hospital', 'checkup'] },
  { name: 'thermometer-outline', group: 'Health & Fitness', keywords: ['fever', 'checkup', 'temp'] },
  { name: 'walk-outline', group: 'Health & Fitness', keywords: ['walk', 'steps', 'running'] },
  { name: 'sparkles-outline', group: 'Health & Fitness', keywords: ['beauty', 'skincare', 'cosmetics', 'glow'] },
  { name: 'flower-outline', group: 'Health & Fitness', keywords: ['salon', 'spa', 'massage', 'relax'] },

  // Entertainment
  { name: 'film-outline', group: 'Entertainment', keywords: ['movie', 'cinema', 'theatre', 'netflix'] },
  { name: 'ticket-outline', group: 'Entertainment', keywords: ['ticket', 'concert', 'event', 'show'] },
  { name: 'musical-notes-outline', group: 'Entertainment', keywords: ['music', 'spotify', 'song', 'audio'] },
  { name: 'play-circle-outline', group: 'Entertainment', keywords: ['media', 'streaming', 'watch'] },
  { name: 'color-palette-outline', group: 'Entertainment', keywords: ['art', 'drawing', 'painting', 'creative'] },
  { name: 'trophy-outline', group: 'Entertainment', keywords: ['trophy', 'winner', 'competition'] },
  { name: 'medal-outline', group: 'Entertainment', keywords: ['medal', 'award', 'achievement'] },
  { name: 'dice-outline', group: 'Entertainment', keywords: ['dice', 'boardgame', 'gambling', 'casino'] },
  { name: 'football-outline', group: 'Entertainment', keywords: ['football', 'soccer', 'sports'] },
  { name: 'basketball-outline', group: 'Entertainment', keywords: ['basketball', 'nba', 'sports'] },
  { name: 'tennisball-outline', group: 'Entertainment', keywords: ['tennis', 'racquet', 'sports'] },

  // Family, Pets & Social
  { name: 'people-outline', group: 'Family & Gifts', keywords: ['family', 'friends', 'people', 'social'] },
  { name: 'person-outline', group: 'Family & Gifts', keywords: ['person', 'user', 'individual'] },
  { name: 'paw-outline', group: 'Family & Gifts', keywords: ['pet', 'dog', 'cat', 'vet', 'animal'] },
  { name: 'balloon-outline', group: 'Family & Gifts', keywords: ['birthday', 'party', 'celebration'] },
  { name: 'rose-outline', group: 'Family & Gifts', keywords: ['romantic', 'date', 'flowers'] },
  { name: 'happy-outline', group: 'Family & Gifts', keywords: ['baby', 'kids', 'smile', 'joy'] },
  { name: 'leaf-outline', group: 'Family & Gifts', keywords: ['nature', 'garden', 'plants'] },

  // Financial & Business
  { name: 'cash-outline', group: 'Financial', keywords: ['money', 'cash', 'salary', 'income'] },
  { name: 'wallet-outline', group: 'Financial', keywords: ['wallet', 'pocket', 'savings'] },
  { name: 'trending-up-outline', group: 'Financial', keywords: ['investment', 'stocks', 'growth', 'profit'] },
  { name: 'trending-down-outline', group: 'Financial', keywords: ['loss', 'expense', 'decline'] },
  { name: 'stats-chart-outline', group: 'Financial', keywords: ['analytics', 'chart', 'trading'] },
  { name: 'pie-chart-outline', group: 'Financial', keywords: ['portfolio', 'budget', 'allocation'] },
  { name: 'shield-checkmark-outline', group: 'Financial', keywords: ['insurance', 'security', 'protection'] },
  { name: 'calculator-outline', group: 'Financial', keywords: ['taxes', 'calculator', 'accounting'] },
  { name: 'briefcase-outline', group: 'Financial', keywords: ['work', 'job', 'business', 'office'] },
  { name: 'lock-closed-outline', group: 'Financial', keywords: ['vault', 'safety', 'private'] },

  // Education & Work
  { name: 'book-outline', group: 'Education & Work', keywords: ['book', 'reading', 'study', 'learn'] },
  { name: 'library-outline', group: 'Education & Work', keywords: ['library', 'courses', 'education'] },
  { name: 'school-outline', group: 'Education & Work', keywords: ['school', 'college', 'university', 'tuition'] },
  { name: 'journal-outline', group: 'Education & Work', keywords: ['journal', 'notes', 'diary'] },
  { name: 'newspaper-outline', group: 'Education & Work', keywords: ['news', 'newspaper', 'press'] },

  // General & Travel
  { name: 'globe-outline', group: 'General', keywords: ['international', 'foreign', 'currency', 'world'] },
  { name: 'map-outline', group: 'General', keywords: ['map', 'travel', 'destination'] },
  { name: 'bed-outline', group: 'General', keywords: ['hotel', 'motel', 'stay', 'accommodation'] },
  { name: 'cloud-outline', group: 'General', keywords: ['cloud', 'storage', 'backup'] },
  { name: 'umbrella-outline', group: 'General', keywords: ['umbrella', 'rain', 'weather'] },
  { name: 'shapes-outline', group: 'General', keywords: ['misc', 'general', 'shapes'] },
  { name: 'star-outline', group: 'General', keywords: ['favorite', 'star', 'special'] },
  { name: 'pin-outline', group: 'General', keywords: ['location', 'pin', 'place'] },
  { name: 'time-outline', group: 'General', keywords: ['hourly', 'clock', 'time'] },
  { name: 'mail-outline', group: 'General', keywords: ['mail', 'post', 'shipping', 'courier'] },
  { name: 'ellipse-outline', group: 'General', keywords: ['other', 'dot', 'circle'] },
];

export const COLOR_PALETTE = [
  '#EF5350', '#F44336', '#E91E63', '#EC407A', '#AB47BC', '#9C27B0',
  '#7E57C2', '#5C6BC0', '#3F51B5', '#2196F3', '#42A5F5', '#29B6F6',
  '#00BCD4', '#26A69A', '#4CAF50', '#66BB6A', '#8BC34A', '#9CCC65',
  '#CDDC39', '#FFCA28', '#FFA726', '#FF7043', '#FF5722', '#8D6E63',
];

// In-memory cache of customized categories for fast synchronous lookup
let activeCategoriesCache: CategoryDefinition[] = [...DEFAULT_SPENDING_CATEGORIES];

export const updateCategoriesCache = (categories: CategoryDefinition[]) => {
  if (Array.isArray(categories) && categories.length > 0) {
    activeCategoriesCache = [...categories];
  } else {
    activeCategoriesCache = [...DEFAULT_SPENDING_CATEGORIES];
  }
};

export const getCachedCategories = (): CategoryDefinition[] => {
  return activeCategoriesCache;
};

export const getCategoryIcon = (categoryName: string): string => {
  const name = (categoryName || '').toLowerCase().trim();
  if (!name) return 'ellipse-outline';

  const found = activeCategoriesCache.find((c) => c.name.toLowerCase().trim() === name);
  if (found) return found.icon;

  const def = DEFAULT_SPENDING_CATEGORIES.find((c) => c.name.toLowerCase().trim() === name);
  return def ? def.icon : 'ellipse-outline';
};

export const getCategoryColor = (categoryName: string): string => {
  const name = (categoryName || '').toLowerCase().trim();
  if (!name) return '#4FC3F7';

  const found = activeCategoriesCache.find((c) => c.name.toLowerCase().trim() === name);
  if (found) return found.color;

  const def = DEFAULT_SPENDING_CATEGORIES.find((c) => c.name.toLowerCase().trim() === name);
  return def ? def.color : '#4FC3F7';
};

export const getCategoryGroup = (categoryName: string): string => {
  const name = (categoryName || '').toLowerCase().trim();
  if (!name) return 'General';

  const found = activeCategoriesCache.find((c) => c.name.toLowerCase().trim() === name);
  if (found) return found.group || 'General';

  const def = DEFAULT_SPENDING_CATEGORIES.find((c) => c.name.toLowerCase().trim() === name);
  return def ? def.group : 'General';
};
