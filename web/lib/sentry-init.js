import * as Sentry from '@sentry/nextjs';

if (typeof window !== 'undefined') {
    // Client-side only
    Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.05,
        enabled: process.env.NODE_ENV !== 'development',
        ignoreErrors: [
            'Network request failed',
            'Failed to fetch',
            'Load failed',
        ],
    });
}
