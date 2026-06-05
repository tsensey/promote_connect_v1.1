'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from '@/components/shared/ScrollReveal';

export function CtaSection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <div className="brand-gradient absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] md:size-[800px] rounded-full opacity-[0.05] blur-[120px] md:blur-[140px] animate-pulse-subtle" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal>
          <div className="bg-primary rounded-[2rem] md:rounded-[48px] p-8 sm:p-16 md:p-20 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-6 md:space-y-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-primary-foreground leading-[1.1]">
                {t('landing.cta.title')}
              </h2>
              <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-primary-foreground/80 leading-relaxed font-medium">
                {t('landing.cta.subtitle')}
              </p>
              <div className="pt-4">
                <Link href="/login" className="inline-block w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto h-14 md:h-16 px-10 md:px-12 text-base md:text-lg font-bold rounded-full group-hover:scale-105 transition-all duration-300 active:scale-95 shadow-lg shadow-black/20">
                    {t('landing.cta.button')}
                    <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Decorative animated rings */}
            <div className="absolute -bottom-20 -right-20 size-60 md:size-80 rounded-full border-[30px] md:border-[40px] border-white/5 pointer-events-none animate-float" style={{ animationDelay: '-2s' }} />
            <div className="absolute -top-20 -left-20 size-60 md:size-80 rounded-full border-[30px] md:border-[40px] border-white/5 pointer-events-none animate-float" style={{ animationDelay: '-4s' }} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
