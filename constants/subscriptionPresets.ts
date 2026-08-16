import { BillingCycle } from '../hooks/useSubscriptions';
import { IconKey } from '../utils/subscriptionIcons';

export interface SubscriptionPreset {
  id: string;
  name: string;
  category: string;
  billingCycle: BillingCycle;
  defaultAmount?: number;
  currency?: string;
  iconKey: IconKey;
  color?: string;
  popularCategory: 'Entertainment' | 'AI' | 'Productivity' | 'Gaming' | 'Telecom' | 'Utilities';
}

export const SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  // AI
  { id: 'chatgpt', name: 'ChatGPT Plus', category: 'AI', billingCycle: 'monthly', defaultAmount: 1999, currency: 'INR', iconKey: 'chatgpt', color: '#10A37F', popularCategory: 'AI' },
  { id: 'claude', name: 'Claude Pro', category: 'AI', billingCycle: 'monthly', defaultAmount: 1999, currency: 'INR', iconKey: 'claude', color: '#D97706', popularCategory: 'AI' },
  { id: 'gemini', name: 'Gemini Advanced', category: 'AI', billingCycle: 'monthly', defaultAmount: 1950, currency: 'INR', iconKey: 'gemini', color: '#4A90E2', popularCategory: 'AI' },
  { id: 'copilot', name: 'GitHub Copilot', category: 'Dev Tools', billingCycle: 'monthly', defaultAmount: 850, currency: 'INR', iconKey: 'copilot', color: '#000000', popularCategory: 'AI' },

  // Entertainment / OTT
  { id: 'netflix', name: 'Netflix', category: 'Entertainment', billingCycle: 'monthly', defaultAmount: 649, currency: 'INR', iconKey: 'netflix', color: '#E50914', popularCategory: 'Entertainment' },
  { id: 'spotify', name: 'Spotify Premium', category: 'Entertainment', billingCycle: 'monthly', defaultAmount: 119, currency: 'INR', iconKey: 'spotify', color: '#1DB954', popularCategory: 'Entertainment' },
  { id: 'youtube', name: 'YouTube Premium', category: 'Entertainment', billingCycle: 'monthly', defaultAmount: 149, currency: 'INR', iconKey: 'youtube', color: '#FF0000', popularCategory: 'Entertainment' },
  { id: 'primevideo', name: 'Amazon Prime', category: 'Entertainment', billingCycle: 'yearly', defaultAmount: 1499, currency: 'INR', iconKey: 'primevideo', color: '#00A8E1', popularCategory: 'Entertainment' },
  { id: 'hotstar', name: 'Disney+ Hotstar', category: 'Entertainment', billingCycle: 'yearly', defaultAmount: 899, currency: 'INR', iconKey: 'hotstar', color: '#0C111B', popularCategory: 'Entertainment' },
  { id: 'applemusic', name: 'Apple Music', category: 'Entertainment', billingCycle: 'monthly', defaultAmount: 99, currency: 'INR', iconKey: 'applemusic', color: '#FC3C44', popularCategory: 'Entertainment' },
  { id: 'jiocinema', name: 'JioCinema Premium', category: 'Entertainment', billingCycle: 'monthly', defaultAmount: 29, currency: 'INR', iconKey: 'jiocinema', color: '#D81B60', popularCategory: 'Entertainment' },
  { id: 'crunchyroll', name: 'Crunchyroll Mega Fan', category: 'Entertainment', billingCycle: 'yearly', defaultAmount: 999, currency: 'INR', iconKey: 'crunchyroll', color: '#F47521', popularCategory: 'Entertainment' },

  // Productivity & Cloud
  { id: 'googleone', name: 'Google One 100GB', category: 'Utilities', billingCycle: 'monthly', defaultAmount: 130, currency: 'INR', iconKey: 'googleone', color: '#4285F4', popularCategory: 'Productivity' },
  { id: 'notion', name: 'Notion Plus', category: 'Productivity', billingCycle: 'monthly', defaultAmount: 800, currency: 'INR', iconKey: 'notion', color: '#000000', popularCategory: 'Productivity' },
  { id: 'figma', name: 'Figma Professional', category: 'Productivity', billingCycle: 'monthly', defaultAmount: 1200, currency: 'INR', iconKey: 'figma', color: '#F24E1E', popularCategory: 'Productivity' },
  { id: 'adobe', name: 'Adobe Creative Cloud', category: 'Productivity', billingCycle: 'monthly', defaultAmount: 2400, currency: 'INR', iconKey: 'adobe', color: '#FF0000', popularCategory: 'Productivity' },
  { id: 'canva', name: 'Canva Pro', category: 'Productivity', billingCycle: 'monthly', defaultAmount: 499, currency: 'INR', iconKey: 'canva', color: '#00C4CC', popularCategory: 'Productivity' },
  { id: 'github', name: 'GitHub Pro', category: 'Dev Tools', billingCycle: 'monthly', defaultAmount: 350, currency: 'INR', iconKey: 'github', color: '#181717', popularCategory: 'Productivity' },

  // Gaming
  { id: 'playstation', name: 'PlayStation Plus', category: 'Gaming', billingCycle: 'yearly', defaultAmount: 3999, currency: 'INR', iconKey: 'playstation', color: '#003791', popularCategory: 'Gaming' },
  { id: 'xbox', name: 'Xbox Game Pass', category: 'Gaming', billingCycle: 'monthly', defaultAmount: 549, currency: 'INR', iconKey: 'xbox', color: '#107C10', popularCategory: 'Gaming' },

  // Telecom & Utilities
  { id: 'jio', name: 'Jio Postpaid Plus', category: 'Recharges', billingCycle: 'monthly', defaultAmount: 399, currency: 'INR', iconKey: 'jio', color: '#0A3A82', popularCategory: 'Telecom' },
  { id: 'airtel', name: 'Airtel Postpaid', category: 'Recharges', billingCycle: 'monthly', defaultAmount: 499, currency: 'INR', iconKey: 'airtel', color: '#ED1C24', popularCategory: 'Telecom' },
  { id: 'swiggy', name: 'Swiggy One', category: 'Utilities', billingCycle: 'monthly', defaultAmount: 149, currency: 'INR', iconKey: 'swiggy', color: '#FC8019', popularCategory: 'Utilities' },
  { id: 'zomato', name: 'Zomato Gold', category: 'Utilities', billingCycle: 'monthly', defaultAmount: 99, currency: 'INR', iconKey: 'zomato', color: '#CB202D', popularCategory: 'Utilities' },
];
