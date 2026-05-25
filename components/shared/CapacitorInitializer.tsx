'use client';

import { useEffect } from 'react';
import { initializeCapacitor } from '@/lib/capacitor';

export function CapacitorInitializer() {
  useEffect(() => {
    initializeCapacitor();
  }, []);

  return null;
}
