import * as Sentry from '@sentry/nextjs';

export const onRequestError = (
  _request: Request,
  _context: { routerKind: string; routeType: string; routeKey: string },
  error: Error
) => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error);
  }
};
