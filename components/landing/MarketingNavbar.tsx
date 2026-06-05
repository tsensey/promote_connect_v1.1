'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { LocaleToggle } from '@/components/ui/locale-toggle';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function MarketingNavbar() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "border-b border-border/50 bg-background py-0" 
          : "bg-transparent border-transparent py-2"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="relative h-8 sm:h-10 w-[90px] sm:w-[110px] overflow-hidden rounded-lg transition-transform group-hover:scale-110">
            <Image
              src="/logo_promopte_connect.webp"
              alt="PROMOTE-CONNECT"
              fill
              className="object-contain rounded-lg"
              sizes="110px"
            />
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              !isScrolled ? "text-white/90 hover:text-white" : "text-muted-foreground"
            )}
          >
            {t('landing.nav.features')}
          </a>
          <a
            href="https://salon-promote.org"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              !isScrolled ? "text-white/90 hover:text-white" : "text-muted-foreground"
            )}
          >
            {t('landing.nav.salon')}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <LocaleToggle />
          <Link href="/login">
            <Button
              variant={isScrolled ? "default" : "outline"}
              size="sm"
              className={cn(
                !isScrolled && "border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              )}
            >
              {t('landing.nav.login')}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
