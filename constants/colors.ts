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
    primary: string;
    primaryDark: string;
    gradient: readonly [string, string];
    glow: string;
    alpha: (opacity: number) => string;
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

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return `rgba(79, 195, 247, ${alpha})`;
  }
  let c = hex.substring(1);
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

export const darkColors: ThemeColors = {
  background: {
    primary: '#000000',
    secondary: '#070709',
    mesh: ['#000000', '#040406', '#08080c'],
  },
  glass: {
    card: '#0a0a0f',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    cardTopBorder: 'rgba(255, 255, 255, 0.14)',
    input: '#0d0d12',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    inputBorderFocused: 'rgba(56, 189, 248, 0.8)',
    buttonSecondary: 'rgba(255, 255, 255, 0.08)',
    buttonSecondaryBorder: 'rgba(255, 255, 255, 0.14)',
    nav: 'rgba(10, 10, 14, 0.96)',
    navBorder: 'rgba(255, 255, 255, 0.08)',
  },
  accent: {
    blue: '#38bdf8',
    blueDark: '#0284c7',
    amber: '#fbbf24',
    green: '#4ade80',
    red: '#f87171',
    purple: '#a855f7',
    indigo: '#6366f1',
    primary: '#38bdf8',
    primaryDark: '#0284c7',
    gradient: ['#38bdf8', '#0284c7'],
    glow: 'rgba(56, 189, 248, 0.35)',
    alpha: (opacity: number) => hexToRgba('#38bdf8', opacity),
  },
  orb: {
    indigo: '#181824',
    violet: '#1f1532',
    blue: '#0d1f33',
  },
  text: {
    primary: '#ffffff',
    secondary: '#e2e8f0',
    tertiary: '#94a3b8',
    muted: '#64748b',
    placeholder: '#475569',
  },
  status: {
    active: { bg: 'rgba(74, 222, 128, 0.15)', border: 'rgba(74, 222, 128, 0.5)', text: '#4ade80' },
    expiring: { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.5)', text: '#fbbf24' },
    expired: { bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.5)', text: '#f87171' },
    paid: { bg: 'rgba(74, 222, 128, 0.12)', border: 'rgba(74, 222, 128, 0.35)', text: '#4ade80' },
  },
  badge: { glass: 'rgba(255, 255, 255, 0.06)' },
  shadows: { purpleGlow: '#a855f7', blueGlow: '#38bdf8', amberGlow: '#fbbf24' },
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
    primary: '#0284c7',
    primaryDark: '#0369a1',
    gradient: ['#0284c7', '#0369a1'],
    glow: 'rgba(2, 132, 199, 0.3)',
    alpha: (opacity: number) => hexToRgba('#0284c7', opacity),
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

export const colors = darkColors;

export const avatarColors = [
  '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA',
  '#26A69A', '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726', '#FF7043',
];
