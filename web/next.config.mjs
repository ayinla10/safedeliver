import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {},  // Silence the webpack/turbopack conflict warning
    experimental: {
        instrumentationHook: true,  // Required for Sentry in App Router
    },
};

export default withSentryConfig(nextConfig, {
    silent: true,
    disableLogger: true,
    // No tunnelRoute — send events directly to Sentry (simpler, no extra env vars needed)
});
