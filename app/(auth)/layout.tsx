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


            <div className="relative space-y-8">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/20 font-bold">
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
