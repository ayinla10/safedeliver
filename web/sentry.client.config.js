import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    // Capture 100% of errors, 5% of performance traces (browser)
    tracesSampleRate: 0.05,
    // Only send errors in production
    enabled: process.env.NODE_ENV === 'production',
    // Don't report network errors from maintenance mode redirects
    ignoreErrors: [
        'Network request failed',
        'Failed to fetch',
        'Load failed',
    ],
});
