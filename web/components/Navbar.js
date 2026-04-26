'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShieldCheck, Sun, Moon, Menu, X } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const stored = localStorage.getItem('sd-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const current = stored || (prefersDark ? 'dark' : 'light');
        setTheme(current);
        document.documentElement.setAttribute('data-theme', current);
    }, []);

    function toggleTheme() {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('sd-theme', next);
        document.documentElement.setAttribute('data-theme', next);
    }

    const isCheckoutPage = pathname?.startsWith('/pay');

    const links = [
        { href: '/', label: 'Home' },
        { href: '/#how-it-works', label: 'How it Works' },
        { href: '/#features', label: 'Features' },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={24} color="var(--brand)" /> Safe<span>Deliver</span>
                </Link>

                {!isCheckoutPage && (
                    <>
                        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                            {links.map(link => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={pathname === link.href ? 'active' : ''}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link href="/seller/login" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                                    Seller Login
                                </Link>
                            </li>
                            <li>
                                <button className="theme-toggle" onClick={toggleTheme} title="Toggle dark mode" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                </button>
                            </li>
                        </ul>
                    </>
                )}
            </div>
        </nav>
    );
}
