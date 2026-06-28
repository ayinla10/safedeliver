'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            await api.post('/auth/forgot-password', { email });
            setSubmitted(true);
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
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔑</div>
                        <h2>Forgot Password</h2>
                        <p className="text-sm">Enter your email and we'll send you a reset link</p>
                    </div>

                    {submitted ? (
                        <div className="alert alert-success">
                            ✅ If that email exists, a reset link has been sent. Check your inbox.
                            <div className="text-center mt-2">
                                <Link href="/seller/login" className="text-sm">Back to Login</Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        className="form-input"
                                        type="email"
                                        required
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                            <div className="text-center mt-2">
                                <Link href="/seller/login" className="text-sm">Back to Login</Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
