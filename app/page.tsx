import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Globe2,
  MessageSquare,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const keyModules = [
  {
    icon: Users,
    title: 'Annuaire intelligent',
    copy: 'Retrouvez les exposants par secteur, pays, pavillon et type d activite.',
  },
  {
    icon: MessageSquare,
    title: 'Chat prive',
    copy: 'Lancez une conversation directe, gardez l historique et accelerez les prises de contact.',
  },
  {
    icon: CalendarDays,
    title: 'Agenda B2B',
    copy: 'Combinez programme du salon, rendez-vous et suivi 12 mois dans un meme espace.',
  },
];

const networkSignals = [
  { label: 'Exposants', value: '500+' },
  { label: 'Acces post-salon', value: '12 mois' },
  { label: 'Modules connectes', value: '7' },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? '/app' : '/register';
  const primaryLabel = user ? 'Ouvrir mon espace' : 'Commencer maintenant';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(145,36,80,0.15),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(214,158,46,0.16),transparent_22%),linear-gradient(180deg,#fbfbfd_0%,#f5f7fb_100%)]">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 xl:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="brand-gradient flex size-11 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-lg shadow-primary/20">
              P
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
                Salon PROMOTE
              </p>
              <p className="-mt-0.5 text-lg text-foreground">PROMOTE-CONNECT</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
            <a href="#modules" className="transition hover:text-foreground">
              Modules
            </a>
            <a href="#benefices" className="transition hover:text-foreground">
              Benefices
            </a>
            <a href="#faq" className="transition hover:text-foreground">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {!user && (
              <Link href="/login">
                <Button variant="ghost" className="rounded-full">
                  Connexion
                </Button>
              </Link>
            )}
            <Link href={primaryHref}>
              <Button className="rounded-full px-5">
                {primaryLabel}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:py-18 xl:px-8">
        <div className="space-y-8">
          <div className="space-y-5">
            <Badge className="rounded-full bg-primary/10 px-4 py-1.5 text-primary hover:bg-primary/10">
              <Sparkles className="mr-2 size-3.5" />
              Le reseau professionnel du salon continue apres l evenement
            </Badge>
            <div className="max-w-4xl space-y-5">
              <h1 className="text-5xl leading-[1.02] text-foreground sm:text-6xl xl:text-7xl">
                Le LinkedIn du salon PROMOTE, pense pour conclure des affaires.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                PROMOTE-CONNECT relie exposants et visiteurs dans une experience unique:
                annuaire qualifie, messagerie securisee, agenda B2B, vitrine produits
                et newsletter reservee aux abonnes pendant 12 mois.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={primaryHref}>
              <Button size="lg" className="rounded-full px-6">
                {primaryLabel}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="rounded-full bg-white/85 px-6">
                Voir la plateforme
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {networkSignals.map((signal) => (
              <div
                key={signal.label}
                className="rounded-3xl border border-white/70 bg-white/85 px-5 py-4 shadow-[0_24px_50px_-36px_rgba(15,23,42,0.35)]"
              >
                <p className="text-sm text-muted-foreground">{signal.label}</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{signal.value}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="surface-card border-0">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                    Fil d opportunites
                  </p>
                  <h2 className="mt-2 text-3xl text-foreground">Votre reseau salon, en continu</h2>
                </div>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Newspaper className="size-5" />
                </div>
              </div>

              <div className="space-y-3">
                <FeedCard
                  title="Nouveau contact recommande"
                  subtitle="TechCorp x GreenEnergy"
                  copy="Une mise en relation qualifiee est prete a etre demarree depuis l annuaire."
                />
                <FeedCard
                  title="Evenement a forte valeur"
                  subtitle="Panel Fintech & Distribution"
                  copy="Ajoutez-le a votre agenda et bloquez vos rendez-vous avant la fin du salon."
                />
                <FeedCard
                  title="Vitrine active"
                  subtitle="Produits et catalogues"
                  copy="Publiez vos offres et gardez-les visibles pour toute la communaute post-salon."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel border-0">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Acces securise et RGPD</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Authentification, controle d acces par abonnement et isolation des donnees via RLS.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe2 className="size-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">100% responsive</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Desktop, tablette et mobile pour garder le salon en poche.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>

      <section id="modules" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 xl:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">
              Modules prioritaires
            </p>
            <h2 className="mt-2 text-4xl text-foreground">Une plateforme complete pour le networking salon</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Le cahier des charges privilegie l annuaire, le chat, l agenda et l acces 12 mois comme socle du MVP.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {keyModules.map((module) => (
            <Card key={module.title} className="surface-panel border-0">
              <CardContent className="space-y-4 p-6">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <module.icon className="size-5" />
                </div>
                <div>
                  <h3 className="text-2xl text-foreground">{module.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{module.copy}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="benefices" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 xl:px-8">
        <Card className="surface-card border-0 overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
            <CardContent className="space-y-6 p-8 lg:p-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">
                  Valeur metier
                </p>
                <h2 className="mt-2 text-4xl text-foreground">
                  Le salon devient un canal commercial actif toute l annee
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <BenefitItem title="Prospection ciblee" copy="Filtrez les contacts a fort potentiel et engagez-les en quelques clics." />
                <BenefitItem title="Conversion rapide" copy="Passez du profil au message puis au rendez-vous sans sortir de la plateforme." />
                <BenefitItem title="Visibilite exposant" copy="Exposez produits et offres a toute la communaute abonnée." />
                <BenefitItem title="Continuite 12 mois" copy="Gardez l historique, les opportunites et les interactions apres le salon." />
              </div>
            </CardContent>

            <div className="brand-gradient flex flex-col justify-between p-8 text-white lg:p-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
                  Parcours type
                </p>
                <h3 className="mt-2 text-3xl">Trouver, echanger, planifier, vendre.</h3>
              </div>
              <div className="space-y-3">
                <JourneyItem step="1" label="Recherche qualifiee" />
                <JourneyItem step="2" label="Conversation privee" />
                <JourneyItem step="3" label="Rendez-vous B2B" />
                <JourneyItem step="4" label="Suivi post-salon" />
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="faq" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 xl:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="surface-panel border-0 lg:col-span-2">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">
                  FAQ rapide
                </p>
                <h2 className="mt-2 text-3xl text-foreground">Les points cles avant inscription</h2>
              </div>
              <FaqRow question="Qui peut acceder a PROMOTE-CONNECT ?" answer="Les exposants, visiteurs et administrateurs invites sur le reseau PROMOTE." />
              <FaqRow question="Combien de temps dure l acces ?" answer="L abonnement ouvre les services pendant 12 mois apres la cloture du salon." />
              <FaqRow question="Que contient le MVP ?" answer="Authentification, annuaire, chat prive, agenda B2B, administration et abonnement." />
            </CardContent>
          </Card>

          <Card className="surface-panel border-0">
            <CardContent className="space-y-5 p-6">
              <h3 className="text-2xl text-foreground">Pret a rejoindre le reseau ?</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                Creez votre compte ou connectez-vous pour retrouver vos contacts salon et vos opportunites d affaires.
              </p>
              <Link href={primaryHref}>
                <Button className="w-full rounded-2xl">
                  {primaryLabel}
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function FeedCard({
  title,
  subtitle,
  copy,
}: {
  title: string;
  subtitle: string;
  copy: string;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-muted/35 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-primary">{subtitle}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
    </div>
  );
}

function BenefitItem({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-white/80 p-5">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
    </div>
  );
}

function JourneyItem({ step, label }: { step: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-white/14 bg-white/10 px-4 py-3 backdrop-blur">
      <div className="flex size-9 items-center justify-center rounded-full bg-white/14 text-sm font-semibold">
        {step}
      </div>
      <p className="text-sm font-medium text-white">{label}</p>
    </div>
  );
}

function FaqRow({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-white/85 p-5">
      <p className="text-base font-semibold text-foreground">{question}</p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{answer}</p>
    </div>
  );
}
