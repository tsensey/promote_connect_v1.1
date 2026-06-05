'use client';

import { useTranslation } from '@/lib/i18n';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import {
  Users,
  Target,
  MessageCircle,
  Calendar,
  ShieldCheck,
  Zap,
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
        <div className="space-y-12 md:space-y-16">
          <ScrollReveal>
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
                {t('landing.features.title')}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {t('landing.features.subtitle')}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.key} delay={index * 100}>
                <div className="group relative p-6 md:p-8 rounded-3xl border border-border/50 bg-card/50 transition-all duration-300 hover:bg-card hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="relative">
                    <div className="flex size-12 md:size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
                      <feature.icon className="size-6 md:size-7" />
                    </div>
                    <h3 className="mt-5 text-lg md:text-xl font-bold text-foreground">
                      {t(`landing.features.${feature.key}_title`)}
                    </h3>
                    <p className="mt-3 text-sm md:text-base text-muted-foreground leading-[1.6]">
                      {t(`landing.features.${feature.key}_desc`)}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
