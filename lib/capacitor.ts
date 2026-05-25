/**
 * Capacitor utilities and platform detection
 * Provides helpers for detecting and working with Capacitor platforms
 */

import { Capacitor } from '@capacitor/core';

import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { handleIncomingAppUrl } from './appReturn';
import { logger } from './logger';

/**
 * Check if running on a native platform
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if running on web
 */
export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Get the current platform
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};

/**
 * Initialize Capacitor app lifecycle
 * Call this in your main App component
 */
export const initializeCapacitor = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    // Hide splash screen after app is ready
    await SplashScreen.hide();

    const applyIncomingUrl = async (url?: string | null) => {
      if (!url) {
        return;
      }

      const internalRoute = await handleIncomingAppUrl(url);
      if (internalRoute) {
        window.location.hash = internalRoute.startsWith("/")
          ? `#${internalRoute}`
          : internalRoute;
      }
    };

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      logger.info('App state changed. Is active?', isActive);
    });

    const launchData = await App.getLaunchUrl();
    await applyIncomingUrl(launchData?.url);

    // Handle app URL open (deep linking)
    App.addListener('appUrlOpen', async (data) => {
      logger.info('App opened with URL:', data.url);
      await applyIncomingUrl(data.url);
    });

    // Handle back button on Android
    if (isAndroid()) {
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
    }
  } catch (error) {
    logger.error('Error initializing Capacitor:', error);
  }
};

/**
 * Get app info
 */
export const getAppInfo = async () => {
  if (!isNativePlatform()) {
    return null;
  }

  try {
    const info = await App.getInfo();
    return info;
  } catch (error) {
    logger.error('Error getting app info:', error);
    return null;
  }
};

/**
 * Show splash screen
 */
export const showSplash = async (): Promise<void> => {
  if (isNativePlatform()) {
    await SplashScreen.show({
      showDuration: 2000,
      autoHide: true,
    });
  }
};

/**
 * Hide splash screen
 */
export const hideSplash = async (): Promise<void> => {
  if (isNativePlatform()) {
    await SplashScreen.hide();
  }
};
