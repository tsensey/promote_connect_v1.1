import { CalendarDays, MessageSquare, ShieldCheck, Users } from "lucide-react";

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
    title: "Suivi 12 mois",
    copy: "Gardez votre dynamique post-salon avec agenda, vitrine et opportunites business.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative  overflow-hidden bg-[linear-gradient(180deg,#fffaf6_0%,#f6f7fb_100%)]">
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(145,36,80,0.18),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(214,158,46,0.18),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(35,74,140,0.12),transparent_24%)]" />
      <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),transparent)]" /> */}

      <div className="relative mx-auto grid md:grid-cols-2 w-full min-h-screen">
        <section className="hidden min-h-full overflow-hidden bg-slate-950 text-white shadow-[0_30px_100px_-45px_rgba(15,23,42,0.7)] lg:flex">
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden p-10 xl:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_28%),linear-gradient(135deg,rgba(145,36,80,0.96)_0%,rgba(117,42,104,0.94)_45%,rgba(15,23,42,1)_100%)]" />
            <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <div className="relative space-y-8">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/16 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/16 font-semibold">
                  P
                </span>
                Salon PROMOTE 2026
              </div>

              <div className="max-w-2xl space-y-5">
                <h1 className="text-5xl leading-[1.05] xl:text-6xl">
                  Le reseau professionnel PROMOTE-CONNECT, pense pour conclure
                  plus vite.
                </h1>
                <p className="max-w-xl text-base leading-8 text-white/76 xl:text-lg">
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
                  className="rounded-[28px] border border-white/14 bg-white/10 p-5 backdrop-blur"
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-white/14">
                    <point.icon className="size-5" />
                  </div>
                  <p className="text-base font-semibold">{point.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/72">
                    {point.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-full flex-col justify-center w-full">
          <div className="border border-white/80 bg-white/85 p-5 shadow-[0_20px_70px_-38px_rgba(15,23,42,0.45)] backdrop-blur lg:hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
                  PROMOTE-CONNECT
                </p>
                <h1 className="mt-2 text-3xl leading-tight text-foreground">
                  Connexion simple, reseau actif toute l annee.
                </h1>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-6" />
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {trustPoints.map((point) => (
                <div key={point.title} className="rounded-2xl bg-muted/55 p-3">
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

          <div className="w-full overflow-hidden bg-white/92 h-screen overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl flex justifly-center items-center p-6 sm:p-12">
              {children}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
