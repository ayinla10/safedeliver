'use client';
import { useState, useEffect } from 'react';
import { Download, X, ShieldCheck, Bell, Wifi } from 'lucide-react';

export default function PWAInstall() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
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
            // Show popup after 3 seconds so user can see the page first
            setTimeout(() => setShowPopup(true), 3000);
        };
        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setShowPopup(false);
            setInstalled(true);
        });

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
            setShowPopup(false);
            setInstalled(true);
        }
        setInstallPrompt(null);
    }

    function handleDismiss() {
        setShowPopup(false);
        // Don't show again for this session
    }

    if (!showPopup || installed) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={handleDismiss}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    zIndex: 9998,
                    backdropFilter: 'blur(4px)',
                }}
            />

            {/* Popup */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                background: '#1a1a2e',
                borderRadius: '24px 24px 0 0',
                padding: '2rem 1.5rem 2.5rem',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
                animation: 'slideUp 0.3s ease',
            }}>
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#fff',
                    }}
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        background: '#FF6B00',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    Get instant push notifications for new orders and payments. Works offline too.
                </p>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                    {[
                        { icon: <Bell size={16} />, text: 'Instant order & payment notifications' },
                        { icon: <Wifi size={16} />, text: 'Works offline — no internet needed' },
                        { icon: <Download size={16} />, text: 'No App Store — installs in seconds' },
                    ].map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ color: '#FF6B00', flexShrink: 0 }}>{f.icon}</div>
                            <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>{f.text}</span>
                        </div>
                    ))}
                </div>

                {/* Buttons */}
                <button
                    onClick={handleInstall}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#FF6B00',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 12,
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <Download size={18} /> Install Now
                </button>
                <button
                    onClick={handleDismiss}
                    style={{
                        width: '100%',
                        padding: '0.875rem',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.4)',
                        border: 'none',
                        borderRadius: 12,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
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
