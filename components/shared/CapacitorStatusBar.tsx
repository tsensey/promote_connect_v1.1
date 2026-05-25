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

    StatusBar.setStyle({
      style: currentTheme === 'dark' ? Style.Dark : Style.Light,
    }).catch(() => {});

    // iOS: scroll to top on status bar tap
    window.addEventListener('statusTap', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [theme, systemTheme]);

  return null;
}
