'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [seller, setSeller] = useState(null);
    const [theme, setTheme] = useState('light');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('sd-token');
        const s = localStorage.getItem('sd-seller');
        if (!token) { router.push('/seller/login'); return; }
        if (s) setSeller(JSON.parse(s));
        const t = localStorage.getItem('sd-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(t);
        document.documentElement.setAttribute('data-theme', t);
    }, [router]);

    // Close sidebar on route change
    useEffect(() => { setSidebarOpen(false); }, [pathname]);

    function toggleTheme() {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('sd-theme', next);
        document.documentElement.setAttribute('data-theme', next);
    }

    function logout() {
        localStorage.removeItem('sd-token');
        localStorage.removeItem('sd-refresh-token');
        localStorage.removeItem('sd-seller');
        router.push('/seller/login');
    }

    const nav = [
        { href: '/seller/dashboard', icon: '◈', label: 'Dashboard' },
        { href: '/seller/dashboard/links', icon: '⊞', label: 'Checkout Links' },
        { href: '/seller/dashboard/orders', icon: '◫', label: 'Orders' },
        { href: '/seller/dashboard/kyc', icon: '◉', label: 'KYC Verification' },
        { href: '/seller/dashboard/profile', icon: '◎', label: 'Profile' },
    ];

    const sidebarContent = (
        <>
            <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link href="/" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Safe<span style={{ color: 'var(--text)' }}>Deliver</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-secondary)', display: 'none' }} className="sidebar-close-btn">✕</button>
            </div>
            {seller && <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{seller.full_name}</div>}
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
            <div style={{ padding: '1rem 0.75rem', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-sm btn-block" onClick={toggleTheme} style={{ marginBottom: '0.5rem' }}>
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button className="btn btn-ghost btn-sm btn-block" onClick={logout} style={{ color: 'var(--danger)' }}>
                    Logout
                </button>
            </div>
        </>
    );

    return (
        <div className="dashboard-layout">
            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                        zIndex: 199, display: 'none',
                    }}
                    className="sidebar-backdrop"
                />
            )}

            {/* Desktop sidebar */}
            <aside className="sidebar">
                {sidebarContent}
            </aside>

            {/* Mobile sidebar drawer */}
            <aside className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`}>
                {sidebarContent}
            </aside>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Mobile top bar */}
                <header className="mobile-topbar">
                    <button
                        className="hamburger-btn"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <span /><span /><span />
                    </button>
                    <Link href="/" style={{ fontWeight: 700, color: 'var(--brand)', fontSize: '1.1rem' }}>
                        Safe<span style={{ color: 'var(--text)' }}>Deliver</span>
                    </Link>
                    <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-secondary)', padding: '0.5rem' }}>
                        {theme === 'dark' ? '☀' : '☾'}
                    </button>
                </header>

                <main className="dashboard-main">
                    {children}
                </main>
            </div>
        </div>
    );
}
