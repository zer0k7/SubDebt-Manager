export interface CategoryDefinition {
  name: string;
  icon: string;
  color: string;
  group: string;
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

export const SPENDING_CATEGORIES: CategoryDefinition[] = [
  // Food & Dining
  { name: 'Food', icon: 'restaurant-outline', color: '#EF5350', group: 'Food & Dining' },
  { name: 'Dining Out', icon: 'fast-food-outline', color: '#FF7043', group: 'Food & Dining' },
  { name: 'Groceries', icon: 'cart-outline', color: '#66BB6A', group: 'Food & Dining' },
  { name: 'Snacks & Coffee', icon: 'cafe-outline', color: '#FFA726', group: 'Food & Dining' },
  { name: 'Drinks & Bar', icon: 'beer-outline', color: '#AB47BC', group: 'Food & Dining' },

  // Transportation
  { name: 'Travel', icon: 'car-outline', color: '#4FC3F7', group: 'Transportation' },
  { name: 'Fuel & Gas', icon: 'flame-outline', color: '#FF5722', group: 'Transportation' },
  { name: 'Taxi & Rideshare', icon: 'subway-outline', color: '#FFCA28', group: 'Transportation' },
  { name: 'Vehicle Maint.', icon: 'build-outline', color: '#78909C', group: 'Transportation' },
  { name: 'Parking & Tolls', icon: 'navigate-outline', color: '#26A69A', group: 'Transportation' },

  // Shopping
  { name: 'Shopping', icon: 'bag-handle-outline', color: '#EC407A', group: 'Shopping' },
  { name: 'Clothing', icon: 'shirt-outline', color: '#F06292', group: 'Shopping' },
  { name: 'Electronics', icon: 'laptop-outline', color: '#42A5F5', group: 'Shopping' },
  { name: 'Personal Care', icon: 'sparkles-outline', color: '#26C6DA', group: 'Shopping' },
  { name: 'Beauty & Salon', icon: 'flower-outline', color: '#E91E63', group: 'Shopping' },

  // Bills & Housing
  { name: 'Bills', icon: 'document-text-outline', color: '#5C6BC0', group: 'Bills & Housing' },
  { name: 'Recharge', icon: 'flash-outline', color: '#29B6F6', group: 'Bills & Housing' },
  { name: 'Rent & Housing', icon: 'home-outline', color: '#8D6E63', group: 'Bills & Housing' },
  { name: 'Home Repair', icon: 'hammer-outline', color: '#A1887F', group: 'Bills & Housing' },
  { name: 'Subscriptions', icon: 'card-outline', color: '#7E57C2', group: 'Bills & Housing' },

  // Health & Fitness
  { name: 'Health', icon: 'heart-outline', color: '#EF5350', group: 'Health & Fitness' },
  { name: 'Pharmacy', icon: 'medkit-outline', color: '#E57373', group: 'Health & Fitness' },
  { name: 'Fitness & Gym', icon: 'barbell-outline', color: '#9CCC65', group: 'Health & Fitness' },

  // Education & Work
  { name: 'Study', icon: 'book-outline', color: '#7E57C2', group: 'Education & Work' },
  { name: 'Courses & Books', icon: 'library-outline', color: '#5C6BC0', group: 'Education & Work' },
  { name: 'Office & Work', icon: 'briefcase-outline', color: '#3F51B5', group: 'Education & Work' },

  // Entertainment
  { name: 'Entertainment', icon: 'film-outline', color: '#AB47BC', group: 'Entertainment' },
  { name: 'Gaming', icon: 'game-controller-outline', color: '#9C27B0', group: 'Entertainment' },
  { name: 'Events & Outings', icon: 'ticket-outline', color: '#BA68C8', group: 'Entertainment' },

  // Family & Gifts
  { name: 'Gifts', icon: 'gift-outline', color: '#FF4081', group: 'Family & Gifts' },
  { name: 'Pets', icon: 'paw-outline', color: '#FFA726', group: 'Family & Gifts' },
  { name: 'Kids & Family', icon: 'people-outline', color: '#26A69A', group: 'Family & Gifts' },

  // Financial
  { name: 'Investments', icon: 'trending-up-outline', color: '#66BB6A', group: 'Financial' },
  { name: 'Insurance', icon: 'shield-checkmark-outline', color: '#42A5F5', group: 'Financial' },
  { name: 'Debt & EMI', icon: 'cash-outline', color: '#FF7043', group: 'Financial' },

  // General
  { name: 'Miscellaneous', icon: 'shapes-outline', color: '#78909C', group: 'General' },
  { name: 'Other', icon: 'ellipse-outline', color: '#B0BEC5', group: 'General' },
];

export const getCategoryIcon = (categoryName: string): string => {
  const cat = SPENDING_CATEGORIES.find(
    (c) => c.name.toLowerCase() === (categoryName || '').toLowerCase()
  );
  return cat ? cat.icon : 'ellipse-outline';
};

export const getCategoryColor = (categoryName: string): string => {
  const cat = SPENDING_CATEGORIES.find(
    (c) => c.name.toLowerCase() === (categoryName || '').toLowerCase()
  );
  return cat ? cat.color : '#4FC3F7';
};

export const getCategoryGroup = (categoryName: string): string => {
  const cat = SPENDING_CATEGORIES.find(
    (c) => c.name.toLowerCase() === (categoryName || '').toLowerCase()
  );
  return cat ? cat.group : 'General';
};
