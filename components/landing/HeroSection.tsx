'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[90vh] md:min-h-screen overflow-hidden flex items-center justify-center pt-24 pb-12 bg-[#520a3f]">
      {/* Background World Map Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/world-map-dots.png"
          alt="World Map Dots"
          fill
          className="object-cover opacity-40 mix-blend-screen"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#520a3f]/80 via-transparent to-[#520a3f] z-10" />
      </div>

      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          {/* Left Column: Text Content */}
          <div className="text-left space-y-6 md:space-y-8 animate-reveal">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] sm:text-xs font-semibold text-white tracking-widest uppercase backdrop-blur-md">
              <span className="size-2 rounded-full bg-[#fcd34d] animate-pulse" />
              {t('landing.hero.badge')}
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tighter text-white drop-text-balance">
              {t('landing.hero.tagline')}
            </h1>

            <p className="max-w-lg text-base sm:text-lg leading-relaxed text-white/80 font-light text-balance">
              {t('landing.hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="default" size="lg" className="w-full h-12 px-8 text-base font-bold rounded-full bg-[#fcd34d] text-[#520a3f] hover:bg-[#fcd34d]/90 transition-all hover:scale-105 active:scale-95">
                  {t('landing.hero.cta')}
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold rounded-full border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 transition-colors">
                {t('landing.hero.learn_more')}
              </Button>
            </div>
          </div>

          {/* Right Column: Visual Element or Secondary Info */}
          <div className="hidden lg:block relative animate-reveal-delay-1">
            <div className="relative aspect-square max-w-[420px] mx-auto ml-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-[#fcd34d]/10 to-transparent rounded-full blur-3xl opacity-40" />
              <div className="relative z-10 glass-premium p-8 rounded-[36px] border border-white/10 bg-white/10 text-white backdrop-blur-xl">
                <div className="space-y-6">
                  <h3 className="text-xl xl:text-2xl font-bold text-white leading-tight text-balance">
                    {t('landing.hero.secondary.title')}
                  </h3>
                  <p className="text-white/70 leading-relaxed text-sm">
                    {t('landing.hero.secondary.description')}
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                      <div className="text-2xl font-black text-white">500+</div>
                      <div className="text-[10px] text-white/50 uppercase font-bold tracking-tighter mt-1">
                        {t('landing.stats.label.exposants')}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                      <div className="text-2xl font-black text-white">12 Mo.</div>
                      <div className="text-[10px] text-white/50 uppercase font-bold tracking-tighter mt-1">
                        {t('landing.hero.stats.access')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Bottom Fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#520a3f] to-transparent z-10" />
    </section>
  );
}
