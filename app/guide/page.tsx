"use client";

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
import { useTranslation } from "@/lib/i18n";

export default function GuidePage() {
  const { t, locale, setLocale } = useTranslation();

  const guideNav = [
    { label: t("guide.nav.depart"), href: "#depart" },
    { label: t("guide.nav.demarrage"), href: "#demarrage" },
    { label: t("guide.nav.parcours"), href: "#parcours" },
    { label: t("guide.nav.modules"), href: "#modules" },
    { label: t("guide.nav.roles"), href: "#roles" },
    { label: t("guide.nav.faq"), href: "#faq" },
  ];

  const heroStats = [
    { value: t("guide.hero.stat_1.value"), label: t("guide.hero.stat_1.label"), icon: Clock3 },
    { value: t("guide.hero.stat_2.value"), label: t("guide.hero.stat_2.label"), icon: BriefcaseBusiness },
    { value: t("guide.hero.stat_3.value"), label: t("guide.hero.stat_3.label"), icon: Bell },
  ];

  const quickActions = [
    { title: t("guide.quick_action.1.title"), description: t("guide.quick_action.1.description"), href: "/annuaire", icon: Search },
    { title: t("guide.quick_action.2.title"), description: t("guide.quick_action.2.description"), href: "/chat", icon: MessageSquare },
    { title: t("guide.quick_action.3.title"), description: t("guide.quick_action.3.description"), href: "/agenda", icon: Calendar },
  ];

  const quickStart = [
    { title: t("guide.demarrage.step.1.title"), description: t("guide.demarrage.step.1.description") },
    { title: t("guide.demarrage.step.2.title"), description: t("guide.demarrage.step.2.description") },
    { title: t("guide.demarrage.step.3.title"), description: t("guide.demarrage.step.3.description") },
    { title: t("guide.demarrage.step.4.title"), description: t("guide.demarrage.step.4.description") },
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
      title: t("guide.parcours.step.1.title"),
      badge: t("guide.parcours.step.1.badge"),
      description: t("guide.parcours.step.1.description"),
      icon: BadgeCheck,
      tone: "emerald",
      actions: [
        t("guide.parcours.step.1.action.1"),
        t("guide.parcours.step.1.action.2"),
        t("guide.parcours.step.1.action.3"),
      ],
    },
    {
      title: t("guide.parcours.step.2.title"),
      badge: t("guide.parcours.step.2.badge"),
      description: t("guide.parcours.step.2.description"),
      icon: Compass,
      tone: "blue",
      actions: [
        t("guide.parcours.step.2.action.1"),
        t("guide.parcours.step.2.action.2"),
        t("guide.parcours.step.2.action.3"),
      ],
    },
    {
      title: t("guide.parcours.step.3.title"),
      badge: t("guide.parcours.step.3.badge"),
      description: t("guide.parcours.step.3.description"),
      icon: Target,
      tone: "amber",
      actions: [
        t("guide.parcours.step.3.action.1"),
        t("guide.parcours.step.3.action.2"),
        t("guide.parcours.step.3.action.3"),
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
      title: t("guide.modules.module.1.title"),
      level: t("guide.modules.module.1.level"),
      summary: t("guide.modules.module.1.summary"),
      icon: Search,
      href: "/annuaire",
      tone: "blue",
      tips: [t("guide.modules.module.1.tip.1"), t("guide.modules.module.1.tip.2"), t("guide.modules.module.1.tip.3")],
    },
    {
      title: t("guide.modules.module.2.title"),
      level: t("guide.modules.module.2.level"),
      summary: t("guide.modules.module.2.summary"),
      icon: MessageSquare,
      href: "/chat",
      tone: "violet",
      tips: [t("guide.modules.module.2.tip.1"), t("guide.modules.module.2.tip.2"), t("guide.modules.module.2.tip.3")],
    },
    {
      title: t("guide.modules.module.3.title"),
      level: t("guide.modules.module.3.level"),
      summary: t("guide.modules.module.3.summary"),
      icon: Calendar,
      href: "/agenda",
      tone: "emerald",
      tips: [t("guide.modules.module.3.tip.1"), t("guide.modules.module.3.tip.2"), t("guide.modules.module.3.tip.3")],
    },
    {
      title: t("guide.modules.module.4.title"),
      level: t("guide.modules.module.4.level"),
      summary: t("guide.modules.module.4.summary"),
      icon: Store,
      href: "/vitrine",
      tone: "amber",
      tips: [t("guide.modules.module.4.tip.1"), t("guide.modules.module.4.tip.2"), t("guide.modules.module.4.tip.3")],
    },
    {
      title: t("guide.modules.module.5.title"),
      level: t("guide.modules.module.5.level"),
      summary: t("guide.modules.module.5.summary"),
      icon: Mail,
      href: "/newsletter",
      tone: "blue",
      tips: [t("guide.modules.module.5.tip.1"), t("guide.modules.module.5.tip.2"), t("guide.modules.module.5.tip.3")],
    },
    {
      title: t("guide.modules.module.6.title"),
      level: t("guide.modules.module.6.level"),
      summary: t("guide.modules.module.6.summary"),
      icon: HelpCircle,
      href: "/support",
      tone: "violet",
      tips: [t("guide.modules.module.6.tip.1"), t("guide.modules.module.6.tip.2"), t("guide.modules.module.6.tip.3")],
    },
  ];

  const roleGuides = [
    {
      title: t("guide.roles.role.1.title"),
      description: t("guide.roles.role.1.description"),
      icon: Users,
    },
    {
      title: t("guide.roles.role.2.title"),
      description: t("guide.roles.role.2.description"),
      icon: Store,
    },
    {
      title: t("guide.roles.role.3.title"),
      description: t("guide.roles.role.3.description"),
      icon: ShieldCheck,
    },
  ];

  const bestPractices = [
    { title: t("guide.roles.practice.1.title"), description: t("guide.roles.practice.1.description"), icon: Users },
    { title: t("guide.roles.practice.2.title"), description: t("guide.roles.practice.2.description"), icon: Bell },
    { title: t("guide.roles.practice.3.title"), description: t("guide.roles.practice.3.description"), icon: ShieldCheck },
    { title: t("guide.roles.practice.4.title"), description: t("guide.roles.practice.4.description"), icon: Calendar },
  ];

  const faqs = [
    { question: t("guide.faq.q.1"), answer: t("guide.faq.a.1") },
    { question: t("guide.faq.q.2"), answer: t("guide.faq.a.2") },
    { question: t("guide.faq.q.3"), answer: t("guide.faq.a.3") },
    { question: t("guide.faq.q.4"), answer: t("guide.faq.a.4") },
    { question: t("guide.faq.q.5"), answer: t("guide.faq.a.5") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-6 lg:px-8">
          <Link
            href="/feed"
            aria-label={t("guide.header.aria_back")}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {t("guide.header.title")}
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {t("guide.header.restricted")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <nav
              aria-label={t("guide.nav.aria")}
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

            <button
              onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              aria-label={locale === "fr" ? "Switch to English" : "Passer en Français"}
            >
              {locale === "fr" ? "EN" : "FR"}
            </button>
          </div>
        </div>

        <nav
          aria-label={t("guide.nav.aria_mobile")}
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
                {t("guide.sidebar.sommaire")}
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
                    {t("guide.sidebar.estimated_time")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("guide.sidebar.estimated_time_desc")}
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
                  {t("guide.hero.badge")}
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                    {t("guide.hero.title")}
                  </h1>
                  <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                    {t("guide.hero.description")}
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
              eyebrow={t("guide.demarrage.eyebrow")}
              title={t("guide.demarrage.title")}
              description={t("guide.demarrage.description")}
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
              eyebrow={t("guide.parcours.eyebrow")}
              title={t("guide.parcours.title")}
              description={t("guide.parcours.description")}
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
              eyebrow={t("guide.modules.eyebrow")}
              title={t("guide.modules.title")}
              description={t("guide.modules.description")}
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
                        {t("guide.modules.tips_label")}
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
                      {t("guide.modules.open")}
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
              eyebrow={t("guide.roles.eyebrow")}
              title={t("guide.roles.title")}
              description={t("guide.roles.description")}
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
              eyebrow={t("guide.faq.eyebrow")}
              title={t("guide.faq.title")}
              description={t("guide.faq.description")}
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
