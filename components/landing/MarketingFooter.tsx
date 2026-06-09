'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { AppStoreBadges } from '@/components/shared/AppStoreBadges';

export function MarketingFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer suppressHydrationWarning className="border-t border-border/50 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand & Foundation */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-[140px] overflow-hidden rounded-lg">
                <Image
                  src="/logo_promopte_connect.webp"
                  alt="PROMOTE-CONNECT"
                  fill
                  className="object-contain rounded-lg"
                  sizes="140px"
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t('landing.footer.organization')}
            </p>
            <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <h4 className="text-sm font-bold text-foreground">
                {t('landing.footer.foundation_title')}
              </h4>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {t('landing.footer.foundation_desc')}
              </p>
              <a
                href="https://www.interprogress.org"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {t('landing.footer.foundation_website')}
                <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">
              {t('landing.footer.links')}
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="Voici le bon lien du site de PROMOTE: https://salonpromote.org/"
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

          {/* Legals */}
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

          {/* Download App */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">
              {t('landing.footer.download_app')}
            </h4>
            <AppStoreBadges variant="dark" />
            <p className="mt-4 text-xs text-muted-foreground">
              {t('landing.download.web_access')}
            </p>
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
