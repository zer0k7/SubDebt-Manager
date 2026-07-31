import { subscriptionIconMap } from '../constants/subscriptionIconMap';
import { avatarColors } from '../constants/colors';

export type IconKey = 
  // Original 14
  | 'netflix' | 'youtube' | 'spotify' | 'chatgpt' | 'claude'
  | 'github' | 'notion' | 'figma' | 'adobe' | 'disney'
  | 'amazon' | 'applemusic' | 'googleone' | 'microsoft'
  | 'gemini' | 'google' | 'copilot'
  // Streaming
  | 'primevideo' | 'hotstar' | 'hbo' | 'hulu' | 'sonyliv'
  | 'zee5' | 'jiocinema' | 'crunchyroll'
  // Music
  | 'jiosaavn' | 'gaana' | 'wynk' | 'audible'
  // Gaming
  | 'playstation' | 'xbox' | 'steam' | 'nintendo' | 'epicgames'
  // Communication
  | 'discord' | 'slack' | 'zoom' | 'twitch' | 'linkedin'
  // Productivity
  | 'dropbox' | 'canva' | 'grammarly'
  // Security
  | 'onepassword' | 'lastpass' | 'bitwarden'
  | 'nordvpn' | 'expressvpn' | 'surfshark' | 'protonvpn'
  // Education
  | 'duolingo' | 'coursera' | 'udemy'
  // Indian Telecom
  | 'jio' | 'airtel' | 'vi' | 'bsnl'
  // Indian Services
  | 'swiggy' | 'zomato' | 'timesprime'
  // Cloud & Dev
  | 'aws' | 'vercel' | 'cloudflare' | 'digitalocean';

export interface SubscriptionIconResult {
  type: 'brand' | 'fallback';
  iconKey?: IconKey;
  letter?: string;
  color?: string;
}

export const getSubscriptionIcon = (name: string): SubscriptionIconResult => {
  if (!name || typeof name !== 'string') {
    return {
      type: 'fallback',
      letter: '?',
      color: avatarColors[0],
    };
  }

  const normalized = name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');

  for (const [keyword, iconKey] of Object.entries(subscriptionIconMap)) {
    if (normalized.includes(keyword)) {
      return {
        type: 'brand',
        iconKey: iconKey as IconKey,
      };
    }
  }

  // Fallback avatar
  const firstLetter = name.charAt(0).toUpperCase();
  const hash = normalized.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  const colorIndex = hash % avatarColors.length;

  return {
    type: 'fallback',
    letter: firstLetter || '?',
    color: avatarColors[colorIndex],
  };
};

export const getIconKeyFromName = (name: string): string | undefined => {
  const normalized = name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  
  for (const [keyword, iconKey] of Object.entries(subscriptionIconMap)) {
    if (normalized.includes(keyword)) {
      return iconKey;
    }
  }
  
  return undefined;
};
