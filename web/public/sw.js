// SafeDeliver Service Worker — handles push notifications and offline caching

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const title = data.title || 'SafeDeliver';
    const options = {
        body: data.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { url: data.url || '/' },
        vibrate: [200, 100, 200],
        requireInteraction: false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click — open the app at the right URL
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});

// Basic offline cache for core pages
const CACHE_NAME = 'safedeliver-v1';
const PRECACHE = ['/', '/seller/login', '/seller/register'];

self.addEventListener('fetch', (event) => {
    // Only cache GET requests for same origin
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;
    // Don't cache API calls
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
