'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import LocationPicker from '@/components/LocationPicker';
import { api } from '@/lib/api';

export default function CheckoutPage() {
    const { linkCode } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [step, setStep] = useState('choice'); // choice | details | success
    const [form, setForm] = useState({ buyer_name: '', buyer_phone: '', buyer_email: '', buyer_address: '', buyer_lat: null, buyer_lng: null, buyer_location_text: '' });
    const [txData, setTxData] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);

    useEffect(() => {
        // Absolute theme enforcement for high-trust checkout
        const originalTheme = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', 'light');
        
        api.get(`/checkout-links/${linkCode}`)
            .then(data => { 
                setProduct(data); 
                setLoading(false); 
                
                // If not on mobile, skip choice
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (!isMobile) {
                    setStep('details');
                }
            })
            .catch(err => { setError(err.message); setLoading(false); });

        return () => {
            if (originalTheme) {
                document.documentElement.setAttribute('data-theme', originalTheme);
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        };
    }, [linkCode]);

    async function handleSubmitDetails(e) {
        e.preventDefault();

        // Ensure a location is selected or typed
        if (!form.buyer_address && !form.buyer_location_text) {
            setError('Please provide a delivery address or location');
            return;
        }

        setLoading(true);
        try {
            const data = await api.post('/transactions', {
                ...form,
                checkout_link_id: product.id || linkCode,
            });
            setTxData(data);
            // Persist buyer session for refresh survival
            localStorage.setItem('sd-buyer-order', JSON.stringify({
                order_ref: data.order_ref,
                buyer_token: data.buyer_token,
                product_name: product.product_name,
                timestamp: Date.now(),
            }));
            setStep('success');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleLocationChange(loc) {
        setForm(prev => ({
            ...prev,
            buyer_lat: loc.lat,
            buyer_lng: loc.lng,
            buyer_location_text: loc.text,
            buyer_address: loc.text // Keep buyer_address synced for fallback
        }));
    }

    if (loading && !product) {
        return (
            <div className="page-wrapper light-mode-enforced">
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>🛡️ Safe<span style={{ color: 'var(--brand)' }}>Deliver</span></span>
                </div>
                <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>
            </div>
        );
    }

    if (error && !product) {
        return (
            <div className="page-wrapper light-mode-enforced">
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>🛡️ Safe<span style={{ color: 'var(--brand)' }}>Deliver</span></span>
                </div>
                <div className="container-sm" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
                    <h2 style={{ color: 'var(--text)' }}>Checkout link not found</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper light-mode-enforced">
            <div style={{ 
                padding: '1rem 1.5rem', 
                borderBottom: '1px solid var(--border)', 
                textAlign: 'center', 
                background: 'var(--card-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>🛡️ Safe<span style={{ color: 'var(--brand)' }}>Deliver</span> <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: 8 }}>Secure Checkout</span></span>
            </div>
            <div className="section">
                <div className="container-sm">
                    {step === 'choice' && product && (
                        <div className="animate-in text-center" style={{ padding: '2rem 1rem' }}>
                            <div className="card" style={{ maxWidth: 450, margin: '0 auto' }}>
                                <div style={{ 
                                    width: 80, height: 80, borderRadius: 40, 
                                    backgroundColor: 'var(--bg-alt)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1.5rem auto',
                                    border: '1px solid var(--border)'
                                }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                        <path d="m9 12 2 2 4-4"/>
                                    </svg>
                                </div>
                                
                                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Secure Checkout</h1>
                                <p className="text-muted" style={{ marginBottom: '2rem' }}>
                                    Get the best experience and real-time tracking with the SafeDeliver App.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <a 
                                        href={`safedeliver://pay/${linkCode}`} 
                                        className="btn btn-primary btn-lg" 
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                                    >
                                        <span>Open in SafeDeliver App</span>
                                    </a>

                                    <button 
                                        onClick={() => setStep('details')}
                                        className="btn btn-secondary btn-lg"
                                        style={{ width: '100%' }}
                                    >
                                        Continue as Guest in Browser
                                    </button>
                                </div>

                                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                    <p className="text-xs text-muted">🛡️ Your money is held in escrow until delivery is confirmed.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'details' && product && (
                        <div className="animate-in">
                            {/* Product Info */}
                            <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: 0, overflow: 'hidden' }}>
                                {/* Image Carousel */}
                                <div style={{ position: 'relative', height: 300, background: 'var(--bg-alt)' }}>
                                    <div 
                                        ref={scrollRef}
                                        style={{
                                            display: 'flex',
                                            overflowX: 'auto',
                                            scrollSnapType: 'x mandatory',
                                            height: '100%',
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none'
                                        }}
                                        className="no-scrollbar"
                                        onScroll={(e) => {
                                            const index = Math.round(e.target.scrollLeft / e.target.offsetWidth);
                                            setActiveIndex(index);
                                        }}
                                    >
                                        {(product.images && product.images.length > 0 ? product.images : [product.image_url]).map((img, i) => (
                                            <img 
                                                key={i} 
                                                src={img} 
                                                alt={`${product.product_name} ${i}`}
                                                style={{ minWidth: '100%', height: '100%', objectFit: 'cover', scrollSnapAlign: 'start' }} 
                                            />
                                        ))}
                                    </div>

                                    {/* Desktop Arrows */}
                                    { (product.images?.length > 1 || (!product.images && product.image_url)) && (product.images?.length > 1) && (
                                        <>
                                            {activeIndex > 0 && (
                                                <button 
                                                    onClick={() => {
                                                        const el = scrollRef.current;
                                                        el.scrollTo({ left: el.scrollLeft - el.offsetWidth, behavior: 'smooth' });
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        left: 10,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: '50%',
                                                        background: 'rgba(255,255,255,0.7)',
                                                        backdropFilter: 'blur(8px)',
                                                        border: '1px solid rgba(0,0,0,0.05)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 18,
                                                        fontWeight: 'bold',
                                                        zIndex: 2
                                                    }}
                                                >
                                                    ‹
                                                </button>
                                            )}
                                            {activeIndex < (product.images?.length - 1) && (
                                                <button 
                                                    onClick={() => {
                                                        const el = scrollRef.current;
                                                        el.scrollTo({ left: el.scrollLeft + el.offsetWidth, behavior: 'smooth' });
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        right: 10,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: '50%',
                                                        background: 'rgba(255,255,255,0.7)',
                                                        backdropFilter: 'blur(8px)',
                                                        border: '1px solid rgba(0,0,0,0.05)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 18,
                                                        fontWeight: 'bold',
                                                        zIndex: 2
                                                    }}
                                                >
                                                    ›
                                                </button>
                                            )}
                                        </>
                                    )}
                                    
                                    {/* Carousel Dots */}
                                    {(product.images?.length > 1 || (!product.images && product.image_url)) && (product.images?.length > 1) && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 12,
                                            left: 0,
                                            right: 0,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: 6
                                        }}>
                                            {product.images.map((_, i) => (
                                                <div key={i} style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: '50%',
                                                    background: 'white',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                                    opacity: i === activeIndex ? 1 : 0.4,
                                                    transform: i === activeIndex ? 'scale(1.2)' : 'scale(1)',
                                                    transition: 'all 0.2s'
                                                }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ padding: '1.5rem' }}>
                                    <h2 style={{ color: 'var(--text)' }}>{product.product_name}</h2>
                                    {product.description && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>}
                                    <div className="mt-2" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--brand)' }}>GHS {(product.price / 100).toFixed(2)}</div>
                                </div>

                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                                    <p className="text-sm">Sold by: <strong>{product.seller_name}</strong></p>
                                    {(product.seller_city || product.seller_region) && (
                                        <p className="text-xs text-muted">📍 Location: {product.seller_city ? product.seller_city + ', ' : ''}{product.seller_region}</p>
                                    )}
                                </div>

                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-alt)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <p className="text-xs" style={{ color: 'var(--brand)', fontWeight: 600 }}>ℹ️ Delivery fee will be quoted by the seller.</p>
                                    <p className="text-xs text-muted mt-1">A 5% service fee (Max 50 GHS) applies to protect this transaction.</p>
                                </div>
                            </div>

                            {/* Buyer Form */}
                            <div className="card">
                                <h3 style={{ marginBottom: '1rem' }}>Request Order</h3>
                                {error && <div className="alert alert-danger">{error}</div>}
                                <form onSubmit={handleSubmitDetails}>
                                    <div className="form-group">
                                        <label>Full Name *</label>
                                        <input className="form-input" required value={form.buyer_name}
                                            onChange={e => setForm({ ...form, buyer_name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number *</label>
                                        <input className="form-input" required placeholder="+233..." value={form.buyer_phone}
                                            onChange={e => setForm({ ...form, buyer_phone: e.target.value })} />
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            📱 We'll send order updates to this number via SMS. Make sure it's correct.
                                        </p>
                                    </div>
                                    <div className="form-group">
                                        <label>Email <span className="text-muted">(Optional)</span></label>
                                        <input className="form-input" type="email" value={form.buyer_email}
                                            onChange={e => setForm({ ...form, buyer_email: e.target.value })} />
                                    </div>

                                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Delivery Address / Pickup Point *</span>
                                        </label>
                                        <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>Help the seller quote an accurate delivery fee by providing your exact location.</p>
                                        <LocationPicker
                                            onChange={handleLocationChange}
                                            sellerLat={product.seller_lat}
                                            sellerLng={product.seller_lng}
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '2rem' }} disabled={loading}>
                                        {loading ? 'Processing...' : `Request Order`}
                                    </button>
                                </form>
                                <p className="text-sm text-center mt-3 text-muted">
                                    No money will be charged yet. You only pay after accepting the seller's delivery quote.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && txData && (
                        <div className="animate-in text-center" style={{ padding: '4rem 0' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                            <h2 style={{ color: 'var(--success)' }}>Order Requested!</h2>
                            <p style={{ marginTop: '0.5rem', fontSize: '1.125rem' }}>
                                Order <span className="text-mono" style={{ fontSize: '1rem' }}>{txData.order_ref}</span> placed successfully.
                            </p>
                            <div className="card" style={{ margin: '2rem auto', maxWidth: 450, textAlign: 'left' }}>
                                <h4 style={{ marginBottom: '1rem' }}>What happens next?</h4>
                                <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: 0 }}>
                                    <li>The seller has been notified of your request and location.</li>
                                    <li>They have <strong>12 hours</strong> to review and send you a delivery quote.</li>
                                    <li>You will receive an SMS/WhatsApp message when the quote is ready.</li>
                                    <li>You can then review the total and Accept & Pay, or Cancel.</li>
                                </ol>
                            </div>
                            <p className="text-sm">
                                Track your order here:<br />
                                <a href={`/track/${txData.order_ref}`} className="text-brand" style={{ fontWeight: 600, display: 'inline-block', marginTop: '0.5rem' }}>
                                    View Tracking Page →
                                </a>
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Protected by SafeDeliver Escrow · <a href="/" style={{ color: 'var(--brand)' }}>safedeliver.com</a>
            </div>
        </div>
    );
}
