'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[90vh] overflow-hidden pt-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="brand-gradient absolute -top-40 -right-40 size-[600px] rounded-full opacity-[0.04] blur-3xl" />
        <div className="brand-gradient absolute -bottom-40 -left-40 size-[500px] rounded-full opacity-[0.03] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(90vh-96px)] max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-6">
          <Image
            src="/logo-promote.png"
            alt="PROMOTE"
            width={80}
            height={80}
            className="shrink-0"
          />
          <div className="hidden h-12 w-px bg-border/50 sm:block" />
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <span className="size-2 rounded-full bg-primary" />
            {t('landing.hero.badge')}
          </div>
        </div>

        <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          {t('landing.hero.tagline')}
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
          {t('landing.hero.description')}
        </p>

        <Link href="/login" className="mt-8">
          <Button variant="default" size="lg" className="h-11 px-8 text-base">
            {t('landing.hero.cta')}
          </Button>
        </Link>

        <p className="mt-6 text-xs text-muted-foreground/60">
          {t('landing.hero.organized_by').split('{link}').map((part, i) => {
            if (i === 0) return part;
            const [label, rest] = part.split('{/link}');
            return (
              <span key={i}>
                <a
                  href="https://www.interprogress.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  {label}
                </a>
                {rest}
              </span>
            );
          })}
        </p>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>
    </section>
  );
}
