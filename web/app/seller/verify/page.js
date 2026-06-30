'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Smartphone } from 'lucide-react';
import { api } from '@/lib/api';

export default function VerifyPage() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        const p = localStorage.getItem('sd-verify-phone');
        if (p) setPhone(p);
    }, []);

    useEffect(() => {
        if (countdown > 0) {
            const t = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [countdown]);

    async function handleVerify(e) {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            const data = await api.post('/auth/verify-otp', { phone, otp });
            localStorage.setItem('sd-token', data.accessToken);
            localStorage.setItem('sd-refresh-token', data.refreshToken);
            localStorage.removeItem('sd-verify-phone');
            router.push('/seller/dashboard');
        } catch (err) {
            setError(err.message);
        } finally { setLoading(false); }
    }

    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="section flex-center" style={{ minHeight: '70vh' }}>
                <div className="form-card animate-in text-center">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}><Smartphone size={48} color="var(--brand)" /></div>
                    <h2>Verify Your Phone</h2>
                    <p className="text-sm" style={{ marginBottom: '1.5rem' }}>
                        A 6-digit code was sent to <strong>{phone}</strong>
                    </p>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleVerify}>
                        <div className="form-group">
                            <input className="form-input" required placeholder="Enter 6-digit OTP"
                                maxLength={6} value={otp} style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', fontFamily: 'var(--font-mono)' }}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading || otp.length !== 6}>
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                    </form>
                    <p className="text-sm mt-2">
                        {countdown > 0 ? `Resend in ${countdown}s` : (
                            <button className="btn btn-ghost btn-sm" onClick={() => setCountdown(60)}>Resend OTP</button>
                        )}
                    </p>
                    <p className="text-sm mt-1" style={{ opacity: 0.6 }}>
                        💡 Check your terminal/console for the OTP code (dev mode)
                    </p>
                </div>
            </div>
        </div>
    );
}
