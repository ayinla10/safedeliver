'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LocationPicker from '@/components/LocationPicker';
import { api } from '@/lib/api';

export default function CheckoutPage() {
    const { linkCode } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [step, setStep] = useState('details'); // details | success
    const [form, setForm] = useState({ buyer_name: '', buyer_phone: '', buyer_email: '', buyer_address: '', buyer_lat: null, buyer_lng: null, buyer_location_text: '' });
    const [txData, setTxData] = useState(null);

    useEffect(() => {
        api.get(`/checkout-links/${linkCode}`)
            .then(data => { setProduct(data); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
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
            <div className="page-wrapper">
                <Navbar />
                <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>
            </div>
        );
    }

    if (error && !product) {
        return (
            <div className="page-wrapper">
                <Navbar />
                <div className="container-sm" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
                    <h2>Checkout link not found</h2>
                    <p className="text-sm mt-1">{error}</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="section">
                <div className="container-sm">
                    {step === 'details' && product && (
                        <div className="animate-in">
                            {/* Product Info */}
                            <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                                {product.image_url && (
                                    <img src={product.image_url} alt={product.product_name}
                                        style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} />
                                )}
                                <h2>{product.product_name}</h2>
                                {product.description && <p className="text-sm mt-1">{product.description}</p>}
                                <div className="text-gold mt-2" style={{ fontSize: '1.5rem', fontWeight: 800 }}>GHS {(product.price / 100).toFixed(2)}</div>

                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                                    <p className="text-sm">Sold by: <strong>{product.seller_name}</strong></p>
                                    {(product.seller_city || product.seller_region) && (
                                        <p className="text-xs text-muted">📍 Location: {product.seller_city ? product.seller_city + ', ' : ''}{product.seller_region}</p>
                                    )}
                                </div>

                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(43,125,233,0.05)', borderRadius: '8px', border: '1px solid rgba(43,125,233,0.1)' }}>
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
                                        <LocationPicker onChange={handleLocationChange} />
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
            <Footer />
        </div>
    );
}
