'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { api } from '@/lib/api';

export default function TrackingPage() {
    const { token: urlParam } = useParams(); // This is now either order_ref or buyer_token
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState(null);
    const [buyerToken, setBuyerToken] = useState(null);
    const [paystackEnabled, setPaystackEnabled] = useState(false);

    // Dispute state
    const [confirm, setConfirm] = useState(null);
    const [showDispute, setShowDispute] = useState(false);
    const [disputeForm, setDisputeForm] = useState({ reason: 'Item not received', details: '' });

    // Review state
    const [showReview, setShowReview] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

    const fetchOrder = async (tokenOverride) => {
        const tkn = tokenOverride || buyerToken;
        try {
            let data;
            // Try order_ref-based endpoint first (if it looks like an order ref e.g. SD-...)
            if (urlParam.startsWith('SD-') || urlParam.startsWith('sd-')) {
                const queryStr = tkn ? `?token=${tkn}` : '';
                data = await api.get(`/transactions/track-order/${urlParam}${queryStr}`);
            } else {
                // Legacy: buyer_token-based URL
                data = await api.get(`/transactions/track/${urlParam}`);
                // Save the buyer_token for future use
                if (data.buyer_token) {
                    setBuyerToken(data.buyer_token);
                    saveBuyerSession(data.order_ref, data.buyer_token, data.product_name);
                }
            }
            setOrder(data);

            // If we got the order and have buyer_token in response, persist it
            if (data.buyer_token) {
                setBuyerToken(data.buyer_token);
                saveBuyerSession(data.order_ref, data.buyer_token, data.product_name);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    function saveBuyerSession(orderRef, token, productName) {
        const sessions = JSON.parse(localStorage.getItem('sd-buyer-sessions') || '{}');
        sessions[orderRef] = { buyer_token: token, product_name: productName, last_visited: Date.now() };
        localStorage.setItem('sd-buyer-sessions', JSON.stringify(sessions));
    }

    function getStoredToken(orderRef) {
        // Check both storage keys
        const sessions = JSON.parse(localStorage.getItem('sd-buyer-sessions') || '{}');
        if (sessions[orderRef]) return sessions[orderRef].buyer_token;
        // Also check the single-order key from checkout
        const singleOrder = JSON.parse(localStorage.getItem('sd-buyer-order') || '{}');
        if (singleOrder.order_ref === orderRef) return singleOrder.buyer_token;
        return null;
    }

    useEffect(() => {
        // First try to find buyer_token from localStorage
        const storedToken = getStoredToken(urlParam);
        if (storedToken) setBuyerToken(storedToken);
        fetchOrder(storedToken);

        // Check if real payments are enabled
        api.get('/pay/config').then(res => setPaystackEnabled(res.paystack_enabled)).catch(() => {});
    }, [urlParam]);

    async function handleAccept() {
        const tkn = buyerToken;
        if (!tkn) return setActionMsg({ type: 'error', msg: 'Session expired. Please use the tracking link from your SMS.' });
        setActionLoading(true);
        setActionMsg(null);
        try {
            await api.patch(`/transactions/${order.order_ref}/accept`, { token: tkn, delivery_type: 'SELLER' });
            await fetchOrder(tkn);
        } catch (err) {
            setActionMsg({ type: 'error', msg: err.message });
        } finally { setActionLoading(false); }
    }

    async function handleCancel() {
        const tkn = buyerToken;
        if (!tkn) return setActionMsg({ type: 'error', msg: 'Session expired. Please use the tracking link from your SMS.' });
        setConfirm({
            title: 'Cancel Order?',
            message: 'Are you sure you want to cancel this order? This cannot be undone.',
            variant: 'danger',
            confirmLabel: 'Yes, Cancel Order',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await api.patch(`/transactions/${order.order_ref}/cancel`, { token: tkn });
                    await fetchOrder(tkn);
                } catch (err) {
                    setActionMsg({ type: 'error', msg: err.message });
                } finally { setActionLoading(false); }
            },
        });
    }

    async function handlePayWithPaystack() {
        const tkn = buyerToken;
        if (!tkn) return setActionMsg({ type: 'error', msg: 'Session expired.' });
        setActionLoading(true);
        try {
            const data = await api.post('/pay/initialize', { transaction_id: order.id, buyer_token: tkn });
            window.location.href = data.authorization_url; // Redirect to Paystack checkout
        } catch (err) {
            setActionMsg({ type: 'error', msg: err.message });
            setActionLoading(false); // Only set false on error, success redirects away
        }
    }

    async function handleConfirmPayment() {
        setActionLoading(true);
        await new Promise(resolve => setTimeout(resolve, 3000));
        try {
            await api.post('/transactions/sim-confirm', { transaction_id: order.id });
            await fetchOrder(buyerToken);
        } catch (err) {
            setActionMsg({ type: 'error', msg: err.message });
        } finally { setActionLoading(false); }
    }

    async function handleConfirmDelivery() {
        const tkn = buyerToken;
        if (!tkn) return setActionMsg({ type: 'error', msg: 'Session expired. Please use the tracking link from your SMS.' });
        setConfirm({
            title: 'Confirm Delivery?',
            message: 'Confirm that you have received your item. This will release payment to the seller immediately.',
            variant: 'info',
            confirmLabel: 'Yes, I Got My Item',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await api.patch(`/transactions/${order.order_ref}/confirm-delivery`, { token: tkn });
                    setActionMsg({ type: 'success', msg: 'Delivery confirmed! Payment released to seller.' });
                    await fetchOrder(tkn);
                } catch (err) {
                    setActionMsg({ type: 'error', msg: err.message });
                } finally { setActionLoading(false); }
            },
        });
    }

    async function handleDispute(e) {
        e.preventDefault();
        const tkn = buyerToken;
        if (!tkn) return setActionMsg({ type: 'error', msg: 'Session expired.' });
        setActionLoading(true);
        try {
            await api.post(`/transactions/${order.order_ref}/dispute`, { ...disputeForm, token: tkn });
            setActionMsg({ type: 'success', msg: 'Dispute submitted. We will review within 24 hours.' });
            setShowDispute(false);
            await fetchOrder(tkn);
        } catch (err) {
            setActionMsg({ type: 'error', msg: err.message });
        } finally { setActionLoading(false); }
    }

    async function handleReview(e) {
        e.preventDefault();
        const tkn = buyerToken;
        if (!tkn) return setActionMsg({ type: 'error', msg: 'Session expired.' });
        setActionLoading(true);
        try {
            await api.post(`/transactions/${order.order_ref}/review`, { ...reviewForm, token: tkn });
            setActionMsg({ type: 'success', msg: 'Review submitted successfully! Thank you.' });
            setShowReview(false);
            await fetchOrder(tkn);
        } catch (err) {
            setActionMsg({ type: 'error', msg: err.message });
        } finally { setActionLoading(false); }
    }

    if (loading) return <div className="page-wrapper"><Navbar /><div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div></div>;
    if (error) return (
        <div className="page-wrapper"><Navbar />
            <div className="container-sm text-center" style={{ padding: '4rem 1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h2>Order Not Found</h2>
                <p className="text-sm mt-1">{error}</p>
                <div className="card" style={{ marginTop: '2rem', textAlign: 'left', maxWidth: 400, margin: '2rem auto' }}>
                    <h4 style={{ marginBottom: '0.75rem' }}>Have an order?</h4>
                    <p className="text-sm">Check your SMS or WhatsApp for a tracking link from SafeDeliver.</p>
                </div>
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
        <>
        {confirm && <ConfirmDialog {...confirm} onClose={() => setConfirm(null)} />}
        <div className="page-wrapper">
            <Navbar />
            <div className="section">
                <div className="container-sm">
                    <div className="text-center" style={{ marginBottom: '2rem' }}>
                        <h1>Track Your Order</h1>
                        <p className="text-mono" style={{ fontSize: '1.125rem', marginTop: '0.5rem' }}>{order.order_ref}</p>
                        {/* Bookmark hint */}
                        <p className="text-xs" style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                            Bookmark this page to come back anytime
                        </p>
                    </div>

                    {/* Session warning */}
                    {!order.is_authed && (
                        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
                            Read-only view. To take actions (accept, pay, confirm), use the tracking link from your SMS/WhatsApp.
                        </div>
                    )}

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
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-alt)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <p className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Seller Location</p>
                                <p className="text-sm" style={{ fontWeight: 600 }}>{order.seller_city}, {order.seller_region}</p>
                                {order.seller_pickup && (
                                    <p className="text-xs mt-1" style={{ color: 'var(--brand)' }}>Pickup: {order.seller_pickup}</p>
                                )}
                            </div>
                        )}

                        {order.seller_score != null && (
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-alt)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Seller Trust Score</p>
                                    <p className="text-sm" style={{ fontWeight: 700 }}>{order.seller_name}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontSize: '1.25rem', fontWeight: 800,
                                        color: order.seller_score >= 80 ? 'var(--success)' : order.seller_score >= 50 ? 'var(--warning)' : 'var(--danger)'
                                    }}>
                                        {(order.seller_score / 10).toFixed(1)}/10
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {order.seller_score >= 80 ? 'Trusted' : order.seller_score >= 50 ? 'Average' : 'Low'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pending Quote */}
                    {order.status === 'REQUESTED' && (
                        <div className="card text-center" style={{ padding: '3rem 1.5rem', marginBottom: '2rem', border: '2px dashed var(--border)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                            <h3>Waiting for Seller Quote</h3>
                            <p className="text-sm mt-1" style={{ maxWidth: 400, margin: '0.5rem auto 0' }}>
                                The seller has 12 hours to review your delivery address and send a quote.
                                We will notify you via SMS/WhatsApp when it's ready.
                            </p>
                            {order.can_cancel && <button className="btn btn-ghost btn-sm mt-3" onClick={handleCancel} disabled={actionLoading}>Cancel Order</button>}
                        </div>
                    )}

                    {/* Accept Quote */}
                    {order.can_accept && (
                        <div className="card animate-in" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Delivery Quote Received</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <button className="btn btn-primary btn-lg" onClick={handleAccept} disabled={actionLoading}>
                                    Accept Quote & Pay (Total: GHS {(order.total_amount / 100).toFixed(2)})
                                </button>
                                <button className="btn btn-ghost btn-lg" onClick={handleCancel} disabled={actionLoading} style={{ color: 'var(--danger)' }}>
                                    Cancel Order
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Payment UI */}
                    {order.can_pay && (
                        paystackEnabled ? (
                            <div className="card animate-in text-center" style={{ marginBottom: '2rem', padding: '3rem 1.5rem', background: '#0a0b10', color: '#fff', border: '1px solid #11b981' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#11b981', marginBottom: '0.5rem' }}>Secure Payment</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem' }}>GHS {(order.total_amount / 100).toFixed(2)}</div>
                                <button onClick={handlePayWithPaystack} disabled={actionLoading} style={{ width: '100%', maxWidth: 350, margin: '0 auto', padding: '1rem', borderRadius: '8px', background: '#11b981', color: '#fff', border: 'none', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    💳 Pay Now
                                </button>
                                <p className="text-center mt-3" style={{ fontSize: '0.75rem', opacity: 0.5 }}>Payments securely processed by Paystack.</p>
                            </div>
                        ) : (
                            <div className="card animate-in" style={{ marginBottom: '2rem', background: '#0a0b10', color: '#fff' }}>
                                <div className="text-center" style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand)', marginBottom: '0.5rem' }}>Demo Payment</div>
                                    <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>SafeDeliver Research Prototype</p>
                                </div>
                                <div className="text-center" style={{ marginBottom: '2rem' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>GHS {(order.total_amount / 100).toFixed(2)}</div>
                                    <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>Order: {order.order_ref}</p>
                                </div>
                                <button onClick={handleConfirmPayment} disabled={actionLoading} style={{ width: '100%', padding: '1rem', borderRadius: '8px', background: 'var(--success)', color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                                    {actionLoading ? 'Processing...' : '✅ Simulate Payment'}
                                </button>
                                <p className="text-center mt-3" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                    This is a simulated payment for demonstration purposes.
                                </p>
                            </div>
                        )
                    )}

                    {/* Timeline */}
                    {(order.status !== 'REQUESTED' && order.status !== 'QUOTED' && order.status !== 'ACCEPTED') && (
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Order Timeline</h3>
                            {order.status === 'CANCELLED' ? (
                                <div className="alert alert-danger">This order was cancelled. No payment was taken.</div>
                            ) : (
                                <div className="timeline">
                                    {steps.map((s, i) => (
                                        <div key={i} className={`timeline-item ${s.done ? 'completed' : ''} ${s.done && !steps[i + 1]?.done ? 'active' : ''}`}>
                                            <div className="timeline-title">{s.label}</div>
                                            {s.date && <div className="timeline-date">{new Date(s.date).toLocaleString()}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Review */}
                    {canReview && order.is_authed && (
                        <div style={{ marginBottom: '2rem' }}>
                            {!showReview ? (
                                <button className="btn btn-primary btn-block" onClick={() => setShowReview(true)}>
                                    Rate Your Experience
                                </button>
                            ) : (
                                <div className="card" style={{ border: '2px solid var(--brand)' }}>
                                    <h3 style={{ marginBottom: '1rem', color: 'var(--brand)' }}>Rate the Seller</h3>
                                    <form onSubmit={handleReview}>
                                        <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', fontSize: '2rem', cursor: 'pointer' }}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                                        style={{ color: star <= reviewForm.rating ? '#F59E0B' : 'var(--text-muted)', transition: '0.2s' }}>★</span>
                                                ))}
                                            </div>
                                            <div className="text-sm mt-1">{reviewForm.rating} out of 5 stars</div>
                                        </div>
                                        <div className="form-group">
                                            <label>Comments (Optional)</label>
                                            <textarea className="form-input" value={reviewForm.comment}
                                                onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                placeholder="How was the product and delivery...?" style={{ minHeight: 80 }} />
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

                    {/* Confirm Delivery */}
                    {order.can_confirm && (
                        <div className="card" style={{ marginBottom: '1rem', background: 'rgba(43,125,233,0.03)' }}>
                            <h3 style={{ marginBottom: '0.75rem' }}>Need to confirm delivery?</h3>
                            <p className="text-sm" style={{ marginBottom: '1rem' }}>
                                Once you confirm, payment will be released to the seller immediately.
                            </p>
                            <button className="btn btn-primary btn-block" onClick={handleConfirmDelivery} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : 'I Received My Item'}
                            </button>
                        </div>
                    )}

                    {/* Dispute */}
                    {order.can_dispute && (
                        <div style={{ marginBottom: '2rem' }}>
                            {!showDispute ? (
                                <button className="btn btn-ghost btn-block btn-sm" onClick={() => setShowDispute(true)} style={{ color: 'var(--danger)' }}>
                                    Report a Problem
                                </button>
                            ) : (
                                <div className="card" style={{ border: '1px solid var(--danger)' }}>
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
                                            <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger)', flex: 1 }} disabled={actionLoading}>
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
                        <div className="alert alert-danger" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '1.25rem' }}>⚠</span>
                            <div>
                                <strong>Dispute under review</strong>
                                <p className="text-sm mt-1">We will review and resolve this within 24 hours.</p>
                                {order.dispute_reason && <p className="text-sm mt-1" style={{ opacity: 0.8 }}>Reason: {order.dispute_reason}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
        </>
    );
}
