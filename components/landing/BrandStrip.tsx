import Image from 'next/image';

export function BrandStrip() {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="relative aspect-[353/500] overflow-hidden rounded-2xl">
            <Image
              src="/PUBPROMOTE2026-1.webp"
              alt="PROMOTE 2026"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="relative mx-auto aspect-[214/277] overflow-hidden rounded-2xl md:mx-0">
            <Image
              src="/LADATEUK.webp"
              alt="PROMOTE - Rendez-vous d'affaires"
              width={280}
              height={363}
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
