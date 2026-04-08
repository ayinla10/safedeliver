'use client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HomePage() {
    return (
        <div className="page-wrapper">
            <Navbar />

            {/* ── Hero Section ────────────────────────── */}
            <section className="hero">
                {/* Floating Decorative Social Orbit */}
                <div className="hero-orbit-wrapper">
                    <div className="hero-orb orbit-1"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-4.821 4.991h-.01c-1.305 0-2.585-.352-3.695-1.015L6.3 19l.635-2.31c-.73-1.185-1.113-2.541-1.113-3.933 0-4.07 3.31-7.381 7.383-7.381 1.972 0 3.824.767 5.215 2.158 1.391 1.39 2.157 3.242 2.157 5.216 0 4.073-3.311 7.382-7.384 7.382z"/></svg></div>
                    <div className="hero-orb orbit-2"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.56.216.96.474 1.38.894.42.42.678.82.894 1.38.163.422.358 1.057.412 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.249 1.805-.412 2.227-.216.56-.474.96-.894 1.38-.42.42-.82.678-1.38.894-.422.163-1.057.358-2.227.412-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.805-.249-2.227-.412-.56-.216-.96-.474-1.38-.894-.42-.42-.678-.82-.894-1.38-.163-.422-.358-1.057-.412-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.054-1.17.249-1.805.412-2.227.216-.56.474-.96.894-1.38.42-.42.82-.678 1.38-.894.422-.163 1.057-.358 2.227-.412 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.277.057-2.149.259-2.912.556-.788.306-1.457.715-2.123 1.381-.666.666-1.075 1.335-1.381 2.123-.297.763-.499 1.635-.556 2.912-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.057 1.277.259 2.149.556 2.912.306.788.715 1.457 1.381 2.123.666.666 1.335 1.075 2.123 1.381.763.297 1.635.499 2.912.556 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.277-.057 2.149-.259 2.912-.556.788-.306 1.457-.715 2.123-1.381.666-.666 1.075-1.335 1.381-2.123.297-.763.499-1.635.556-2.912.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.057-1.277-.259-2.149-.556-2.912-.306-.788-.715-1.457-1.381-2.123-.666-.666-1.335-1.075-2.123-1.381-.763-.297-1.635-.499-2.912-.556-1.28-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></div>
                    <div className="hero-orb orbit-3"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.36-.54.38-.89.96-1.03 1.6-.14.69-.02 1.4.33 2.02.51.98 1.56 1.6 2.67 1.61 1.22.01 2.39-.42 3.12-1.43.37-.48.55-1.07.61-1.67.09-3.48.05-6.95.05-10.43z"/></svg></div>
                    <div className="hero-orb orbit-4"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg></div>
                    <div className="hero-orb orbit-5"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12.014 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.492 8.718l-1.89 8.91c-.143.64-.52.795-1.056.495l-2.878-2.122-1.388 1.336c-.153.153-.284.284-.582.284l.206-2.924 5.322-4.81c.23-.205-.05-.32-.32-.14l-6.58 4.14-2.835-.886c-.615-.192-.628-.615.128-.91l11.084-4.272c.513-.19.96.115.89.91z"/></svg></div>
                    <div className="hero-orb orbit-6"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z"/></svg></div>
                </div>

                <div className="hero-centered">
                    <div className="chip animate-in">🛡️ Secure Escrow Payments</div>

                    <h1 className="hero-heading animate-in">
                        Sell Anywhere.<br />
                        <span className="highlight">Get Paid Securely.</span>
                    </h1>

                    <p className="hero-subtitle animate-in">
                        Share your product link on WhatsApp, Instagram, or TikTok.<br />
                        Buyers pay securely, you ship, they confirm — and you get paid.
                    </p>

                    <div className="hero-ctas animate-in">
                        <Link href="/seller/register" className="btn btn-primary btn-lg">Start Selling →</Link>
                    </div>

                    <div className="hero-trust-row animate-in">
                        <div className="hero-trust-badge"><span className="trust-dot green"></span> No setup fees</div>
                        <div className="hero-trust-badge"><span className="trust-dot blue"></span> Funds protected until delivery</div>
                        <div className="hero-trust-badge"><span className="trust-dot orange"></span> Mobile Money & Cards</div>
                    </div>

                    {/* Social platform icons */}
                    <div className="hero-social-row animate-in">
                        <div className="hero-social-icon" title="WhatsApp">💬</div>
                        <div className="hero-social-icon" title="Instagram">📸</div>
                        <div className="hero-social-icon" title="Facebook">📘</div>
                        <div className="hero-social-icon" title="TikTok">🎵</div>
                        <div className="hero-social-icon" title="Twitter/X">🐦</div>
                    </div>
                </div>
            </section>

            {/* ── Trust Numbers ────────────────────────── */}
            <section className="trust-strip">
                <div className="trust-inner">
                    <div className="trust-item">
                        <div className="trust-number">500+</div>
                        <div className="trust-label">Transactions Protected</div>
                    </div>
                    <div className="trust-item">
                        <div className="trust-number">120+</div>
                        <div className="trust-label">Active Sellers</div>
                    </div>
                    <div className="trust-item">
                        <div className="trust-number">&lt; 24hrs</div>
                        <div className="trust-label">Average Release Time</div>
                    </div>
                    <div className="trust-item">
                        <div className="trust-number">99.8%</div>
                        <div className="trust-label">Success Rate</div>
                    </div>
                </div>
            </section>

            {/* ── How SafeDeliver Works (4 Steps) ──────── */}
            <section className="section" id="how-it-works">
                <div className="section-header">
                    <h2>How SafeDeliver Works</h2>
                    <p>A simple 4-step process to sell securely on social media</p>
                </div>
                <div className="steps-row">
                    <div className="step-card-h">
                        <div className="step-icon-box blue"><span>🔗</span></div>
                        <div className="step-num">1</div>
                        <h3>Share Your Link</h3>
                        <p className="text-sm">Create a product and share the link on WhatsApp, Instagram, TikTok, or any social platform.</p>
                    </div>
                    <div className="step-connector"></div>
                    <div className="step-card-h">
                        <div className="step-icon-box green"><span>📍</span></div>
                        <div className="step-num">2</div>
                        <h3>Buyer Requests</h3>
                        <p className="text-sm">Buyer drops a pin for delivery. No payment is required upfront!</p>
                    </div>
                    <div className="step-connector"></div>
                    <div className="step-card-h">
                        <div className="step-icon-box orange"><span>📝</span></div>
                        <div className="step-num">3</div>
                        <h3>Quote & Pay</h3>
                        <p className="text-sm">You quote the delivery fee. The buyer securely pays the total to escrow.</p>
                    </div>
                    <div className="step-connector"></div>
                    <div className="step-card-h">
                        <div className="step-icon-box purple"><span>✅</span></div>
                        <div className="step-num">4</div>
                        <h3>Ship & Get Paid</h3>
                        <p className="text-sm">Ship the item. Once the buyer confirms, funds are released instantly.</p>
                    </div>
                </div>
            </section>

            {/* ── Built for Social Commerce ────────────── */}
            <section className="section" id="features" style={{ background: 'var(--bg-alt)' }}>
                <div className="section-header">
                    <h2>Built for Social Commerce</h2>
                    <p>Everything you need to sell safely on social media</p>
                </div>
                <div className="feature-grid-2x3">
                    <div className="feature-card-v">
                        <div className="feature-icon-circle blue">🛡️</div>
                        <h3>Escrow Protection</h3>
                        <p className="text-sm">Funds are held securely. A flat <strong>5% service fee</strong> is automatically deducted from payouts to keep the platform safe.</p>
                    </div>
                    <div className="feature-card-v">
                        <div className="feature-icon-circle green">📱</div>
                        <h3>Mobile-First Design</h3>
                        <p className="text-sm">Beautiful checkout experience optimized for mobile browsers and social media apps.</p>
                    </div>
                    <div className="feature-card-v">
                        <div className="feature-icon-circle purple">🌐</div>
                        <h3>Multi-Platform Links</h3>
                        <p className="text-sm">One product link works everywhere — WhatsApp, Instagram, TikTok, Twitter, Facebook.</p>
                    </div>
                    <div className="feature-card-v">
                        <div className="feature-icon-circle orange">🔔</div>
                        <h3>Instant Notifications</h3>
                        <p className="text-sm">Get notified immediately when someone pays. Never miss an order.</p>
                    </div>
                    <div className="feature-card-v">
                        <div className="feature-icon-circle blue">📊</div>
                        <h3>Sales Analytics</h3>
                        <p className="text-sm">Track your orders, revenue, and payouts with a clean seller dashboard.</p>
                    </div>
                    <div className="feature-card-v">
                        <div className="feature-icon-circle green">⚖️</div>
                        <h3>Dispute Resolution</h3>
                        <p className="text-sm">Built-in dispute system protects both buyers and sellers with fair resolution.</p>
                    </div>
                </div>
            </section>

            {/* ── Testimonials ─────────────────────────── */}
            <section className="section">
                <div className="section-header">
                    <h2>Trusted by Sellers Across Ghana</h2>
                </div>
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <div className="stars">⭐⭐⭐⭐⭐</div>
                        <div className="quote">"I used to lose customers because they didn't trust sending money first. Now I share a SafeDeliver link and they pay instantly."</div>
                        <div className="testimonial-meta">
                            <div className="testimonial-avatar">AK</div>
                            <div><div className="name">Akua K.</div><div className="role">Fashion Seller, Accra</div></div>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <div className="stars">⭐⭐⭐⭐⭐</div>
                        <div className="quote">"As a buyer, I finally feel safe buying from Instagram sellers. If the item doesn't arrive, I get my money back."</div>
                        <div className="testimonial-meta">
                            <div className="testimonial-avatar">KM</div>
                            <div><div className="name">Kofi M.</div><div className="role">Buyer, Kumasi</div></div>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <div className="stars">⭐⭐⭐⭐⭐</div>
                        <div className="quote">"My shop's revenue went up 40% after I started using SafeDeliver. The checkout links are so easy to share."</div>
                        <div className="testimonial-meta">
                            <div className="testimonial-avatar">EA</div>
                            <div><div className="name">Esi A.</div><div className="role">Electronics, Takoradi</div></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────── */}
            <section className="section">
                <div className="cta-section">
                    <h2>Ready to Sell with Confidence?</h2>
                    <p>Join hundreds of sellers who trust SafeDeliver to protect every transaction.</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/seller/register" className="btn btn-lg">Start Selling Free</Link>
                        <Link href="/contact" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}>Contact Us</Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
