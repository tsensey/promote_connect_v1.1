'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export function CapacitorStatusBar() {
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const currentTheme = theme === 'system' ? systemTheme : theme;
    
    // Style.Dark signifie que l'arrière-plan est sombre, donc les icônes deviennent claires (Light)
    // Style.Light signifie que l'arrière-plan est clair, donc les icônes deviennent sombres (Dark)
    const setStatusBarStyle = async () => {
      try {
        await StatusBar.setStyle({
          style: currentTheme === 'dark' ? Style.Dark : Style.Light,
        });
      } catch (e) {
        console.warn('StatusBar plugin not available', e);
      }
    };

    setStatusBarStyle();
  }, [theme, systemTheme]);

  return null;
}
