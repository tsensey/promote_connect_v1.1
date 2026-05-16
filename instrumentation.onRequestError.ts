export const onRequestError = (
  _request: Request,
  _context: { routerKind: string; routeType: string; routeKey: string },
  error: Error
) => {
  const Sentry = require('@sentry/nextjs');
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error);
  }
};
