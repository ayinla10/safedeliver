'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { XCircle } from 'lucide-react';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reference = searchParams.get('reference');
    const orderRef = searchParams.get('order_ref') || searchParams.get('trxref') || reference; // fallback
    const [msg, setMsg] = useState('Verifying payment securely...');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!reference) {
            if (orderRef) router.push(`/track/${orderRef}`);
            else router.push('/');
            return;
        }

        api.get(`/pay/verify/${reference}`)
            .then(res => {
                if (res.verified) {
                    setMsg('Payment successful! Redirecting...');
                    setTimeout(() => {
                        router.push(`/track/${res.order_ref || orderRef}`);
                    }, 2000);
                } else {
                    setError(res.message || 'Payment verification failed');
                }
            })
            .catch(err => {
                setError(err.message || 'Failed to verify payment');
            });
    }, [reference, orderRef, router]);

    return (
        <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card text-center" style={{ maxWidth: 400, width: '100%', padding: '3rem 1.5rem' }}>
                {!error ? (
                    <>
                        <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
                        <h3 style={{ margin: 0 }}>{msg}</h3>
                        <p className="text-sm mt-1 text-muted">Please don't close this page.</p>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><XCircle size={52} color="var(--danger)" /></div>
                        <h3 style={{ margin: 0, color: 'var(--danger)' }}>Payment Failed</h3>
                        <p className="text-sm mt-1">{error}</p>
                        <button 
                            className="btn btn-ghost btn-block mt-3" 
                            onClick={() => router.push(orderRef ? `/track/${orderRef}` : '/')}
                        >
                            Return to Order
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <div className="page-wrapper">
            <Navbar />
            <Suspense fallback={<div className="section flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>}>
                <VerifyContent />
            </Suspense>
            <Footer />
        </div>
    );
}
