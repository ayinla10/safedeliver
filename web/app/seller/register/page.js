'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleRegister(e) {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            await api.post('/auth/register', form);
            localStorage.setItem('sd-verify-phone', form.phone);
            router.push('/seller/verify');
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
                        <h2>Create Seller Account</h2>
                        <p className="text-sm">Start selling with SafeDeliver</p>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input className="form-input" required value={form.full_name}
                                onChange={e => setForm({ ...form, full_name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input className="form-input" type="email" required value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input className="form-input" required placeholder="+233..." value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Password (min 8 characters)</label>
                            <input className="form-input" type="password" required minLength={8} value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                    <div className="text-center mt-2">
                        <Link href="/seller/login" style={{ fontSize: '0.9375rem' }}>Already have an account? Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
