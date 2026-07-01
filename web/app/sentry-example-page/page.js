'use client';
import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';
import '@/lib/sentry-init';

export default function SentryTestPage() {
    const [done, setDone] = useState(null);

    function throwError() {
        try {
            throw new Error('SafeDeliver Sentry test — frontend error');
        } catch (err) {
            Sentry.captureException(err);
            setDone('frontend');
        }
    }

    async function throwServerError() {
        const res = await fetch('/api/sentry-test');
        const data = await res.json();
        setDone('server');
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f5' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '2.5rem', maxWidth: 480, width: '90%', boxShadow: '0 1px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🐛</div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Sentry Test Page</h1>
                <p style={{ fontSize: '0.875rem', color: '#71717a', marginBottom: '2rem' }}>
                    Click the buttons below to send test events to Sentry. Check your Sentry dashboard for them.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={throwError}
                        style={{ padding: '0.75rem', borderRadius: 8, border: 'none', background: '#FF6B00', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
                    >
                        Test Frontend Error (Browser)
                    </button>
                    <button
                        onClick={throwServerError}
                        style={{ padding: '0.75rem', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
                    >
                        Test Server Error (SSR / API Route)
                    </button>
                </div>

                {done && (
                    <div style={{ marginTop: '1.5rem', padding: '0.875rem', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.875rem', fontWeight: 600 }}>
                        ✅ {done === 'frontend' ? 'Frontend' : 'Server'} event sent! Check Sentry → Issues.
                    </div>
                )}

                <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#a1a1aa' }}>
                    Delete this page before going live or restrict it to admin only.
                </p>
            </div>
        </div>
    );
}
