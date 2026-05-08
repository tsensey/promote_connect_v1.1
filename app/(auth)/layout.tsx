import { CalendarDays, MessageSquare, Users } from "lucide-react";

const trustPoints = [
  {
    icon: Users,
    title: "Reseau qualifie",
    copy: "Retrouvez exposants, visiteurs et partenaires dans un meme espace professionnel.",
  },
  {
    icon: MessageSquare,
    title: "Echanges directs",
    copy: "Demarrez une conversation ou un rendez-vous B2B sans sortir de la plateforme.",
  },
  {
    icon: CalendarDays,
    title: "Acces administre",
    copy: "Recevez vos identifiants par email et retrouvez agenda, vitrine et opportunites business dans un meme espace.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-background">
      <div className="relative mx-auto grid min-h-screen w-full md:grid-cols-2">
        <section className="hidden min-h-full overflow-hidden md:flex">
          <div className="brand-gradient relative flex flex-1 flex-col justify-between overflow-hidden p-10 xl:p-12">
            <div className="absolute right-0 top-0 size-[30rem] translate-x-1/3 -translate-y-1/3 rounded-full bg-white/5" />
            <div className="absolute bottom-0 left-0 size-64 translate-x-[-20%] translate-y-1/4 rounded-full bg-white/5" />

            <div className="relative space-y-8">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/20 font-bold">
                  P
                </span>
                Salon PROMOTE 2026
              </div>

              <div className="max-w-2xl space-y-5">
                <h1 className="font-heading text-4xl leading-[1.05] text-white xl:text-5xl">
                  Le reseau professionnel PROMOTE-CONNECT, pense pour conclure
                  plus vite.
                </h1>
                <p className="max-w-xl text-base leading-8 text-white/80 xl:text-lg">
                  Authentification securisee, annuaire intelligent, messagerie
                  privee, agenda B2B et vitrine exposants dans une experience
                  claire, premium et mobile-first.
                </p>
              </div>
            </div>

            <div className="relative mt-10 grid gap-4 xl:grid-cols-3">
              {trustPoints.map((point) => (
                <div
                  key={point.title}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-white/20">
                    <point.icon className="size-5 text-white" />
                  </div>
                  <p className="text-base font-semibold text-white">
                    {point.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {point.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-full w-full flex-col justify-center">
          <div className="surface-panel m-4 border-0 lg:hidden">
            <div className="flex items-start justify-between gap-4 p-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
                  PROMOTE-CONNECT
                </p>
                <h1 className="mt-2 font-heading text-2xl leading-tight text-foreground">
                  Connexion simple, acces pilote par l administrateur.
                </h1>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {trustPoints.map((point) => (
                <div key={point.title} className="surface-subtle p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {point.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {point.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex w-full items-center justify-center p-6 sm:p-8">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
