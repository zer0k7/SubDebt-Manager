import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme, LayoutAnimation, Platform, UIManager } from 'react-native';
import { storage } from '../storage/mmkv';
import { lightColors, darkColors, ThemeColors } from '../constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'blue' | 'green' | 'purple' | 'amber' | 'red';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  accentColor: AccentColor;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
}

export function hexToRgba(hex: string, alpha: number): string {
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

export const ACCENT_PALETTE: Record<AccentColor, {
  dark: { primary: string; secondary: string; gradient: readonly [string, string]; glow: string };
  light: { primary: string; secondary: string; gradient: readonly [string, string]; glow: string };
}> = {
  blue: {
    dark: { primary: '#4FC3F7', secondary: '#1976D2', gradient: ['#4FC3F7', '#1976D2'], glow: 'rgba(79, 195, 247, 0.4)' },
    light: { primary: '#0284c7', secondary: '#0369a1', gradient: ['#0284c7', '#0369a1'], glow: 'rgba(2, 132, 199, 0.3)' },
  },
  green: {
    dark: { primary: '#66BB6A', secondary: '#2E7D32', gradient: ['#66BB6A', '#2E7D32'], glow: 'rgba(102, 187, 106, 0.4)' },
    light: { primary: '#16a34a', secondary: '#15803d', gradient: ['#16a34a', '#15803d'], glow: 'rgba(22, 163, 74, 0.3)' },
  },
  purple: {
    dark: { primary: '#A78BFA', secondary: '#7C3AED', gradient: ['#A78BFA', '#7C3AED'], glow: 'rgba(167, 139, 250, 0.4)' },
    light: { primary: '#7c3aed', secondary: '#6d28d9', gradient: ['#7c3aed', '#6d28d9'], glow: 'rgba(124, 58, 237, 0.3)' },
  },
  amber: {
    dark: { primary: '#FFB74D', secondary: '#F57C00', gradient: ['#FFB74D', '#F57C00'], glow: 'rgba(255, 183, 77, 0.4)' },
    light: { primary: '#d97706', secondary: '#b45309', gradient: ['#d97706', '#b45309'], glow: 'rgba(217, 119, 6, 0.3)' },
  },
  red: {
    dark: { primary: '#EF5350', secondary: '#D32F2F', gradient: ['#EF5350', '#D32F2F'], glow: 'rgba(239, 83, 80, 0.4)' },
    light: { primary: '#dc2626', secondary: '#b91c1c', gradient: ['#dc2626', '#b91c1c'], glow: 'rgba(220, 38, 38, 0.3)' },
  },
};

const defaultAlpha = (alpha: number) => hexToRgba('#4FC3F7', alpha);
const defaultThemeColors: ThemeColors = {
  ...darkColors,
  accent: {
    ...darkColors.accent,
    primary: '#4FC3F7',
    primaryDark: '#1976D2',
    gradient: ['#4FC3F7', '#1976D2'],
    glow: 'rgba(79, 195, 247, 0.4)',
    alpha: defaultAlpha,
  },
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  isDark: true,
  accentColor: 'blue',
  colors: defaultThemeColors,
  setMode: () => {},
  setAccentColor: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [accentColor, setAccentColorState] = useState<AccentColor>('blue');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const savedMode = await storage.getString('app_theme');
        if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
          setModeState(savedMode as ThemeMode);
        } else {
          setModeState('dark');
        }

        const savedAccent = await storage.getString('app_accent_color');
        if (savedAccent && ['blue', 'green', 'purple', 'amber', 'red'].includes(savedAccent)) {
          setAccentColorState(savedAccent as AccentColor);
        }
      } catch (e) {
        setModeState('dark');
      } finally {
        setIsReady(true);
      }
    }
    loadTheme();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setModeState(newMode);
    await storage.set('app_theme', newMode);
  };

  const setAccentColor = async (newAccent: AccentColor) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAccentColorState(newAccent);
    await storage.set('app_accent_color', newAccent);
  };

  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemColorScheme]);

  const colors = useMemo(() => {
    const baseColors = isDark ? { ...darkColors } : { ...lightColors };
    const palette = isDark ? ACCENT_PALETTE[accentColor].dark : ACCENT_PALETTE[accentColor].light;
    const primaryHex = palette.primary;
    const secondaryHex = palette.secondary;
    const alphaFn = (opacity: number) => hexToRgba(primaryHex, opacity);

    return {
      ...baseColors,
      glass: {
        ...baseColors.glass,
        inputBorderFocused: alphaFn(0.6),
      },
      accent: {
        ...baseColors.accent,
        purple: primaryHex,
        blue: primaryHex,
        blueDark: secondaryHex,
        primary: primaryHex,
        primaryDark: secondaryHex,
        gradient: palette.gradient,
        glow: palette.glow,
        alpha: alphaFn,
      },
      shadows: {
        ...baseColors.shadows,
        purpleGlow: primaryHex,
      },
      orb: {
        ...baseColors.orb,
        violet: primaryHex,
        indigo: secondaryHex,
      },
    };
  }, [isDark, accentColor]);

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={{ mode, isDark, accentColor, colors, setMode, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
