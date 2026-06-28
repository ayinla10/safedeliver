'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [form, setForm] = useState({ password: '', confirm: '' });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) setError('Invalid reset link. Please request a new one.');
    }, [token]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (form.password !== form.confirm) return setError('Passwords do not match');
        if (form.password.length < 8) return setError('Password must be at least 8 characters');
        setLoading(true); setError(null);
        try {
            await api.post('/auth/reset-password', { token, password: form.password });
            setSuccess(true);
            setTimeout(() => router.push('/seller/login'), 3000);
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
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
                        <h2>Reset Password</h2>
                        <p className="text-sm">Enter your new password below</p>
                    </div>

                    {success ? (
                        <div className="alert alert-success">
                            ✅ Password reset successfully! Redirecting to login...
                        </div>
                    ) : (
                        <>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input
                                        className="form-input"
                                        type="password"
                                        required
                                        minLength={8}
                                        placeholder="Min. 8 characters"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <input
                                        className="form-input"
                                        type="password"
                                        required
                                        placeholder="Repeat your password"
                                        value={form.confirm}
                                        onChange={e => setForm({ ...form, confirm: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-block" disabled={loading || !token}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                            <div className="text-center mt-2">
                                <Link href="/seller/forgot-password" className="text-sm">Request a new link</Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex-center" style={{ minHeight: '70vh' }}><div className="spinner" /></div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
