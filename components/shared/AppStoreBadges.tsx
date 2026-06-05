'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AppStoreBadgesProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function AppStoreBadges({ className }: AppStoreBadgesProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <a
        href="https://play.google.com/store/apps/details?id=com.promoteconnect.app&pcampaignid=web_share"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-opacity hover:opacity-80 active:opacity-70"
      >
        <Image
          src="/get-it-on-google-play-badge-seeklogo.png"
          alt="Get it on Google Play"
          width={172}
          height={52}
          className="h-12 w-auto"
          priority
        />
      </a>
    </div>
  );
}
