import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <span className="text-4xl font-bold text-muted-foreground/40">404</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground">Page introuvable</h1>
      <p className="max-w-sm text-muted-foreground">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
