'use client';

import { useTranslation } from '@/lib/i18n';
import { ExternalLink, FileText, ScrollText, Users, FileSignature } from 'lucide-react';

function useLinks() {
  const { t, locale } = useTranslation();
  const isFr = locale === 'fr';

  return [
    {
      key: 'salon',
      href: 'https://salon-promote.org',
      icon: ExternalLink,
      actionKey: 'visit',
    },
    {
      key: 'interprogress',
      href: 'https://www.interprogress.org/',
      icon: ExternalLink,
      actionKey: 'visit',
    },
    {
      key: 'brochure',
      href: isFr
        ? 'https://salonpromote.org/wp-content/uploads/2025/07/Rendez-vous-daffaires-.pdf'
        : 'https://salonpromote.org/wp-content/uploads/2025/07/Rendez-vous%20d%E2%80%99affaires_VA%20.pdf',
      icon: FileText,
      actionKey: 'download',
    },
    {
      key: 'contrat',
      href: isFr
        ? 'https://salonpromote.org/wp-content/uploads/2025/07/Contrat-de-Participation.pdf'
        : 'https://salonpromote.org/wp-content/uploads/2025/07/Contrat%20de%20Participation_VA.pdf',
      icon: FileSignature,
      actionKey: 'download',
    },
    {
      key: 'exposant',
      href: 'https://salon-promote.org/devenir-exposant',
      icon: Users,
      actionKey: 'visit',
    },
    {
      key: 'cgu',
      href: '#',
      icon: ScrollText,
      actionKey: 'download',
    },
  ];
}

export function UsefulLinksSection() {
  const { t } = useTranslation();
  const links = useLinks();

  return (
    <section className="border-t border-border/50 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('landing.useful.title')}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t('landing.useful.subtitle')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="surface-card group flex items-center gap-4 p-5 transition-all hover:border-primary/30"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <link.icon className="size-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {t(`landing.useful.${link.key}`)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(`landing.useful.${link.actionKey}`)}
                </p>
              </div>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
