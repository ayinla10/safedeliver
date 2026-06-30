'use client';
import { useState, useEffect } from 'react';
import { Download, X, ShieldCheck } from 'lucide-react';

const DISMISS_KEY = 'pwa-dismissed-at';
const DISMISS_DAYS = 30; // Don't show again for 30 days after dismissal

export default function PWAInstall() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }

        // Already installed as PWA — never show
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setInstalled(true);
            return;
        }

        // Check if user dismissed recently
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
            const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
            if (daysSince < DISMISS_DAYS) return; // Still within cooldown — don't show
        }

        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setTimeout(() => setShowPopup(true), 4000);
        };
        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', () => {
            setShowPopup(false);
            setInstalled(true);
            localStorage.removeItem(DISMISS_KEY);
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    async function handleInstall() {
        if (!installPrompt) return;
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowPopup(false);
            setInstalled(true);
        }
        setInstallPrompt(null);
    }

    function handleDismiss() {
        setShowPopup(false);
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }

    if (!showPopup || installed) return null;

    return (
        <>
            <div
                onClick={handleDismiss}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    zIndex: 9998,
                    backdropFilter: 'blur(4px)',
                }}
            />

            <div style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                zIndex: 9999,
                background: '#1a1a2e',
                borderRadius: '24px 24px 0 0',
                padding: '2rem 1.5rem 2.5rem',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
                animation: 'slideUp 0.3s ease',
            }}>
                <button
                    onClick={handleDismiss}
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'rgba(255,255,255,0.1)', border: 'none',
                        borderRadius: '50%', width: 32, height: 32,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#fff',
                    }}
                >
                    <X size={16} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 14,
                        background: '#FF6B00',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ShieldCheck size={28} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff' }}>SafeDeliver</div>
                        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>safedeliver.vercel.app</div>
                    </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>
                    Install the App
                </div>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', lineHeight: 1.6 }}>
                    Add SafeDeliver to your home screen for quick access and instant notifications.
                </p>

                <button
                    onClick={handleInstall}
                    style={{
                        width: '100%', padding: '1rem',
                        background: '#FF6B00', color: '#fff',
                        border: 'none', borderRadius: 12,
                        fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                        marginBottom: '0.75rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    }}
                >
                    <Download size={18} /> Install Now
                </button>
                <button
                    onClick={handleDismiss}
                    style={{
                        width: '100%', padding: '0.875rem',
                        background: 'transparent', color: 'rgba(255,255,255,0.4)',
                        border: 'none', borderRadius: 12,
                        fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                    }}
                >
                    Not now
                </button>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </>
    );
}
