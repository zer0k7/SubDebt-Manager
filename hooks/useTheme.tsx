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

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  isDark: true,
  accentColor: 'blue',
  colors: darkColors,
  setMode: () => {},
  setAccentColor: () => {},
});

const ACCENT_HEX_MAP: Record<AccentColor, string> = {
  blue: '#4FC3F7',
  green: '#66BB6A',
  purple: '#A78BFA',
  amber: '#FFB74D',
  red: '#EF5350',
};

const ACCENT_HEX_LIGHT_MAP: Record<AccentColor, string> = {
  blue: '#0284c7',
  green: '#16a34a',
  purple: '#7c3aed',
  amber: '#d97706',
  red: '#dc2626',
};

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
    const hex = isDark ? ACCENT_HEX_MAP[accentColor] : ACCENT_HEX_LIGHT_MAP[accentColor];
    
    return {
      ...baseColors,
      accent: {
        ...baseColors.accent,
        blue: hex,
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
