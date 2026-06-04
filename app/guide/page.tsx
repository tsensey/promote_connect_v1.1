import { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  HelpCircle,
  Mail,
  MessageSquare,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Guide d'utilisation | PROMOTE-CONNECT",
  description:
    "Guide utilisateur complet, intuitif et professionnel pour maîtriser PROMOTE-CONNECT.",
};

export default function GuidePage() {

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-6 lg:px-8">
          <Link
            href="/feed"
            aria-label="Retour au tableau de bord"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              Guide utilisateur
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Réservé aux utilisateurs connectés
            </p>
          </div>

          <nav
            aria-label="Sections du guide"
            className="hidden min-w-0 items-center gap-1 lg:flex"
          >
            {guideNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <nav
          aria-label="Sections du guide mobile"
          className="flex gap-1 overflow-x-auto border-t border-border/60 px-3 py-2 lg:hidden"
        >
          {guideNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-9 shrink-0 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-3 py-5 sm:px-6 sm:py-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="surface-panel p-4">
              <p className="text-xs font-bold uppercase text-primary">
                Sommaire
              </p>
              <div className="mt-3 space-y-1">
                {guideNav.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {item.label}
                    <ChevronRight className="size-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="surface-panel p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Clock3 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Durée conseillée
                  </p>
                  <p className="text-xs text-muted-foreground">
                    6 minutes pour démarrer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          <section id="depart" className="surface-panel overflow-hidden">
            <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:p-8">
              <div className="min-w-0 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                  <Sparkles className="size-4" />
                  Parcours guidé PROMOTE-CONNECT
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                    Utilisez la plateforme sans perdre de temps.
                  </h1>
                  <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                    Ce guide vous montre quoi faire, dans quel ordre, et avec
                    quels réflexes pour trouver des contacts, échanger, planifier
                    des rendez-vous B2B et prolonger vos opportunités après
                    PROMOTE.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {heroStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-md border border-border bg-muted/35 p-4"
                    >
                      <stat.icon className="size-5 text-primary" />
                      <p className="mt-3 text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <action.icon className="size-5" />
                      </div>
                      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <p className="mt-4 font-semibold text-foreground">
                      {action.title}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {action.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section id="demarrage" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <GuideIntro
              icon={BadgeCheck}
              eyebrow="Démarrage"
              title="Votre première mission"
              description="Un parcours court pour devenir opérationnel sans lire toute la documentation."
            />

            <div className="surface-panel overflow-hidden xl:col-span-2">
              <ol className="grid divide-y divide-border/60 md:grid-cols-4 md:divide-x md:divide-y-0">
                {quickStart.map((item, index) => (
                  <li key={item.title} className="p-5">
                    <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <h3 className="mt-4 text-base font-heading text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section id="parcours" className="space-y-5">
            <GuideIntro
              icon={Route}
              eyebrow="Parcours"
              title="La méthode en 3 étapes"
              description="Préparer, identifier, convertir: c'est la logique la plus simple pour obtenir des résultats concrets."
            />

            <div className="grid gap-4 lg:grid-cols-3">
              {workflows.map((workflow) => {
                const tone = toneStyles[workflow.tone];

                return (
                  <article key={workflow.title} className="surface-card p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className={`flex size-11 items-center justify-center rounded-md ${tone.icon}`}>
                        <workflow.icon className="size-5" />
                      </div>
                      <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
                        {workflow.badge}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-heading text-foreground">
                      {workflow.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {workflow.description}
                    </p>
                    <ul className="mt-5 space-y-3">
                      {workflow.actions.map((action) => (
                        <li key={action} className="flex gap-3 text-sm leading-6">
                          <CheckCircle2 className={`mt-1 size-4 shrink-0 ${tone.check}`} />
                          <span className="text-muted-foreground">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="modules" className="space-y-5">
            <GuideIntro
              icon={BookOpenCheck}
              eyebrow="Modules"
              title="Le guide par fonctionnalité"
              description="Chaque module est présenté avec son usage, ses bons réflexes et un accès direct."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {moduleGuides.map((module) => {
                const tone = toneStyles[module.tone];

                return (
                  <article key={module.title} className="surface-panel p-5">
                    <div className="flex items-start gap-4">
                      <div className={`flex size-11 shrink-0 items-center justify-center rounded-md ${tone.icon}`}>
                        <module.icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold uppercase ${tone.text}`}>
                          {module.level}
                        </p>
                        <h3 className="mt-1 text-lg font-heading text-foreground">
                          {module.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {module.summary}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-md border border-border bg-muted/35 p-4">
                      <p className="text-xs font-bold uppercase text-foreground">
                        À vérifier
                      </p>
                      <ul className="mt-3 grid gap-2">
                        {module.tips.map((tip) => (
                          <li key={tip} className="flex gap-2 text-sm leading-6">
                            <ChevronRight className={`mt-1 size-4 shrink-0 ${tone.check}`} />
                            <span className="text-muted-foreground">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      href={module.href}
                      className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto"
                    >
                      Ouvrir le module
                      <ArrowRight className="size-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="roles" className="space-y-5">
            <GuideIntro
              icon={Users}
              eyebrow="Rôles"
              title="Ce que vous devez retenir selon votre profil"
              description="La plateforme sert le même objectif général, mais chaque rôle a ses priorités."
            />

            <div className="grid gap-4 lg:grid-cols-3">
              {roleGuides.map((role) => (
                <article key={role.title} className="surface-card p-5">
                  <div className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <role.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-heading text-foreground">
                    {role.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {role.description}
                  </p>
                </article>
              ))}
            </div>

            <div className="surface-panel p-5">
              <div className="grid gap-4 md:grid-cols-4">
                {bestPractices.map((practice) => (
                  <div key={practice.title} className="rounded-md bg-muted/35 p-4">
                    <practice.icon className="size-5 text-primary" />
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      {practice.title}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {practice.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="faq" className="space-y-5">
            <GuideIntro
              icon={HelpCircle}
              eyebrow="FAQ"
              title="Réponses rapides"
              description="Les questions les plus fréquentes pour démarrer sereinement."
            />

            <div className="surface-panel divide-y divide-border/60 overflow-hidden">
              {faqs.map((faq) => (
                <article key={faq.question} className="p-5 sm:p-6">
                  <h3 className="text-base font-heading text-foreground">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

interface GuideIntroProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
}

function GuideIntro({ icon: Icon, eyebrow, title, description }: GuideIntroProps) {
  return (
    <div className="flex min-w-0 items-start gap-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-heading text-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {description}
        </p>
      </div>
    </div>
  );
}

const guideNav = [
  { label: "Départ", href: "#depart" },
  { label: "Démarrage", href: "#demarrage" },
  { label: "Parcours", href: "#parcours" },
  { label: "Modules", href: "#modules" },
  { label: "Rôles", href: "#roles" },
  { label: "FAQ", href: "#faq" },
];

const heroStats = [
  { value: "12 mois", label: "de suivi après le salon", icon: Clock3 },
  { value: "B2B", label: "rendez-vous et contacts qualifiés", icon: BriefcaseBusiness },
  { value: "PWA", label: "mobile, offline et notifications", icon: Bell },
];

const quickActions = [
  {
    title: "Trouver un contact",
    description: "Recherchez les exposants par secteur, pays, pavillon ou stand.",
    href: "/annuaire",
    icon: Search,
  },
  {
    title: "Relancer un échange",
    description: "Reprenez une conversation et clarifiez la prochaine action.",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Planifier un RDV",
    description: "Consultez le programme et organisez vos rendez-vous B2B.",
    href: "/agenda",
    icon: Calendar,
  },
];

const quickStart = [
  {
    title: "Complétez votre profil",
    description: "Nom, entreprise, secteur, pays et photo rendent vos échanges plus fiables.",
  },
  {
    title: "Fixez votre objectif",
    description: "Prospection, achat, partenariat, recrutement ou veille: choisissez votre priorité.",
  },
  {
    title: "Ciblez quelques profils",
    description: "Commencez avec 5 contacts pertinents plutôt qu'une longue liste dispersée.",
  },
  {
    title: "Passez à l'action",
    description: "Quand l'intérêt est clair, proposez un rendez-vous ou une relance datée.",
  },
];

const workflows: Array<{
  title: string;
  badge: string;
  description: string;
  icon: LucideIcon;
  tone: keyof typeof toneStyles;
  actions: string[];
}> = [
  {
    title: "Préparer",
    badge: "Base",
    description: "Votre profil doit inspirer confiance avant le premier message.",
    icon: BadgeCheck,
    tone: "emerald",
    actions: [
      "Vérifiez vos coordonnées et votre entreprise.",
      "Activez les notifications importantes.",
      "Clarifiez ce que vous cherchez sur la plateforme.",
    ],
  },
  {
    title: "Identifier",
    badge: "Ciblage",
    description: "Le bon contact est celui qui correspond clairement à votre besoin.",
    icon: Compass,
    tone: "blue",
    actions: [
      "Filtrez par secteur, pays et pavillon.",
      "Lisez la fiche exposant avant d'écrire.",
      "Priorisez les profils avec une offre compatible.",
    ],
  },
  {
    title: "Convertir",
    badge: "Action",
    description: "Un échange réussi aboutit à un rendez-vous, une relance ou une décision.",
    icon: Target,
    tone: "amber",
    actions: [
      "Envoyez un message court et contextualisé.",
      "Proposez un rendez-vous lorsque l'intérêt est confirmé.",
      "Relancez après le salon grâce à l'historique.",
    ],
  },
];

const moduleGuides: Array<{
  title: string;
  level: string;
  summary: string;
  icon: LucideIcon;
  href: string;
  tone: keyof typeof toneStyles;
  tips: string[];
}> = [
  {
    title: "Annuaire exposants",
    level: "Prospection",
    summary: "Trouvez les entreprises participantes et identifiez les bons interlocuteurs.",
    icon: Search,
    href: "/annuaire",
    tone: "blue",
    tips: ["Filtrer large, puis affiner.", "Lire la fiche avant contact.", "Comparer secteur, pays, pavillon et stand."],
  },
  {
    title: "Chat privé",
    level: "Relation",
    summary: "Échangez en direct, qualifiez le besoin et gardez un historique utile.",
    icon: MessageSquare,
    href: "/chat",
    tone: "violet",
    tips: ["Une intention claire par message.", "Éviter les données sensibles inutiles.", "Passer au RDV quand l'échange devient concret."],
  },
  {
    title: "Agenda et RDV",
    level: "Organisation",
    summary: "Suivez le programme et organisez vos rendez-vous B2B sans conflit.",
    icon: Calendar,
    href: "/agenda",
    tone: "emerald",
    tips: ["Vérifier les conflits d'horaires.", "Ajouter des notes de contexte.", "Suivre les statuts pending, confirmed et cancelled."],
  },
  {
    title: "Vitrine produits",
    level: "Visibilité",
    summary: "Présentez vos offres avec des contenus clairs et faciles à scanner.",
    icon: Store,
    href: "/vitrine",
    tone: "amber",
    tips: ["Mettre les bénéfices en premier.", "Utiliser des visuels nets.", "Actualiser l'offre dès qu'elle change."],
  },
  {
    title: "Newsletter",
    level: "Veille",
    summary: "Suivez les annonces, opportunités et informations sectorielles importantes.",
    icon: Mail,
    href: "/newsletter",
    tone: "blue",
    tips: ["Choisir les sujets utiles.", "Consulter les archives.", "Garder les communications pertinentes."],
  },
  {
    title: "Support",
    level: "Assistance",
    summary: "Obtenez de l'aide avec un ticket clair, contextualisé et facile à traiter.",
    icon: HelpCircle,
    href: "/support",
    tone: "violet",
    tips: ["Décrire la page concernée.", "Ajouter l'action effectuée.", "Joindre une capture ou un message d'erreur."],
  },
];

const roleGuides = [
  {
    title: "Visiteur",
    description:
      "Repérez les exposants pertinents, lancez les échanges, programmez des rendez-vous et revenez après le salon pour relancer les contacts.",
    icon: Users,
  },
  {
    title: "Exposant",
    description:
      "Soignez votre profil, alimentez votre vitrine, répondez vite aux messages et convertissez les demandes en opportunités commerciales.",
    icon: Store,
  },
  {
    title: "Équipe PROMOTE",
    description:
      "Pilotez l'information, le support, les exposants et la qualité des données depuis le back-office.",
    icon: ShieldCheck,
  },
];

const bestPractices = [
  {
    title: "Profil fiable",
    description: "Un profil complet améliore la confiance et le taux de réponse.",
    icon: Users,
  },
  {
    title: "Notifications utiles",
    description: "Gardez les alertes importantes sans multiplier les distractions.",
    icon: Bell,
  },
  {
    title: "Données protégées",
    description: "Ne partagez que les informations nécessaires à l'échange.",
    icon: ShieldCheck,
  },
  {
    title: "Suivi régulier",
    description: "Revenez après PROMOTE pour exploiter les 12 mois d'accès.",
    icon: Calendar,
  },
];

const faqs = [
  {
    question: "Pourquoi le guide est-il réservé aux utilisateurs connectés ?",
    answer:
      "Il renvoie vers des modules protégés et explique des parcours liés au compte, aux conversations, aux rendez-vous et aux données d'abonnement.",
  },
  {
    question: "Quelle est la première action à faire ?",
    answer:
      "Complétez votre profil. C'est le signal le plus simple pour rassurer les autres participants et obtenir plus de réponses.",
  },
  {
    question: "Comment contacter efficacement un exposant ?",
    answer:
      "Lisez sa fiche, mentionnez votre besoin en une phrase, puis proposez une suite claire: échange rapide, demande d'information ou rendez-vous.",
  },
  {
    question: "Combien de temps puis-je exploiter mes échanges ?",
    answer:
      "PROMOTE-CONNECT est pensé pour prolonger les opportunités pendant 12 mois après le salon, selon votre statut d'accès.",
  },
  {
    question: "Que faire si une page ne fonctionne pas ?",
    answer:
      "Ouvrez un ticket support avec la page concernée, l'action effectuée, votre navigateur ou mobile, et une capture si possible.",
  },
];

const toneStyles = {
  blue: {
    icon: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    badge: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    check: "text-blue-700 dark:text-blue-300",
    text: "text-blue-700 dark:text-blue-300",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    check: "text-emerald-700 dark:text-emerald-300",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    check: "text-amber-700 dark:text-amber-300",
    text: "text-amber-700 dark:text-amber-300",
  },
  violet: {
    icon: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    badge: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    check: "text-violet-700 dark:text-violet-300",
    text: "text-violet-700 dark:text-violet-300",
  },
};
