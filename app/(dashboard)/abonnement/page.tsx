'use client';

import { ShieldCheck, Mail, Users, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AccessPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-heading text-foreground">
          Acces a la plateforme
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Votre acces a PROMOTE-CONNECT.
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
                Acces complet
              </h2>
              <p className="text-sm text-white/80">
                Votre compte est actif et supervise par l administration
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
                  Acces actif
                </p>
                <p className="mt-0.5 text-sm text-emerald-600">
                  Tous les comptes provisionnes par PROMOTE-CONNECT
                  disposent d un acces complet a la plateforme.
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
                Acces complet
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Annuaire, chat, agenda, vitrine, newsletter et support sont
                disponibles pour tous les comptes provisionnes.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-white/80 p-5 transition-all hover:border-primary/20 hover:shadow-md">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="size-6 text-primary" />
              </div>
              <p className="font-heading text-lg font-semibold text-foreground">
                Provisioning admin
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                La creation des comptes et l attribution des roles sont
                gerees uniquement depuis le back-office administrateur.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-white/80 p-5 transition-all hover:border-primary/20 hover:shadow-md">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Mail className="size-6 text-primary" />
              </div>
              <p className="font-heading text-lg font-semibold text-foreground">
                Identifiants par email
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Chaque utilisateur recoit ses informations de connexion par
                email lors de la creation de son compte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
