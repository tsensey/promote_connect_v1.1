'use client';

import { useEffect, useState, useCallback } from 'react';

type DeferredPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export function PwaRegister() {
  const [offline, setOffline] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPrompt | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handler = (reg: ServiceWorkerRegistration) => {
      setRegistration(reg);
      if (reg.waiting) setUpdateAvailable(true);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (sw) {
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });
    };

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(handler)
      .catch(console.error);

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      setUpdateAvailable(false);
      window.location.reload();
    });
  }, []);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as DeferredPrompt);
      setInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const handler = () => setInstallable(false);
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const applyUpdate = useCallback(() => {
    if (!registration?.waiting) return;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }, [registration]);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstallable(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return (
    <>
      {installable && (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg">
          <span>Installer PROMOTE-CONNECT</span>
          <button onClick={installApp} className="underline underline-offset-2 hover:no-underline">
            Installer
          </button>
          <button onClick={() => setInstallable(false)} className="ml-1 opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}
      {offline && !installable && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg">
          Vous êtes hors ligne — certaines fonctionnalités peuvent être limitées
        </div>
      )}
      {updateAvailable && !installable && (
        <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg">
          <span>Nouvelle version disponible</span>
          <button onClick={applyUpdate} className="underline underline-offset-2 hover:no-underline">
            Actualiser
          </button>
        </div>
      )}
    </>
  );
}
