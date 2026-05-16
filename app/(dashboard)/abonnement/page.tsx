'use client';

import { useTranslation } from '@/lib/i18n';
import { ShieldCheck, Mail, Users, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AccessPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-heading text-foreground">
          {t('abonnement.title')}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          {t('abonnement.desc')}
        </p>
      </div>

      <Card className="surface-panel overflow-hidden border-0">
        <div className="brand-gradient px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/20">
              <ShieldCheck className="size-6 text-white" />
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-heading font-semibold">
                {t('abonnement.full_access')}
              </h2>
              <p className="text-sm text-white/80">
                {t('abonnement.full_access_desc')}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="space-y-6 p-6">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-800">
                  {t('abonnement.active')}
                </p>
                <p className="mt-0.5 text-sm text-emerald-600">
                  {t('abonnement.active_desc')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-white/80 p-5 transition-all hover:border-primary/20 hover:shadow-md">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="size-6 text-primary" />
              </div>
              <p className="font-heading text-lg font-semibold text-foreground">
                {t('abonnement.full_access')}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t('abonnement.features')}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-white/80 p-5 transition-all hover:border-primary/20 hover:shadow-md">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="size-6 text-primary" />
              </div>
              <p className="font-heading text-lg font-semibold text-foreground">
                {t('abonnement.provisioning')}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t('abonnement.provisioning_desc')}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-white/80 p-5 transition-all hover:border-primary/20 hover:shadow-md">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Mail className="size-6 text-primary" />
              </div>
              <p className="font-heading text-lg font-semibold text-foreground">
                {t('abonnement.credentials')}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t('abonnement.credentials_desc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
