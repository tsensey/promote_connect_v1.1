'use client';

import { useTranslation } from '@/lib/i18n';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { UserPlus, MessageCircle, TrendingUp, Quote } from 'lucide-react';

const steps = [
  { key: 'step1', icon: UserPlus },
  { key: 'step2', icon: MessageCircle },
  { key: 'step3', icon: TrendingUp },
];

export function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
          {/* Testimonial */}
          <ScrollReveal className="h-full">
            <div className="relative h-full p-8 md:p-10 rounded-[32px] bg-primary overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 size-40 md:size-56 rounded-full bg-white/5 -translate-y-1/4 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 size-32 md:size-40 rounded-full bg-white/5 translate-y-1/4 -translate-x-1/4" />
              <div className="relative z-10 space-y-6">
                <Quote className="size-10 md:size-12 text-white/30" />
                <blockquote className="text-lg md:text-xl xl:text-2xl font-medium leading-relaxed text-white/95">
                  {t('landing.hero.testimonial.quote')}
                </blockquote>
              </div>
              <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
                <div className="font-bold text-white">
                  {t('landing.hero.testimonial.author')}
                </div>
                <div className="text-sm text-white/60 mt-0.5">
                  {t('landing.hero.testimonial.role')}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* How it works */}
          <ScrollReveal delay={150} className="h-full">
            <div className="h-full flex flex-col justify-center space-y-6 md:space-y-8">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                {t('landing.how_it_works.title')}
              </h2>
              <div className="space-y-5 md:space-y-6">
                {steps.map((step, i) => (
                  <div key={step.key} className="flex gap-4 md:gap-5 group">
                    <div className="flex flex-col items-center">
                      <div className="flex size-10 md:size-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                        <step.icon className="size-5 md:size-6" />
                      </div>
                      {i < steps.length - 1 && (
                        <div className="w-px flex-1 bg-border/50 mt-2" />
                      )}
                    </div>
                    <div className="pb-5 md:pb-6">
                      <h3 className="font-bold text-foreground text-sm md:text-base">
                        <span className="text-primary/60 font-mono text-xs mr-2">0{i + 1}</span>
                        {t(`landing.how_it_works.${step.key}_title`)}
                      </h3>
                      <p className="mt-1 text-sm md:text-base text-muted-foreground leading-relaxed">
                        {t(`landing.how_it_works.${step.key}_desc`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
