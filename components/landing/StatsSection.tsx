'use client';

import { useTranslation } from '@/lib/i18n';
import { Users, MessageSquare, Clock, Globe2 } from 'lucide-react';
import { ScrollReveal } from '@/components/shared/ScrollReveal';

const stats = [
  { key: 'exposants', icon: Users, value: '500+' },
  { key: 'professionals', icon: MessageSquare, value: '2 000+' },
  { key: 'access', icon: Clock, value: '12' },
  { key: 'country', icon: Globe2, value: '40+' },
];

export function StatsSection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-16 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, i) => (
              <div
                key={stat.key}
                className="relative flex flex-col items-center text-center space-y-4 p-6 rounded-3xl transition-all duration-300 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex size-14 md:size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/10 transition-all duration-300 hover:rotate-3 hover:bg-primary/15 group-hover:scale-110">
                  <stat.icon className="size-7 md:size-8" />
                </div>
                <div className="space-y-1">
                  <div className="text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-[1]">
                    {stat.value}
                  </div>
                  <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {t(`landing.stats.label.${stat.key}`)}
                  </div>
                </div>
                {i < stats.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 w-px h-12 bg-border/50 -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
