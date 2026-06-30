'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Clock, RefreshCw } from 'lucide-react';

function MaintenanceContent() {
    const searchParams = useSearchParams();
    const [message, setMessage] = useState('SafeDeliver is currently undergoing scheduled maintenance.');
    const [checking, setChecking] = useState(false);
    const [dots, setDots] = useState('');

    useEffect(() => {
        const msg = searchParams.get('message');
        if (msg) setMessage(decodeURIComponent(msg));
    }, [searchParams]);

    // Animated dots
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    async function checkStatus() {
        setChecking(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
            const res = await fetch(`${API_URL}/health`);
            if (res.ok) {
                // Back online — go back to wherever they came from or dashboard
                const returnTo = sessionStorage.getItem('maintenance-return') || '/seller/dashboard';
                window.location.href = returnTo;
            }
        } catch {
            // Still down
        } finally {
            setChecking(false);
        }
    }

    // Save where the user was trying to go
    useEffect(() => {
        const ref = document.referrer;
        if (ref && !ref.includes('/maintenance')) {
            sessionStorage.setItem('maintenance-return', ref);
        }
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background glow */}
            <div style={{
                position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
                width: 600, height: 600, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Floating orbs */}
            <div style={{ position: 'absolute', top: '10%', left: '15%', width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,107,0,0.4)', animation: 'pulse 2s infinite' }} />
            <div style={{ position: 'absolute', top: '25%', right: '20%', width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,149,0,0.3)', animation: 'pulse 2.5s infinite 0.5s' }} />
            <div style={{ position: 'absolute', bottom: '20%', left: '25%', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,107,0,0.25)', animation: 'pulse 3s infinite 1s' }} />

            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 520 }}>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '3rem' }}>
                    <ShieldCheck size={28} color="#FF6B00" />
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                        Safe<span style={{ color: '#FF6B00' }}>Deliver</span>
                    </span>
                </div>

                {/* Icon */}
                <div style={{
                    width: 96, height: 96, borderRadius: '50%',
                    background: 'rgba(255,107,0,0.1)',
                    border: '2px solid rgba(255,107,0,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 2rem',
                    boxShadow: '0 0 40px rgba(255,107,0,0.15)',
                }}>
                    <Clock size={44} color="#FF6B00" strokeWidth={1.5} />
                </div>

                {/* Heading */}
                <h1 style={{
                    fontSize: '2rem', fontWeight: 800, color: '#fff',
                    margin: '0 0 0.75rem', letterSpacing: '-0.5px', lineHeight: 1.2,
                }}>
                    We'll be back shortly{dots}
                </h1>

                {/* Message */}
                <p style={{
                    fontSize: '1rem', color: 'rgba(255,255,255,0.55)',
                    lineHeight: 1.7, margin: '0 0 2.5rem', fontWeight: 400,
                }}>
                    {message}
                </p>

                {/* Status bar */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, padding: '1.25rem 1.5rem',
                    marginBottom: '2rem',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                    <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#F59E0B',
                        boxShadow: '0 0 8px rgba(245,158,11,0.6)',
                        flexShrink: 0,
                        animation: 'pulse 1.5s infinite',
                    }} />
                    <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                        System under maintenance — estimated downtime is short
                    </span>
                </div>

                {/* Check again button */}
                <button
                    onClick={checkStatus}
                    disabled={checking}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        background: checking ? 'rgba(255,107,0,0.5)' : '#FF6B00',
                        color: '#fff', border: 'none', borderRadius: 12,
                        padding: '0.75rem 1.75rem', fontSize: '0.9rem',
                        fontWeight: 700, cursor: checking ? 'not-allowed' : 'pointer',
                        boxShadow: checking ? 'none' : '0 8px 24px rgba(255,107,0,0.3)',
                        transition: 'all 0.2s',
                    }}
                >
                    <RefreshCw size={16} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
                    {checking ? 'Checking...' : 'Check Again'}
                </button>

                <p style={{ marginTop: '2rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)' }}>
                    For urgent matters, contact support@safedeliver.com
                </p>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.85); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default function MaintenancePage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid rgba(255,107,0,0.3)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
        }>
            <MaintenanceContent />
        </Suspense>
    );
}
