'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

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

    const links = [
        { href: '/', label: 'Home' },
        { href: '/contact', label: 'Contact' },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand">
                    🛡️ Safe<span>Deliver</span>
                </Link>

                <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? '✕' : '☰'}
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
                        <button className="theme-toggle" onClick={toggleTheme} title="Toggle dark mode">
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
