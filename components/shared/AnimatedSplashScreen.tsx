'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { isNativePlatform } from '@/lib/capacitor';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnimatedSplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Only show the animated web splash screen on native platforms (or all if desired)
    // If we only want it on Android/iOS, we check isNativePlatform()
    if (!isNativePlatform()) {
      setIsVisible(false);
      return;
    }

    // Hide the React splash screen after a short delay to allow the animation to play
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 500); // 500ms fade out duration
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#581F47] transition-opacity duration-500 ease-in-out',
        isFading ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
        <div className="relative w-32 h-32 mb-6 bg-white rounded-2xl p-2 shadow-2xl">
          <Image
            src="/logo_transparent.png"
            alt="PROMOTE-CONNECT Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-wider mb-8 drop-shadow-md">
          Promote Connect
        </h1>
        <Loader2 className="w-10 h-10 text-white animate-spin opacity-80" />
      </div>
    </div>
  );
}
