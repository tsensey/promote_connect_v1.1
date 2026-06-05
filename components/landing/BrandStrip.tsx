import Image from 'next/image';
import { ScrollReveal } from '@/components/shared/ScrollReveal';

export function BrandStrip() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16">
            <div className="relative w-full max-w-[400px] aspect-[16/9] overflow-hidden rounded-[32px] border border-border/50 group">
              <Image
                src="/PUBPROMOTE2026-1.webp"
                alt="PROMOTE 2026"
                fill
                className="object-cover transition-all duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div className="relative w-full max-w-[280px] aspect-[3/4] overflow-hidden rounded-[32px] border border-border/50 group">
              <Image
                src="/LADATEUK.webp"
                alt="PROMOTE - Rendez-vous d'affaires"
                fill
                className="object-cover transition-all duration-700 group-hover:scale-105"
                sizes="280px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </ScrollReveal>
      </div>

      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/30 to-transparent -translate-y-1/2 pointer-events-none" />
    </section>
  );
}
