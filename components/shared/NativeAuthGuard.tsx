'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { supabaseClient } from '@/lib/client';

export function NativeAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        if (!Capacitor.isNativePlatform()) return;
      } catch {
        return;
      }

      // Si le path n'est pas la racine (ex: fallback SPA vers index.html pour une route dynamique),
      // ne pas rediriger afin de laisser le router client Next.js hydrater et gérer la route.
      const path = window.location.pathname;
      if (path !== '/' && path !== '/index.html' && path !== '') {
        return;
      }

      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        router.replace('/login');
      } else {
        router.replace('/feed');
      }
    };

    checkAndRedirect();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
