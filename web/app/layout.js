import './globals.css';

export const metadata = {
  title: 'SafeDeliver — Escrow for Social Commerce',
  description: 'SafeDeliver protects every social commerce transaction in Ghana. Your money is safe until your item arrives.',
  keywords: 'escrow, social commerce, Ghana, mobile money, buyer protection, seller payout',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SafeDeliver" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body suppressHydrationWarning>
        <ThemeScript />
        <ServiceWorkerScript />
        {children}
      </body>
    </html>
  );
}

function ThemeScript() {
  const script = `
    (function() {
      try {
        var path = window.location.pathname;
        if (path.includes('/pay/')) {
          document.documentElement.setAttribute('data-theme', 'light');
          return;
        }
        var theme = localStorage.getItem('sd-theme');
        if (theme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
        }
      } catch(e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function ServiceWorkerScript() {
  const script = `
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').catch(function(err) {
          console.warn('SW registration failed:', err);
        });
      });
    }
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
