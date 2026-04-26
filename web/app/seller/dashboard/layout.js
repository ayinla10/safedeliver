'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
    LayoutDashboard, Link2, ShoppingBag, ShieldCheck, 
    User, Home, Sun, Moon, LogOut, Menu 
} from 'lucide-react';

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
        { href: '/seller/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { href: '/seller/dashboard/links', icon: <Link2 size={18} />, label: 'Checkout Links' },
        { href: '/seller/dashboard/orders', icon: <ShoppingBag size={18} />, label: 'Orders' },
        { href: '/seller/dashboard/kyc', icon: <ShieldCheck size={18} />, label: 'KYC Verification' },
        { href: '/seller/dashboard/profile', icon: <User size={18} />, label: 'Profile' },
    ];

    const bottomNav = [
        { href: '/seller/dashboard', icon: <Home size={20} />, label: 'Home' },
        { href: '/seller/dashboard/links', icon: <Link2 size={20} />, label: 'Links' },
        { href: '/seller/dashboard/orders', icon: <ShoppingBag size={20} />, label: 'Orders' },
        { href: '/seller/dashboard/kyc', icon: <ShieldCheck size={20} />, label: 'KYC' },
        { href: '/seller/dashboard/profile', icon: <User size={20} />, label: 'Profile' },
    ];

    const sidebarContent = (
        <>
            <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link href="/seller/dashboard" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={20} /> Safe<span style={{ color: 'var(--text)' }}>Deliver</span>
                </Link>
            </div>
            {seller && <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{seller.full_name}</div>}
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
            <div style={{ padding: '1rem 0.75rem', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
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
            {/* Backdrop */}
            {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="sidebar-backdrop" />}

            {/* Desktop sidebar */}
            <aside className="sidebar">{sidebarContent}</aside>

            {/* Mobile sidebar drawer */}
            <aside className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`}>{sidebarContent}</aside>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Mobile top bar */}
                <header className="mobile-topbar">
                    <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                        <Menu size={24} />
                    </button>
                    <Link href="/seller/dashboard" style={{ fontWeight: 700, color: 'var(--brand)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldCheck size={18} /> Safe<span style={{ color: 'var(--text)' }}>Deliver</span>
                    </Link>
                    <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '0.5rem' }}>
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </header>

                <main className="dashboard-main">{children}</main>

                {/* Bottom Navigation — mobile only */}
                <nav className="bottom-nav">
                    {bottomNav.map(item => (
                        <Link key={item.href} href={item.href} className={`bottom-nav-item ${pathname === item.href ? 'active' : ''}`}>
                            <span className="bottom-nav-icon">{item.icon}</span>
                            <span className="bottom-nav-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
