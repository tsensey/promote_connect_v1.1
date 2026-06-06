'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { AppStoreBadges } from '@/components/shared/AppStoreBadges';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[90vh] md:min-h-screen overflow-hidden flex items-center justify-center pt-24 pb-12 hero-gradient">
      {/* Background World Map */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/world-map-dots.webp"
          alt=""
          fill
          className="object-cover opacity-40 mix-blend-screen animate-pulse-subtle"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-hero-bg/80 via-transparent to-hero-bg z-10" />
      </div>

      <div className="absolute top-1/4 right-1/4 size-[500px] md:size-[700px] rounded-full bg-hero-accent/5 blur-[120px] animate-pulse-subtle pointer-events-none z-10" />

      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="text-left space-y-6 md:space-y-8 animate-reveal">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] sm:text-xs font-semibold text-white tracking-widest uppercase backdrop-blur-md">
              <span className="size-2 rounded-full bg-hero-accent animate-pulse" />
              {t('landing.hero.badge')}
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tighter text-hero-foreground drop-shadow-lg">
              {t('landing.hero.tagline')}
            </h1>

            <p className="max-w-lg text-base sm:text-lg leading-relaxed text-hero-foreground-muted font-light text-balance">
              {t('landing.hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="default" size="lg" className="w-full h-12 px-8 text-base font-bold rounded-full bg-hero-accent text-hero-bg hover:bg-hero-accent/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/20">
                  {t('landing.hero.cta')}
                </Button>
              </Link>
              <a href="#features" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full h-12 px-8 text-base font-semibold rounded-full border-white/20 bg-white/5 text-hero-foreground backdrop-blur-md hover:bg-white/10 transition-colors">
                  {t('landing.hero.learn_more')}
                </Button>
              </a>
            </div>

            <div className="pt-4 space-y-4">
              <AppStoreBadges variant="light" />
              <p className="text-xs text-white/50 font-medium">
                {t('landing.hero.organized_by').split('{link}').map((part, i) => {
                  if (i === 0) return part;
                  const [label, rest] = part.split('{/link}');
                  return (
                    <span key={i}>
                      <a
                        href="https://www.interprogress.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/80 underline underline-offset-2 hover:text-white transition-colors"
                      >
                        {label}
                      </a>
                      {rest}
                    </span>
                  );
                })}
              </p>
            </div>
          </div>

          {/* Right Column: Phone Mockup */}
          <div className="hidden lg:flex relative animate-reveal-delay-1 items-center justify-center">
            <div className="absolute inset-0 bg-hero-accent/10 rounded-full blur-3xl opacity-30 animate-float" />
            <div className="relative w-[320px] xl:w-[360px]">
              <div className="relative aspect-[9/19] rounded-[40px] border-4 border-white/20 bg-black shadow-2xl shadow-black/40 overflow-hidden">
                <Image
                  src="/mobile_app_display.webp"
                  alt="PROMOTE-CONNECT App"
                  fill
                  className="object-cover"
                  sizes="360px"
                  priority
                />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-2xl" />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/40 font-medium tracking-wider uppercase">
                PROMOTE-CONNECT
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-hero-bg to-transparent z-10" />
    </section>
  );
}
