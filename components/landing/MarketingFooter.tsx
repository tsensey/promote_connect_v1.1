'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export function MarketingFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer suppressHydrationWarning className="border-t border-border/50 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary font-bold text-sm text-primary-foreground">
                P
              </span>
              <span className="font-semibold tracking-tight">
                PROMOTE-CONNECT
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t('landing.footer.organization')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('landing.footer.salon')}
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">
              {t('landing.footer.links')}
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://salon-promote.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('landing.useful.salon')}
                </a>
              </li>
              <li>
                <a
                  href="https://www.interprogress.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('landing.useful.interprogress')}
                </a>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('landing.footer.support')}
                </Link>
              </li>
              <li>
                <Link
                  href="/newsletter"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('landing.footer.newsletter')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">
              {t('landing.footer.legals')}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/condition"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('landing.footer.cgu')}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('landing.footer.contact')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/50 pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            {t('landing.footer.realized_by').split('{link}').map((part, i) => {
              if (i === 0) return part;
              const [label, rest] = part.split('{/link}');
              return (
                <span key={i}>
                  <a
                    href="https://bbit-it.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/80 underline underline-offset-2 transition-colors hover:text-foreground"
                  >
                    {label}
                  </a>
                  {rest}
                </span>
              );
            })}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('landing.footer.copyright', { year })}
          </p>
        </div>
      </div>
    </footer>
  );
}
