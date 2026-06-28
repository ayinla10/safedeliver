'use client';
import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function PWAInstall() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showBtn, setShowBtn] = useState(false);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.warn('SW registration failed:', err);
            });
        }

        // Capture the install prompt
        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setShowBtn(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // Hide button if already installed
        window.addEventListener('appinstalled', () => {
            setShowBtn(false);
            setInstalled(true);
        });

        // Check if already running as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setInstalled(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    async function handleInstall() {
        if (!installPrompt) return;
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBtn(false);
            setInstalled(true);
        }
        setInstallPrompt(null);
    }

    if (!showBtn || installed) return null;

    return (
        <button
            onClick={handleInstall}
            style={{
                position: 'fixed',
                bottom: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#FF6B00',
                color: '#fff',
                border: 'none',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(255,107,0,0.4)',
                whiteSpace: 'nowrap',
            }}
        >
            <Download size={18} />
            Install SafeDeliver App
        </button>
    );
}
