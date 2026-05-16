import * as Sentry from '@sentry/nextjs';

export default function SentryErrorBoundary({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return <>{children}</>;
  }

  return <Sentry.ErrorBoundary fallback={<ErrorFallback />}>{children}</Sentry.ErrorBoundary>;
}

function ErrorFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
        <span className="text-4xl font-bold text-destructive">!</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground">Une erreur est survenue</h1>
      <p className="max-w-sm text-muted-foreground">
        Notre équipe a été notifiée. Veuillez réessayer plus tard.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Réessayer
      </button>
    </div>
  );
}
