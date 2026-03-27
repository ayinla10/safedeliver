'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [seller, setSeller] = useState(null);
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const token = localStorage.getItem('sd-token');
        const s = localStorage.getItem('sd-seller');
        if (!token) { router.push('/seller/login'); return; }
        if (s) setSeller(JSON.parse(s));
        const t = localStorage.getItem('sd-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(t);
    }, [router]);

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
        { href: '/seller/dashboard', icon: '📊', label: 'Dashboard' },
        { href: '/seller/dashboard/links', icon: '🔗', label: 'Checkout Links' },
        { href: '/seller/dashboard/orders', icon: '📦', label: 'Orders' },
        { href: '/seller/dashboard/kyc', icon: '🪪', label: 'KYC Verification' },
        { href: '/seller/dashboard/profile', icon: '👤', label: 'Profile' },
    ];

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <Link href="/" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        🛡️ Safe<span style={{ color: 'var(--text)' }}>Deliver</span>
                    </Link>
                    {seller && <p className="text-sm" style={{ marginTop: '0.5rem' }}>{seller.full_name}</p>}
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
                <div style={{ padding: '1rem 0.75rem', marginTop: 'auto' }}>
                    <button className="btn btn-ghost btn-sm btn-block" onClick={toggleTheme} style={{ marginBottom: '0.5rem' }}>
                        {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                    <button className="btn btn-ghost btn-sm btn-block" onClick={logout} style={{ color: 'var(--danger)' }}>
                        Logout
                    </button>
                </div>
            </aside>
            <main className="dashboard-main">
                {children}
            </main>
        </div>
    );
}
