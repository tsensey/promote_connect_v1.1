"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from '@/lib/i18n';

export function LocaleToggle() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="rounded-full text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
      title={t('common.toggle_language')}
    >
      {locale === 'fr' ? 'EN' : 'FR'}
      <span className="sr-only">{t('common.toggle_language')}</span>
    </Button>
  );
}
