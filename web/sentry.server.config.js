import * as Sentry from '@sentry/nextjs';

Sentry.init({
    // SENTRY_DSN for server-side (not exposed to browser)
    // Falls back to NEXT_PUBLIC_SENTRY_DSN if only one is set
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === 'production',
});
