'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ phone: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            const data = await api.post('/auth/login', form);
            localStorage.setItem('sd-token', data.accessToken);
            localStorage.setItem('sd-refresh-token', data.refreshToken);
            localStorage.setItem('sd-seller', JSON.stringify(data.seller));
            router.push('/seller/dashboard');
        } catch (err) {
            setError(err.message);
        } finally { setLoading(false); }
    }

    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="section flex-center" style={{ minHeight: '70vh' }}>
                <div className="form-card animate-in">
                    <div className="text-center" style={{ marginBottom: '2rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
                        <h2>Seller Login</h2>
                        <p className="text-sm">Welcome back to SafeDeliver</p>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>Phone Number or Email</label>
                            <input className="form-input" required placeholder="+233... or email" value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input className="form-input" type="password" required value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                    <div className="text-center mt-2">
                        <Link href="/seller/register" style={{ fontSize: '0.9375rem' }}>Don&#39;t have an account? Register</Link>
                    </div>
                    <div className="text-center mt-1">
                        <Link href="/seller/forgot-password" className="text-sm">Forgot password?</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
