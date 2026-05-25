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
