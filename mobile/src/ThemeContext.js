import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({});

const darkColors = {
  bg: '#0a0b10',
  card: '#12131a',
  cardGlass: 'rgba(18, 19, 26, 0.85)',
  cardAlt: '#1a1b21',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: 'rgba(255, 255, 255, 0.06)',
  borderLight: 'rgba(255, 255, 255, 0.1)',
  brand: '#FF6B35',
  brandLight: 'rgba(255, 107, 53, 0.1)',
  brandBorder: 'rgba(255, 107, 53, 0.2)',
  brandBg: 'rgba(255, 107, 53, 0.05)',
  success: '#22C55E',
  successBg: '#22C55E20',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.05)',
  dangerBorder: 'rgba(239, 68, 68, 0.3)',
  warning: '#EAB308',
  inputBg: '#12131a',
  inputBorder: 'rgba(255, 255, 255, 0.06)',
  overlay: 'rgba(0,0,0,0.6)',
  sheetBg: '#1a1b21',
  buttonGhost: 'rgba(255,255,255,0.05)',
  placeholder: '#64748B',
  statusBar: 'light-content',
  tabBar: '#12131a',
  tabInactive: '#64748B',
  white: '#ffffff',
  progressTrack: '#1a1b21',
};

const lightColors = {
  bg: '#FBFBFE',        // Warm Aura (Luxury Porcelain)
  card: '#FFFFFF',      // Pure White (High-Depth Surface)
  cardGlass: 'rgba(255, 255, 255, 0.7)', // Liquid Glass
  cardAlt: '#F4F7FB',   // Soft Blue-Grey Accent
  text: '#0E141E',      // Deep Navy Black
  textSecondary: '#414D63', // Soft Slate
  textMuted: '#7F8EA3',    // Muted Slate
  border: 'rgba(0, 48, 120, 0.06)', 
  borderLight: 'rgba(0, 48, 120, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  brand: '#FF6B35',
  brandLight: 'rgba(255, 107, 53, 0.08)',
  brandBorder: 'rgba(255, 107, 53, 0.12)',
  brandBg: 'rgba(255, 107, 53, 0.03)',
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.08)',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.04)',
  dangerBorder: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(0, 48, 120, 0.08)',
  overlay: 'rgba(14, 20, 30, 0.2)', // Higher transparency for cleaner porcelain feel
  sheetBg: '#FFFFFF',
  buttonGhost: 'rgba(0, 48, 120, 0.03)',
  placeholder: '#94A3B8',
  statusBar: 'dark-content',
  tabBar: '#FFFFFF',
  tabInactive: '#94A3B8',
  white: '#ffffff',
  progressTrack: '#E2E8F0',
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false); // Default to Light Mode (Liquid Glass)
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('sd-theme').then(val => {
      if (val === 'light') setIsDark(false);
      setLoaded(true);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('sd-theme', next ? 'dark' : 'light');
  };

  const colors = useMemo(() => isDark ? darkColors : lightColors, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
