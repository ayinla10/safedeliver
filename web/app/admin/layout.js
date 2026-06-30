'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard, Scale, ArrowRightLeft, Database, Bell,
    Users, ShieldCheck, ClipboardList, Settings, Sun, Moon,
    LogOut, ChevronLeft, Menu, MessageSquare
} from 'lucide-react';

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const [theme, setTheme] = useState('light');
    const [adminToken, setAdminToken] = useState(null);
    const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
    const [loginError, setLoginError] = useState(null);
    const [loginLoading, setLoginLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const t = localStorage.getItem('sd-theme') || 'light';
        setTheme(t);
        document.documentElement.setAttribute('data-theme', t);

        const token = localStorage.getItem('sd-admin-token');
        if (!token) { setChecking(false); return; }

        // Always validate the token live against the backend.
        // Admin sessions are never trusted from cache alone — if the backend
        // can't be reached, we show the login form (security over convenience).
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        fetch(`${API_URL}/admin/settings`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }).then(async res => {
            if (res.ok) {
                setAdminToken(token);
            } else {
                // Token invalid, expired, or any other error — clear and show login
                localStorage.removeItem('sd-admin-token');
                localStorage.removeItem('sd-admin-refresh');
                // adminToken stays null → login form shown
            }
        }).catch(() => {
            // Network error (server down / cold start) — clear token, show login
            // Never trust a cached admin token without live confirmation
            localStorage.removeItem('sd-admin-token');
            localStorage.removeItem('sd-admin-refresh');
        }).finally(() => setChecking(false));
    }, []);

    useEffect(() => { setSidebarOpen(false); }, [pathname]);

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
            // Store access token only — no refresh token for admin sessions.
            // When the access token expires the admin must log in again.
            localStorage.setItem('sd-admin-token', data.accessToken);
            localStorage.removeItem('sd-admin-refresh'); // clear any stale refresh token
            setAdminToken(data.accessToken);
        } catch (err) {
            setLoginError(err.message);
        } finally { setLoginLoading(false); }
    }

    function logout() {
        localStorage.removeItem('sd-admin-token');
        localStorage.removeItem('sd-admin-refresh');
        setAdminToken(null);
        setLoginForm({ phone: '', password: '' });
        setLoginError(null);
    }

    if (checking) return null;

    if (!adminToken) {
        return (
            <div className="page-wrapper">
                <div className="section flex-center" style={{ minHeight: '100vh' }}>
                    <div className="form-card animate-in" style={{ maxWidth: '420px' }}>
                        <div className="text-center" style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <ShieldCheck size={48} color="var(--brand)" />
                            </div>
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
                            <Link href="/" className="text-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                <ChevronLeft size={16} /> Back to SafeDeliver
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const nav = [
        { href: '/admin', icon: <LayoutDashboard size={18} />, label: 'Overview' },
        { href: '/admin/disputes', icon: <Scale size={18} />, label: 'Disputes' },
        { href: '/admin/transactions', icon: <ArrowRightLeft size={18} />, label: 'Transactions' },
        { href: '/admin/ledger', icon: <Database size={18} />, label: 'Sim Ledger' },
        { href: '/admin/notifications', icon: <Bell size={18} />, label: 'Notifications' },
        { href: '/admin/sellers', icon: <Users size={18} />, label: 'Sellers' },
        { href: '/admin/kyc', icon: <ShieldCheck size={18} />, label: 'KYC Review' },
        { href: '/admin/audit', icon: <ClipboardList size={18} />, label: 'Audit Logs' },
        { href: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
        { href: '/admin/contact-enquiries', icon: <MessageSquare size={18} />, label: 'Enquiries' },
    ];

    const sidebarContent = (
        <>
            <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link href="/" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={20} /> Admin Panel
                </Link>
            </div>
            <div style={{ padding: '0.5rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                SafeDeliver Admin
            </div>
            <ul className="sidebar-nav">
                {nav.map(item => (
                    <li key={item.href}>
                        <Link href={item.href} className={pathname === item.href ? 'active' : ''} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="nav-icon" style={{ display: 'flex' }}>{item.icon}</span>
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
            <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-sm btn-block" onClick={toggleTheme} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {theme === 'dark' ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
                </button>
                <button className="btn btn-ghost btn-sm btn-block" onClick={logout} style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </>
    );

    return (
        <div className="dashboard-layout">
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="sidebar-backdrop"
                />
            )}
            <aside className="sidebar">{sidebarContent}</aside>
            <aside className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`}>{sidebarContent}</aside>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <header className="mobile-topbar">
                    <button
                        className="hamburger-btn"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>
                    <span style={{ fontWeight: 700, color: 'var(--brand)', fontSize: '1.1rem' }}>Admin Panel</span>
                    <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '0.5rem' }}>
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </header>
                <main className="dashboard-main">{children}</main>
            </div>
        </div>
    );
}
