'use client';

import { useEffect, useState, useCallback } from 'react';

export function PwaRegister() {
  const [offline, setOffline] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // window.addEventListener('beforeinstallprompt', (e) => {
    //   e.preventDefault();
    //   // TODO: implémenter un bouton d'installation personnalisé si nécessaire
    // });

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

  const applyUpdate = useCallback(() => {
    if (!registration?.waiting) return;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }, [registration]);

  return (
    <>
      {offline && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground">
          Vous êtes hors ligne — certaines fonctionnalités peuvent être limitées
        </div>
      )}
      {updateAvailable && (
        <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <span>Nouvelle version disponible</span>
          <button onClick={applyUpdate} className="underline underline-offset-2 hover:no-underline">
            Actualiser
          </button>
        </div>
      )}
    </>
  );
}
