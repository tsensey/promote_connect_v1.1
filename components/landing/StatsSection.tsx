'use client';

import { useTranslation } from '@/lib/i18n';
import { Users, MessageSquare, Clock } from 'lucide-react';

const stats = [
  { key: 'exposants', icon: Users, value: '500+' },
  { key: 'professionals', icon: MessageSquare, value: '2 000+' },
  { key: 'access', icon: Clock, value: '12' },
];

export function StatsSection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-16 md:py-24 bg-background/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <div
              key={stat.key}
              className={`relative flex flex-col items-center text-center space-y-4 p-6 rounded-3xl transition-colors hover:bg-white/5 ${
                i === 2 ? 'sm:col-span-2 lg:col-span-1' : ''
              }`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="flex size-14 md:size-16 items-center justify-center rounded-2xl bg-primary/5 text-primary shadow-inner border border-primary/10 transition-transform hover:rotate-3">
                <stat.icon className="size-7 md:size-8" />
              </div>
              <div className="space-y-1">
                <div className="text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-[1]">
                  {stat.value}
                </div>
                <div className="text-[10px] md:text-xs font-bold text-primary tracking-widest uppercase">
                  {t(`landing.stats.${stat.key}`, { count: stat.value })}
                </div>
              </div>
              {i < stats.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-6 w-px h-12 bg-border/50 -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
