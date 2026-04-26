'use client';
import Link from 'next/link';
import { ShieldCheck, MessageCircle } from 'lucide-react';

const Instagram = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
);

const Facebook = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

const Twitter = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div>
                    <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <ShieldCheck size={20} color="var(--brand)" /> SafeDeliver
                    </div>
                    <p className="text-sm" style={{ maxWidth: 280, lineHeight: 1.7 }}>
                        Protecting every social commerce transaction in Ghana. Buy and sell with confidence.
                    </p>
                    <div className="social-icons" style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                        <div className="social-icon" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageCircle size={18} /></div>
                        <div className="social-icon" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Instagram"><Instagram size={18} /></div>
                        <div className="social-icon" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Facebook"><Facebook size={18} /></div>
                        <div className="social-icon" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Twitter/X"><Twitter size={18} /></div>
                    </div>
                </div>
                <div>
                    <h4>Platform</h4>
                    <ul>
                        <li><Link href="/contact">Contact</Link></li>
                    </ul>
                </div>
                <div>
                    <h4>For Sellers</h4>
                    <ul>
                        <li><Link href="/seller/register">Register</Link></li>
                        <li><Link href="/seller/login">Seller Login</Link></li>
                        <li><Link href="/seller/dashboard">Dashboard</Link></li>
                    </ul>
                </div>
                <div>
                    <h4>Support</h4>
                    <ul>
                        <li><Link href="/contact">Help Center</Link></li>
                        <li><a href="mailto:support@safedeliver.co">support@safedeliver.co</a></li>
                        <li><a href="tel:+233000000000">+233 00 000 0000</a></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                © {new Date().getFullYear()} SafeDeliver. Academic Research Project — University of Ghana.
            </div>
        </footer>
    );
}
