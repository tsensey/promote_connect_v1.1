import Image from 'next/image';

export function BrandStrip() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 opacity-80 hover:opacity-100 transition-opacity">
          <div className="relative w-full max-w-[400px] aspect-[16/9] overflow-hidden rounded-[32px] border border-white/10 group">
            <Image
              src="/PUBPROMOTE2026-1.webp"
              alt="PROMOTE 2026"
              fill
              className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
          <div className="relative w-full max-w-[280px] aspect-[3/4] overflow-hidden rounded-[32px] border border-white/10 group">
            <Image
              src="/LADATEUK.webp"
              alt="PROMOTE - Rendez-vous d'affaires"
              fill
              className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
              sizes="280px"
            />
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 -z-10" />
    </section>
  );
}
