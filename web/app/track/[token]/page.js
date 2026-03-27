'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';

export default function TrackingPage() {
    const { token } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState(null);

    // Dispute state
    const [showDispute, setShowDispute] = useState(false);
    const [disputeForm, setDisputeForm] = useState({ reason: 'Item not received', details: '' });

    // Review state
    const [showReview, setShowReview] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

    const fetchOrder = async () => {
        try {
            const data = await api.get(`/transactions/track/${token}`);
            setOrder(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [token]);

    async function handleAccept() {
        setActionLoading(true);
        setActionMsg(null);
        try {
            await api.patch(`/transactions/${order.order_ref}/accept`, {
                token,
                delivery_type: 'SELLER'
            });
            await fetchOrder(); // refetch to get ACCEPTED state and new totals
        } catch (err) {
            setActionMsg({ type: 'error', msg: err.message });
        } finally {
            setActionLoading(false);
        }
    }

    async function handleCancel() {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        setActionLoading(true);
        try {
            await api.patch(`/transactions/${order.order_ref}/cancel`, { token });
            await fetchOrder();
        } catch (err) {
            setActionMsg({ type: 'error', msg: err.message });
        } finally {
            setActionLoading(false);
        }
    }

    async function handleConfirmPayment() {
        setActionLoading(true);
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        try {
            await api.post('/transactions/sim-confirm', { transaction_id: order.id });
            await fetchOrder(); // refetch to get PAID state
        } catch (err) {
            setActionMsg({ type: 'error', msg: err.message });
        } finally {
            setActionLoading(false);
        }
    }

    async function handleConfirmDelivery() {
        if (!window.confirm('Are you sure you received your item? This will release payment to the seller.')) return;
        setActionLoading(true);
        try {
            await api.patch(`/transactions/${order.order_ref}/confirm-delivery`, { token });
            setActionMsg({ type: 'success', msg: 'Delivery confirmed! Payment released to seller.' });
            await fetchOrder();
        } catch (err) {
            setActionMsg({ type: 'error', msg: err.message });
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDispute(e) {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post(`/transactions/${order.order_ref}/dispute`, { ...disputeForm, token });
            setActionMsg({ type: 'success', msg: 'Dispute submitted. We will review within 24 hours.' });
            setShowDispute(false);
            await fetchOrder();
        } catch (err) {
            setActionMsg({ type: 'error', msg: err.message });
        } finally {
            setActionLoading(false);
        }
    }

    async function handleReview(e) {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post(`/transactions/${order.order_ref}/review`, { ...reviewForm, token });
            setActionMsg({ type: 'success', msg: 'Review submitted successfully! Thank you.' });
            setShowReview(false);
            await fetchOrder();
        } catch (err) {
            setActionMsg({ type: 'error', msg: err.message });
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) return <div className="page-wrapper"><Navbar /><div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div></div>;
    if (error) return (
        <div className="page-wrapper"><Navbar />
            <div className="container-sm text-center" style={{ padding: '4rem 1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h2>Order Not Found</h2>
                <p className="text-sm mt-1">{error}</p>
            </div>
            <Footer /></div>
    );

    const steps = [
        { label: 'Requested', date: order.created_at, done: true },
        { label: 'Quoted', date: order.quoted_at, done: !!order.quoted_at },
        { label: 'Payment Confirmed', date: order.paid_at, done: !!order.paid_at },
        { label: 'Shipped', date: order.shipped_at, done: !!order.shipped_at },
        { label: order.dispute_raised ? 'Dispute Raised' : 'Delivered', date: order.delivered_at, done: !!order.delivered_at || order.dispute_raised },
        { label: 'Payment Released', date: order.released_at, done: !!order.released_at },
    ];

    const canReview = ['DELIVERED', 'RELEASED', 'AUTO_RELEASED'].includes(order.status) && !order.has_reviewed;

    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="section">
                <div className="container-sm">
                    <div className="text-center" style={{ marginBottom: '2rem' }}>
                        <h1>Track Your Order</h1>
                        <p className="text-mono" style={{ fontSize: '1.125rem', marginTop: '0.5rem' }}>{order.order_ref}</p>
                    </div>

                    {actionMsg && (
                        <div className={`alert ${actionMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.5rem' }}>
                            {actionMsg.msg}
                        </div>
                    )}

                    {/* Status Card */}
                    <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <StatusBadge status={order.status} />
                        <h2 style={{ marginTop: '0.75rem' }}>{order.product_name}</h2>

                        {(order.status === 'REQUESTED' || order.status === 'CANCELLED') ? (
                            <div className="text-gold mt-1" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Product: GHS {(order.product_price / 100).toFixed(2)}</div>
                        ) : (
                            <div className="text-gold mt-1" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Total: GHS {(order.total_amount / 100).toFixed(2)}</div>
                        )}

                        {order.status !== 'REQUESTED' && order.status !== 'CANCELLED' && order.delivery_fee > 0 && (
                            <p className="text-sm mt-1">
                                Product: GHS {((order.total_amount - order.delivery_fee) / 100).toFixed(2)} + Delivery: GHS {(order.delivery_fee / 100).toFixed(2)}
                            </p>
                        )}

                        <p className="text-sm mt-2">Hello, {order.buyer_name}!</p>

                        {order.seller_city && order.seller_region && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <p className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Seller Location</p>
                                <p className="text-sm" style={{ fontWeight: 600 }}>{order.seller_city}, {order.seller_region}</p>
                                {order.seller_pickup && (
                                    <p className="text-xs mt-1" style={{ color: 'var(--brand)' }}>Pickup: {order.seller_pickup}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pending Quote view */}
                    {order.status === 'REQUESTED' && (
                        <div className="card text-center" style={{ padding: '3rem 1.5rem', marginBottom: '2rem', border: '2px dashed var(--border)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                            <h3>Waiting for Seller Quote</h3>
                            <p className="text-sm mt-1" style={{ maxWidth: 400, margin: '0.5rem auto 0' }}>
                                The seller has 12 hours to review your delivery address and send a quote.
                                We will notify you via SMS/WhatsApp when it's ready.
                            </p>
                            <button className="btn btn-ghost btn-sm mt-3" onClick={handleCancel} disabled={actionLoading}>Cancel Order</button>
                        </div>
                    )}

                    {/* Quoted view - Accept/Cancel */}
                    {order.can_accept && (
                        <div className="card animate-in" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Delivery Quote Received</h3>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <button className="btn btn-primary btn-lg" onClick={handleAccept} disabled={actionLoading}>
                                    🚚 Accept Quote & Pay (Total: GHS {(order.total_amount / 100).toFixed(2)})
                                </button>
                                <button className="btn btn-ghost btn-lg" onClick={handleCancel} disabled={actionLoading} style={{ color: 'var(--danger)' }}>
                                    ❌ Cancel Order
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Accepted view - SimPay form */}
                    {order.can_pay && (
                        <div className="card animate-in" style={{ marginBottom: '2rem', background: '#0a0b10', color: '#fff' }}>
                            <div className="text-center" style={{ marginBottom: '2rem' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand)', marginBottom: '0.5rem' }}>🛡️ SimPay</div>
                                <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>SafeDeliver Secure Payment</p>
                            </div>

                            <div className="text-center" style={{ marginBottom: '2rem' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>GHS {(order.total_amount / 100).toFixed(2)}</div>
                                <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>Order: {order.order_ref}</p>
                            </div>

                            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                                <input style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '1rem' }} placeholder="Mobile Money Number" defaultValue={order.buyer_phone} />
                                <input style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '1rem' }} placeholder="MoMo PIN" type="password" />
                            </div>

                            <button onClick={handleConfirmPayment} disabled={actionLoading} style={{ width: '100%', padding: '1rem', borderRadius: '8px', background: 'var(--success)', color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                                {actionLoading ? 'Processing...' : 'Confirm Payment'}
                            </button>

                            <p className="text-center mt-3" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                🔒 Simulated Payment — Academic Research Demo
                            </p>
                        </div>
                    )}

                    {/* Timeline (only show after payment or if cancelled) */}
                    {(order.status !== 'REQUESTED' && order.status !== 'QUOTED' && order.status !== 'ACCEPTED') && (
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Order Timeline</h3>

                            {order.status === 'CANCELLED' ? (
                                <div className="alert alert-danger">
                                    This order was cancelled. No payment was taken.
                                </div>
                            ) : (
                                <div className="timeline">
                                    {steps.map((s, i) => (
                                        <div key={i} className={`timeline-item ${s.done ? 'completed' : ''} ${s.done && !steps[i + 1]?.done ? 'active' : ''} ${order.dispute_raised && s.label === 'Dispute Raised' ? 'disputed' : ''}`}>
                                            <div className="timeline-title">{s.label}</div>
                                            {s.date && <div className="timeline-date">{new Date(s.date).toLocaleString()}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Review System (for DELIVERED/RELEASED) */}
                    {canReview && (
                        <div style={{ marginBottom: '2rem' }}>
                            {!showReview ? (
                                <button className="btn btn-primary btn-block" onClick={() => setShowReview(true)}>
                                    ⭐ Rate Your Experience
                                </button>
                            ) : (
                                <div className="card" style={{ border: '2px solid var(--brand)' }}>
                                    <h3 style={{ marginBottom: '1rem', color: 'var(--brand)' }}>Rate the Seller</h3>
                                    <form onSubmit={handleReview}>
                                        <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', fontSize: '2rem', cursor: 'pointer' }}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span 
                                                        key={star} 
                                                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                                        style={{ color: star <= reviewForm.rating ? '#F59E0B' : 'var(--muted)', transition: '0.2s' }}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="text-sm mt-1">{reviewForm.rating} out of 5 stars</div>
                                        </div>
                                        <div className="form-group">
                                            <label>Comments (Optional)</label>
                                            <textarea className="form-input" value={reviewForm.comment}
                                                onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                placeholder="How was the product and delivery...?"
                                                style={{ minHeight: 80 }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading}>
                                                {actionLoading ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                            <button type="button" className="btn btn-ghost" onClick={() => setShowReview(false)}>Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    {order.can_confirm && (
                        <div className="card" style={{ marginBottom: '1rem', background: 'rgba(43,125,233,0.03)' }}>
                            <h3 style={{ marginBottom: '0.75rem' }}>Need to confirm delivery?</h3>
                            <p className="text-sm" style={{ marginBottom: '1rem' }}>
                                Once you confirm, payment will be released to the seller immediately.
                            </p>
                            <button className="btn btn-primary btn-block" onClick={handleConfirmDelivery} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : '✅ I Received My Item'}
                            </button>
                        </div>
                    )}

                    {order.can_dispute && (
                        <div style={{ marginBottom: '2rem' }}>
                            {!showDispute ? (
                                <button className="btn btn-danger btn-block btn-sm" onClick={() => setShowDispute(true)}>
                                    ⚠️ Report a Problem
                                </button>
                            ) : (
                                <div className="card border-danger">
                                    <h3 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Report a Problem</h3>
                                    <form onSubmit={handleDispute}>
                                        <div className="form-group">
                                            <label>Reason *</label>
                                            <select className="form-input" value={disputeForm.reason}
                                                onChange={e => setDisputeForm({ ...disputeForm, reason: e.target.value })}>
                                                <option>Item not received</option>
                                                <option>Wrong item</option>
                                                <option>Item damaged</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Additional Details</label>
                                            <textarea className="form-input" value={disputeForm.details}
                                                onChange={e => setDisputeForm({ ...disputeForm, details: e.target.value })}
                                                style={{ minHeight: 80 }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button type="submit" className="btn btn-danger" disabled={actionLoading}>
                                                {actionLoading ? 'Submitting...' : 'Submit Dispute'}
                                            </button>
                                            <button type="button" className="btn btn-ghost" onClick={() => setShowDispute(false)}>Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {order.dispute_raised && order.status === 'DISPUTED' && (
                        <div className="alert alert-danger">
                            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                            <div>
                                <strong>Dispute under review</strong>
                                <p className="text-sm mt-1">We will review and resolve this within 24 hours.</p>
                                {order.dispute_reason && <p className="text-sm mt-1 text-muted">Reason: {order.dispute_reason}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
