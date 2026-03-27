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
      </head>
      <body suppressHydrationWarning>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}

function ThemeScript() {
  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('sd-theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      } catch(e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
