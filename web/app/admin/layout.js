'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [theme, setTheme] = useState('light');
    const [adminToken, setAdminToken] = useState(null);
    const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
    const [loginError, setLoginError] = useState(null);
    const [loginLoading, setLoginLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('sd-admin-token');
        if (token) setAdminToken(token);
        setChecking(false);
        const t = localStorage.getItem('sd-theme') || 'light';
        setTheme(t);
        document.documentElement.setAttribute('data-theme', t);
    }, []);

    function toggleTheme() {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('sd-theme', next);
        document.documentElement.setAttribute('data-theme', next);
    }

    async function handleAdminLogin(e) {
        e.preventDefault();
        setLoginLoading(true); setLoginError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            if (!data.seller?.is_admin) throw new Error('This account does not have admin privileges.');
            localStorage.setItem('sd-admin-token', data.accessToken);
            localStorage.setItem('sd-admin-refresh', data.refreshToken);
            setAdminToken(data.accessToken);
        } catch (err) {
            setLoginError(err.message);
        } finally { setLoginLoading(false); }
    }

    function logout() {
        localStorage.removeItem('sd-admin-token');
        localStorage.removeItem('sd-admin-refresh');
        setAdminToken(null);
    }

    if (checking) return null;

    // Show admin login if not authenticated
    if (!adminToken) {
        return (
            <div className="page-wrapper">
                <div className="section flex-center" style={{ minHeight: '100vh' }}>
                    <div className="form-card animate-in" style={{ maxWidth: '420px' }}>
                        <div className="text-center" style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>�</div>
                            <h2>Admin Panel</h2>
                            <p className="text-sm">SafeDeliver Administration</p>
                        </div>
                        {loginError && <div className="alert alert-danger">{loginError}</div>}
                        <form onSubmit={handleAdminLogin}>
                            <div className="form-group">
                                <label>Admin Email</label>
                                <input className="form-input" required placeholder="admin@safedeliver.co"
                                    value={loginForm.phone} onChange={e => setLoginForm({ ...loginForm, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input className="form-input" type="password" required
                                    value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block" disabled={loginLoading}>
                                {loginLoading ? 'Signing in...' : 'Sign In to Admin'}
                            </button>
                        </form>
                        <div className="text-center mt-2">
                            <Link href="/" className="text-sm">← Back to SafeDeliver</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const nav = [
        { href: '/admin', icon: '📊', label: 'Overview' },
        { href: '/admin/disputes', icon: '⚖️', label: 'Disputes' },
        { href: '/admin/transactions', icon: '📦', label: 'Transactions' },
        { href: '/admin/ledger', icon: '📒', label: 'Sim Ledger' },
        { href: '/admin/notifications', icon: '🔔', label: 'Notifications' },
        { href: '/admin/sellers', icon: '👥', label: 'Sellers' },
        { href: '/admin/kyc', icon: '🪪', label: 'KYC Review' },
        { href: '/admin/audit', icon: '📋', label: 'Audit Logs' },
        { href: '/admin/settings', icon: '⚙️', label: 'Settings' },
    ];

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <Link href="/" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--brand)' }}>
                        🛡️ Admin Panel
                    </Link>
                    <p className="text-sm" style={{ marginTop: '0.25rem', color: 'var(--danger)' }}>SafeDeliver Admin</p>
                </div>
                <ul className="sidebar-nav">
                    {nav.map(item => (
                        <li key={item.href}>
                            <Link href={item.href} className={pathname === item.href ? 'active' : ''}>
                                <span className="nav-icon">{item.icon}</span>
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div style={{ padding: '1rem 0.75rem' }}>
                    <button className="btn btn-ghost btn-sm btn-block" onClick={toggleTheme} style={{ marginBottom: '0.5rem' }}>
                        {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                    </button>
                    <button className="btn btn-ghost btn-sm btn-block" onClick={logout} style={{ color: 'var(--danger)' }}>Logout</button>
                </div>
            </aside>
            <main className="dashboard-main">{children}</main>
        </div>
    );
}
