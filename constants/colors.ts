import { ColorSchemeName } from 'react-native';

export type ThemeColors = {
  background: {
    primary: string;
    secondary: string;
    mesh: readonly [string, string, string];
  };
  glass: {
    card: string;
    cardBorder: string;
    cardTopBorder: string;
    input: string;
    inputBorder: string;
    inputBorderFocused: string;
    buttonSecondary: string;
    buttonSecondaryBorder: string;
    nav: string;
    navBorder: string;
  };
  accent: {
    blue: string;
    blueDark: string;
    amber: string;
    green: string;
    red: string;
    purple: string;
    indigo: string;
  };
  orb: {
    indigo: string;
    violet: string;
    blue: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
    placeholder: string;
  };
  status: {
    active: { bg: string; border: string; text: string };
    expiring: { bg: string; border: string; text: string };
    expired: { bg: string; border: string; text: string };
    paid: { bg: string; border: string; text: string };
  };
  badge: {
    glass: string;
  };
  shadows: {
    purpleGlow: string;
    blueGlow: string;
    amberGlow: string;
  };
};

export const darkColors: ThemeColors = {
  background: {
    primary: '#0a0a0f',
    secondary: '#12082a',
    mesh: ['#0a0a0f', '#12082a', '#1a1040'],
  },
  glass: {
    card: 'rgba(255,255,255,0.06)',
    cardBorder: 'rgba(255,255,255,0.13)',
    cardTopBorder: 'rgba(255,255,255,0.25)',
    input: 'rgba(255,255,255,0.05)',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputBorderFocused: 'rgba(79,195,247,0.6)',
    buttonSecondary: 'rgba(255,255,255,0.08)',
    buttonSecondaryBorder: 'rgba(255,255,255,0.15)',
    nav: 'rgba(255,255,255,0.1)',
    navBorder: 'rgba(255,255,255,0.15)',
  },
  accent: {
    blue: '#4FC3F7',
    blueDark: '#1976D2',
    amber: '#FFB74D',
    green: '#66BB6A',
    red: '#EF5350',
    purple: '#7c3aed',
    indigo: '#3730a3',
  },
  orb: {
    indigo: '#3730a3',
    violet: '#7c3aed',
    blue: '#1d4ed8',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255,255,255,0.7)',
    tertiary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.4)',
    placeholder: 'rgba(255,255,255,0.35)',
  },
  status: {
    active: { bg: 'rgba(102,187,106,0.2)', border: 'rgba(102,187,106,0.6)', text: '#66BB6A' },
    expiring: { bg: 'rgba(255,183,77,0.2)', border: 'rgba(255,183,77,0.6)', text: '#FFB74D' },
    expired: { bg: 'rgba(239,83,80,0.2)', border: 'rgba(239,83,80,0.6)', text: '#EF5350' },
    paid: { bg: 'rgba(102,187,106,0.15)', border: 'rgba(102,187,106,0.4)', text: '#66BB6A' },
  },
  badge: { glass: 'rgba(255,255,255,0.06)' },
  shadows: { purpleGlow: '#7c3aed', blueGlow: '#4FC3F7', amberGlow: '#FFB74D' },
};

export const lightColors: ThemeColors = {
  background: {
    primary: '#ffffff',
    secondary: '#f1f5f9',
    mesh: ['#ffffff', '#f1f5f9', '#e2e8f0'],
  },
  glass: {
    card: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.06)',
    cardTopBorder: 'rgba(0,0,0,0.02)',
    input: 'rgba(0,0,0,0.03)',
    inputBorder: 'rgba(0,0,0,0.08)',
    inputBorderFocused: 'rgba(2,132,199,0.5)',
    buttonSecondary: 'rgba(0,0,0,0.05)',
    buttonSecondaryBorder: 'rgba(0,0,0,0.08)',
    nav: 'rgba(255,255,255,0.9)',
    navBorder: 'rgba(0,0,0,0.08)',
  },
  accent: {
    blue: '#0284c7',
    blueDark: '#0369a1',
    amber: '#f59e0b',
    green: '#16a34a',
    red: '#dc2626',
    purple: '#7c3aed',
    indigo: '#4f46e5',
  },
  orb: {
    indigo: '#e0e7ff',
    violet: '#ede9fe',
    blue: '#e0f2fe',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    muted: '#94a3b8',
    placeholder: '#cbd5e1',
  },
  status: {
    active: { bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.3)', text: '#16a34a' },
    expiring: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
    expired: { bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)', text: '#dc2626' },
    paid: { bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.3)', text: '#16a34a' },
  },
  badge: { glass: 'rgba(0,0,0,0.05)' },
  shadows: { purpleGlow: 'rgba(124,58,237,0.2)', blueGlow: 'rgba(2,132,199,0.2)', amberGlow: 'rgba(245,158,11,0.2)' },
};

// Default export for legacy support (temporarily keeps current imports from breaking completely while we refactor)
export const colors = darkColors;

export const avatarColors = [
  '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA',
  '#26A69A', '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726', '#FF7043',
];
