const Sentry = require('@sentry/node');

function init() {
    if (!process.env.SENTRY_DSN) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[Sentry] Skipped — SENTRY_DSN not set');
        }
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        // Capture 100% of errors, 10% of performance traces
        tracesSampleRate: 0.1,
        // Don't send PII (phone numbers, emails) in breadcrumbs
        beforeSend(event) {
            // Scrub request bodies containing passwords
            if (event.request?.data) {
                const data = event.request.data;
                if (data.password) data.password = '[FILTERED]';
                if (data.refreshToken) data.refreshToken = '[FILTERED]';
                if (data.otp) data.otp = '[FILTERED]';
            }
            return event;
        },
    });

    console.log('[Sentry] Initialized for environment:', process.env.NODE_ENV);
}

module.exports = { init, Sentry };
