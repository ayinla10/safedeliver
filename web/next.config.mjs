import withPWA from 'next-pwa';

const pwaConfig = withPWA({
    dest: 'public',
    register: false,        // We register manually for push support
    skipWaiting: true,
    sw: 'sw.js',           // Use our custom service worker
    disable: process.env.NODE_ENV === 'development', // Disable in dev to avoid caching issues
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
};

export default pwaConfig(nextConfig);
