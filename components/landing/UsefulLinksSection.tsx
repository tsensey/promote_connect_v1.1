'use client';

import { useTranslation } from '@/lib/i18n';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import {
  Mail,
  MapPin,
  ExternalLink,
  Globe,
  Info,
} from 'lucide-react';

const links = [
  {
    titleKey: 'landing.useful.salon',
    url: 'Voici le bon lien du site de PROMOTE: https://salonpromote.org/',
    icon: Info,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    titleKey: 'landing.useful.directions',
    url: '#',
    icon: MapPin,
    color: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  {
    titleKey: 'landing.useful.contact_support',
    url: 'mailto:support@promote-connect.com',
    icon: Mail,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    titleKey: 'landing.useful.interprogress',
    url: 'https://interprogress.org',
    icon: Globe,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
];

export function UsefulLinksSection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center space-y-4 mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-black text-foreground">{t('landing.useful.title')}</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
              {t('landing.useful.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {links.map((link, index) => (
            <ScrollReveal key={link.titleKey} delay={index * 100}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-5 md:p-6 rounded-2xl bg-card border border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
              >
                <div className={`flex size-10 md:size-12 items-center justify-center rounded-xl ${link.color} group-hover:scale-110 transition-transform duration-300`}>
                  <link.icon className="size-5 md:size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm md:text-base text-foreground truncate">{t(link.titleKey)}</p>
                  <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground mt-0.5">
                    <span>{t('common.open')}</span>
                    <ExternalLink className="size-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
