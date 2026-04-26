'use client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
    ShieldCheck, MessageCircle, Music, 
    Link as LinkIcon, MapPin, FileText, CheckCircle2, Smartphone, 
    Globe, Bell, BarChart3, Scale, Star 
} from 'lucide-react';

const Instagram = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
);

const Facebook = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

const Twitter = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

export default function HomePage() {
    return (
        <div className="page-wrapper">
            <Navbar />

            {/* ── Hero Section ────────────────────────── */}
            <section className="hero">
                {/* Floating Decorative Social Orbit */}
                <div className="hero-orbit-wrapper">
                    <div className="hero-orb orbit-1"><MessageCircle size={22} /></div>
                    <div className="hero-orb orbit-2"><Instagram size={22} /></div>
                    <div className="hero-orb orbit-3"><Music size={22} /></div>
                    <div className="hero-orb orbit-4"><Facebook size={22} /></div>
                    <div className="hero-orb orbit-5"><Twitter size={22} /></div>
                    <div className="hero-orb orbit-6"><ShieldCheck size={22} /></div>
                </div>

                <div className="hero-centered">
                    <div className="chip animate-in" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={18} color="var(--brand)" /> Secure Escrow Payments
                    </div>

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
                        <div className="hero-social-icon" title="WhatsApp"><MessageCircle size={20} /></div>
                        <div className="hero-social-icon" title="Instagram"><Instagram size={20} /></div>
                        <div className="hero-social-icon" title="Facebook"><Facebook size={20} /></div>
                        <div className="hero-social-icon" title="TikTok"><Music size={20} /></div>
                        <div className="hero-social-icon" title="Twitter/X"><Twitter size={20} /></div>
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
                        <div className="trust-number"> 24hrs</div>
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
                        <div className="step-icon-box blue"><LinkIcon size={24} /></div>
                        <div className="step-num">1</div>
                        <h3>Share Your Link</h3>
                        <p className="text-sm">Create a product and share the link on WhatsApp, Instagram, TikTok, or any social platform.</p>
                    </div>
                    <div className="step-connector"></div>
                    <div className="step-card-h">
                        <div className="step-icon-box green"><MapPin size={24} /></div>
                        <div className="step-num">2</div>
                        <h3>Buyer Requests</h3>
                        <p className="text-sm">Buyer drops a pin for delivery. No payment is required upfront!</p>
                    </div>
                    <div className="step-connector"></div>
                    <div className="step-card-h">
                        <div className="step-icon-box orange"><FileText size={24} /></div>
                        <div className="step-num">3</div>
                        <h3>Quote & Pay</h3>
                        <p className="text-sm">You quote the delivery fee. The buyer securely pays the total to escrow.</p>
                    </div>
                    <div className="step-connector"></div>
                    <div className="step-card-h">
                        <div className="step-icon-box purple"><CheckCircle2 size={24} /></div>
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
                        <div className="feature-icon-circle blue"><ShieldCheck size={28} /></div>
                        <h3>Escrow Protection</h3>
                        <p className="text-sm">Funds are held securely. A flat <strong>5% service fee</strong> is automatically deducted from payouts to keep the platform safe.</p>
                    </div>
                    <div className="feature-card-v">
                        <div className="feature-icon-circle green"><Smartphone size={28} /></div>
                        <h3>Mobile-First Design</h3>
                        <p className="text-sm">Beautiful checkout experience optimized for mobile browsers and social media apps.</p>
                    </div>
                    <div className="feature-card-v">
                        <div className="feature-icon-circle purple"><Globe size={28} /></div>
                        <h3>Multi-Platform Links</h3>
                        <p className="text-sm">One product link works everywhere — WhatsApp, Instagram, TikTok, Twitter, Facebook.</p>
                    </div>
                    <div className="feature-card-v">
                        <div className="feature-icon-circle orange"><Bell size={28} /></div>
                        <h3>Instant Notifications</h3>
                        <p className="text-sm">Get notified immediately when someone pays. Never miss an order.</p>
                    </div>
                    <div className="feature-card-v">
                        <div className="feature-icon-circle blue"><BarChart3 size={28} /></div>
                        <h3>Sales Analytics</h3>
                        <p className="text-sm">Track your orders, revenue, and payouts with a clean seller dashboard.</p>
                    </div>
                    <div className="feature-card-v">
                        <div className="feature-icon-circle green"><Scale size={28} /></div>
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
                        <div className="stars" style={{ display: 'flex', gap: '2px', color: '#fbbf24', marginBottom: '1rem' }}>
                            {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#fbbf24" />)}
                        </div>
                        <div className="quote">"I used to lose customers because they didn't trust sending money first. Now I share a SafeDeliver link and they pay instantly."</div>
                        <div className="testimonial-meta">
                            <div className="testimonial-avatar">AK</div>
                            <div><div className="name">Akua K.</div><div className="role">Fashion Seller, Accra</div></div>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <div className="stars" style={{ display: 'flex', gap: '2px', color: '#fbbf24', marginBottom: '1rem' }}>
                            {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#fbbf24" />)}
                        </div>
                        <div className="quote">"As a buyer, I finally feel safe buying from Instagram sellers. If the item doesn't arrive, I get my money back."</div>
                        <div className="testimonial-meta">
                            <div className="testimonial-avatar">KM</div>
                            <div><div className="name">Kofi M.</div><div className="role">Buyer, Kumasi</div></div>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <div className="stars" style={{ display: 'flex', gap: '2px', color: '#fbbf24', marginBottom: '1rem' }}>
                            {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#fbbf24" />)}
                        </div>
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
