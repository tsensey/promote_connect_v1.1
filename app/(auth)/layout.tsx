'use client';

import { CalendarDays, MessageSquare, Users } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  const trustPoints = [
    {
      icon: Users,
      title: t('auth.layout.qualify'),
      copy: t('auth.layout.qualify_desc'),
    },
    {
      icon: MessageSquare,
      title: t('auth.layout.exchanges'),
      copy: t('auth.layout.exchanges_desc'),
    },
    {
      icon: CalendarDays,
      title: t('auth.layout.access'),
      copy: t('auth.layout.access_desc'),
    },
  ];

  return (
    <div className="relative overflow-hidden bg-background">
      <div className="relative mx-auto grid min-h-screen w-full md:grid-cols-2">
        <section className="hidden min-h-full overflow-hidden md:flex">
          <div className="brand-gradient relative flex flex-1 flex-col justify-between overflow-hidden p-10 xl:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-[120%] w-auto opacity-[0.07] text-white">
              <svg viewBox="0 0 800 800" fill="currentColor" className="h-full w-auto" preserveAspectRatio="xMidYMid meet">
                <path d="M400 50C220 50 70 200 70 380s150 330 330 330 330-150 330-330S580 50 400 50zm-40 60c-20 10-40 30-50 50l-10 30c0 10-10 20-10 20s-10 0-20-10c-10-10-20-10-30-10-10 0-20 10-20 20l-20 30c-10 10-10 20 0 30 10 10 20 10 30 10 10 0 20-10 30-20 10-10 20-10 30 0l20 20c10 10 10 20 10 30 0 10-10 20-20 20l-50 10c-20 0-30 10-30 30v20c0 20 10 30 30 30h20c20 0 30 10 30 30v30c0 20-10 30-20 40l-20 20c-10 10-20 10-30 10-10 0-20-10-30-20l-40-40c-10-10-20-10-30 0-10 10-10 20 0 30l40 40c10 10 20 20 30 30 10 10 10 20 0 30-10 10-20 30-20 40v10c0 10 10 20 20 20h20c10 0 20 10 20 20v20c0 20 10 30 30 30h20c10 0 20 10 20 20v10c0 20 10 30 30 30 10 0 20-10 20-20l10-40c0-10 10-20 20-20 10 0 20 10 30 20l20 20c10 10 20 20 30 20 10 0 20-10 20-20l-10-30c-10-20-10-40 0-60 10-20 20-30 40-30h30c20 0 30-10 30-30v-10c0-20 10-30 30-30h20c10 0 20-10 20-20l10-50c0-20-10-30-30-30h-40c-10 0-20-10-20-20v-60c0-10 10-20 20-20h50c10 0 20-10 20-20l10-30c10-20 0-40-20-50l-50-20c-10-10-20-10-30-10-10 0-20 10-30 20l-20 20c-10 10-20 10-30 10-10 0-20-10-20-20s10-20 20-30l30-20c10-10 20-20 20-30v-20c0-10-10-20-20-20h-60c-10 0-20 10-30 20l-20 30c-10 10-20 20-30 20-10 0-20-10-30-20l-20-30c-10-10-20-20-30-20z"/>
              </svg>
            </div>

            <div className="relative space-y-8">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/20 font-bold text-lg">
                  P
                </span>
                {t('auth.layout.salon')}
              </div>

              <div className="max-w-2xl space-y-5">
                <h1 className="font-heading text-4xl leading-[1.05] text-white xl:text-5xl">
                  {t('auth.layout.tagline')}
                </h1>
                <p className="max-w-xl text-base leading-8 text-white/80 xl:text-lg">
                  {t('auth.layout.description')}
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


          <div className="flex w-full items-center justify-center p-6 sm:p-8">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
