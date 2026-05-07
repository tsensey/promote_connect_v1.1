'use client';

import { ShieldCheck, Mail, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccessPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
        <Card className="rounded-3xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900">Acces a la plateforme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              Le systeme d abonnement est desactive. Tous les comptes crees par
              l administrateur PROMOTE-CONNECT disposent d un acces complet a la
              plateforme.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <InfoCard
                icon={ShieldCheck}
                title="Acces complet"
                copy="Annuaire, chat, agenda, vitrine, newsletter et support sont disponibles pour tous les comptes provisionnes."
              />
              <InfoCard
                icon={Users}
                title="Provisioning admin"
                copy="La creation des comptes et l attribution des roles sont gerees uniquement depuis le back-office administrateur."
              />
              <InfoCard
                icon={Mail}
                title="Identifiants par email"
                copy="Chaque utilisateur recoit ses informations de connexion par email lors de la creation de son compte."
              />
            </div>
          </CardContent>
        </Card>
      </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  copy,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-2">{copy}</p>
    </div>
  );
}
