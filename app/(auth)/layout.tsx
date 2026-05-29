'use client';

import { CalendarDays, MessageSquare, Users } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import Image from "next/image";

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
        <section className="hidden min-h-full overflow-hidden md:flex bg-[#520a3f] relative">
          {/* World Map Dots Background */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/world-map-dots.jpg"
              alt="World Map Dots"
              fill
              sizes="(max-width: 768px) 0vw, 50vw"
              className="object-cover opacity-40 mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#520a3f]/60 via-transparent to-[#520a3f] z-10" />
          </div>

          <div className="relative z-20 flex flex-1 flex-col justify-between p-10 xl:p-12">
            <div className="space-y-8">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <div className="relative size-8 overflow-hidden rounded-lg p-1">
                  <Image
                    src="/logo_transparent.png"
                    alt="PROMOTE"
                    fill
                    sizes="32px"
                    className="object-contain p-1"
                  />
                </div>
                {t('auth.layout.salon')}
              </div>

              <div className="max-w-2xl space-y-5">
                <h1 className="font-heading text-4xl font-black leading-[1.1] tracking-tight text-white xl:text-5xl drop-shadow-lg">
                  {t('auth.layout.tagline')}
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-white/80 xl:text-xl font-light">
                  {t('auth.layout.description')}
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {trustPoints.map((point) => (
                <div
                  key={point.title}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm ring-1 ring-white/10 hover:bg-white/20 transition-colors"
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-white/10 text-white">
                    <point.icon className="size-5" />
                  </div>
                  <p className="text-base font-bold text-white">
                    {point.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {point.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-full w-full flex-col justify-center relative bg-background">
          <div className="flex w-full items-center justify-center p-6 sm:p-12">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
