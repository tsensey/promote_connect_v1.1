'use client';

import { useTranslation } from '@/lib/i18n';
import { Users, MessageSquare, CalendarDays, Store, Newspaper, LifeBuoy } from 'lucide-react';

const features = [
  { key: 'annuaire', icon: Users },
  { key: 'chat', icon: MessageSquare },
  { key: 'agenda', icon: CalendarDays },
  { key: 'vitrine', icon: Store },
  { key: 'newsletter', icon: Newspaper },
  { key: 'support', icon: LifeBuoy },
];

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section id="features" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('landing.features.title')}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t('landing.features.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="surface-card group p-6 transition-all hover:border-primary/30"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <feature.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold">
                {t(`landing.features.${feature.key}_title`)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`landing.features.${feature.key}_desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
