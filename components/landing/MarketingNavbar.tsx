'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { LocaleToggle } from '@/components/ui/locale-toggle';

export function MarketingNavbar() {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary font-bold text-sm text-primary-foreground">
            P
          </span>
          <span className="font-semibold tracking-tight">PROMOTE-CONNECT</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('landing.nav.features')}
          </a>
          <a
            href="https://salon-promote.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('landing.nav.salon')}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <LocaleToggle />
          <Link href="/login">
            <Button variant="default" size="sm">
              {t('landing.nav.login')}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
