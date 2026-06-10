"use client";

import { useEffect } from 'react';
import { useAnalytics } from '@/lib/analytics/plausible';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export function InstallTracker() {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    // 1. PWA Installation Tracking
    const handleAppInstalled = () => {
      trackEvent('pwa_installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 2. Capacitor (Mobile App) First Open Tracking
    const checkCapacitorInstall = async () => {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: 'has_opened_before' });
        
        if (!value) {
          trackEvent('apk_first_open');
          await Preferences.set({ key: 'has_opened_before', value: 'true' });
        }
      }
    };

    checkCapacitorInstall();

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [trackEvent]);

  return null;
}
