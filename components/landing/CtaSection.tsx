'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {
  const { t } = useTranslation();

  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="surface-card relative overflow-hidden p-12 text-center sm:p-16">
          <div className="pointer-events-none absolute -top-20 -right-20 size-[300px] rounded-full bg-primary opacity-[0.06] blur-3xl" />

          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
            {t('landing.cta.title')}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">
            {t('landing.cta.subtitle')}
          </p>
          <Link href="/login" className="relative mt-8 inline-block">
            <Button variant="default" size="lg" className="h-11 px-8 text-base">
              {t('landing.cta.button')}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
