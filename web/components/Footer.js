'use client';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div>
                    <div className="footer-brand">🛡️ SafeDeliver</div>
                    <p className="text-sm" style={{ maxWidth: 280, lineHeight: 1.7 }}>
                        Protecting every social commerce transaction in Ghana. Buy and sell with confidence.
                    </p>
                    <div className="social-icons" style={{ marginTop: '1rem' }}>
                        <div className="social-icon" style={{ width: 36, height: 36, fontSize: '1rem' }}>💬</div>
                        <div className="social-icon" style={{ width: 36, height: 36, fontSize: '1rem' }}>📸</div>
                        <div className="social-icon" style={{ width: 36, height: 36, fontSize: '1rem' }}>📘</div>
                        <div className="social-icon" style={{ width: 36, height: 36, fontSize: '1rem' }}>🐦</div>
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
