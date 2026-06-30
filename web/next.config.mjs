import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {},  // Silence the webpack/turbopack conflict warning
};

export default withSentryConfig(nextConfig, {
    // Sentry org and project from https://sentry.io → Settings → Projects
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Only upload source maps in CI/production builds (requires SENTRY_AUTH_TOKEN)
    silent: true,
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Automatically tree-shake Sentry logger statements
    disableLogger: true,

    // Don't widen the bundle just for Sentry tunnelling
    tunnelRoute: '/monitoring',
});
