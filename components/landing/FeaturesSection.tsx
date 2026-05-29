'use client';

import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { 
  Users, 
  Target, 
  MessageCircle, 
  Calendar, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';

const features = [
  { key: 'annuaire', icon: Users },
  { key: 'chat', icon: MessageCircle },
  { key: 'agenda', icon: Calendar },
  { key: 'vitrine', icon: Target },
  { key: 'newsletter', icon: Zap },
  { key: 'support', icon: ShieldCheck },
];

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section id="features" className="relative py-20 md:py-32 overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-12 md:space-y-16 animate-reveal">
          
          <div className="mt-12 md:mt-16">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Image */}
              <div className="relative animate-reveal-delay-1">
                <div className="relative aspect-[4/5] md:aspect-square rounded-[2rem] md:rounded-[3rem] overflow-hidden">
                  <Image
                    src="/entrepreneurs.jpg"
                    alt="Entrepreneurs"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 p-4 md:p-8 rounded-2xl md:rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/20 text-white">
                    <p className="text-base md:text-xl font-medium italic leading-relaxed">
                      {t('landing.hero.testimonial.quote')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-8 animate-reveal">
                <div className="space-y-4">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
                    {t('landing.stats.title')}
                  </h3>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    {t('landing.stats.description')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl border border-border/50 bg-card/50 hover:bg-white transition-all duration-300 text-center">
                    <div className="text-3xl md:text-4xl font-black text-primary leading-[1]">500+</div>
                    <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                      {t('landing.stats.label.exposants')}
                    </div>
                  </div>
                  <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl border border-border/50 bg-card/50 hover:bg-white transition-all duration-300 text-center">
                    <div className="text-3xl md:text-4xl font-black text-primary leading-[1]">2 000+</div>
                    <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                      {t('landing.stats.label.professionals')}
                    </div>
                  </div>
                  <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl border border-border/50 bg-card/50 hover:bg-white transition-all duration-300 text-center">
                    <div className="text-3xl md:text-4xl font-black text-primary leading-[1]">12</div>
                    <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                      {t('landing.stats.label.access')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4 max-w-3xl mx-auto mt-20 md:mt-[20%]">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
              {t('landing.features.title')}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="mt-20 md:mt-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, i) => (
              <div 
                key={feature.key} 
                className="group p-6 md:p-8 rounded-3xl border border-border/50 bg-card/50 hover:bg-white transition-all duration-300"
              >
                <div className="flex size-12 md:size-14 items-center justify-center rounded-2xl bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                  <feature.icon className="size-6 md:size-7" />
                </div>
                <h3 className="mt-5 text-lg md:text-xl font-bold text-foreground">
                  {t(`landing.features.${feature.key}_title`)}
                </h3>
                <p className="mt-3 text-sm md:text-base text-muted-foreground leading-[1.6]">
                  {t(`landing.features.${feature.key}_desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
