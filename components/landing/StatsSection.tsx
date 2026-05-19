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
    <section className="border-y border-border/50 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="surface-card flex flex-col items-center gap-3 p-8 text-center"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className="size-6 text-primary" />
              </div>
              <span className="text-3xl font-bold">{stat.value}</span>
              <span className="text-sm text-muted-foreground">
                {t(`landing.stats.${stat.key}`, { count: stat.value })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
