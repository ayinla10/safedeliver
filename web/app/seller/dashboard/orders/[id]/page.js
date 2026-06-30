'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Package, Bike, Car, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';

function formatDuration(seconds) {
    const m = Math.round(seconds / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

function formatDistance(metres) {
    return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`;
}

async function fetchRoute(profile, slat, slng, blat, blng) {
    const url = `https://router.project-osrm.org/route/v1/${profile}/${slng},${slat};${blng},${blat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok') return null;
    return { duration: data.routes[0].duration, distance: data.routes[0].distance };
}

export default function OrderDetailPage() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [deliveryFee, setDeliveryFee] = useState('');
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const fetchOrder = async () => {
        try {
            const data = await api.get(`/transactions/${id}`);
            setOrder(data);
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    useEffect(() => {
        if (!order?.buyer_lat || !order?.buyer_lng || !order?.seller_lat || !order?.seller_lng) return;
        setRouteLoading(true);
        Promise.all([
            fetchRoute('driving', order.seller_lat, order.seller_lng, order.buyer_lat, order.buyer_lng),
            fetchRoute('bike', order.seller_lat, order.seller_lng, order.buyer_lat, order.buyer_lng),
        ]).then(([car, bike]) => {
            setRouteInfo({ car, bike });
        }).catch(() => {}).finally(() => setRouteLoading(false));
    }, [order?.id]);

    async function handleQuote(e) {
        e.preventDefault();
        setActionLoading(true);
        setMsg(null);
        try {
            await api.patch(`/transactions/${id}/quote`, { delivery_fee: deliveryFee });
            setMsg({ type: 'success', text: 'Quote sent to buyer! They will notify you once accepted.' });
            await fetchOrder();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setActionLoading(false);
        }
    }

    async function handleShip() {
        setConfirm({
            title: 'Mark as Shipped?',
            message: 'This will notify the buyer that their order is on the way.',
            variant: 'info',
            confirmLabel: 'Yes, Mark Shipped',
            onConfirm: async () => {
                setActionLoading(true);
                setMsg(null);
                try {
                    await api.patch(`/transactions/${id}/ship`);
                    setOrder({ ...order, status: 'SHIPPED' });
                    setMsg({ type: 'success', text: 'Order marked as shipped!' });
                } catch (err) {
                    setMsg({ type: 'error', text: err.message });
                } finally { setActionLoading(false); }
            },
        });
    }

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;
    if (!order) return <div className="card"><p>Order not found.</p></div>;

    const isRequested = order.status === 'REQUESTED';
    const showFullBuyerDetails = ['PAID', 'SHIPPED', 'DELIVERED', 'RELEASED', 'DISPUTED', 'REFUNDED'].includes(order.status);

    return (
        <>
        {confirm && <ConfirmDialog {...confirm} onClose={() => setConfirm(null)} />}
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/seller/dashboard/orders" className="btn btn-ghost btn-sm">← Back</Link>
                    <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{order.order_ref}</h1>
                    <span className={`status-badge ${order.status}`}>{order.status}</span>
                </div>
            </div>

            {msg && <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.5rem' }}>{msg.text}</div>}

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Order Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-sm" style={{ fontWeight: 600 }}>Product</span>
                            <span>{order.product_name}</span>
                        </div>

                        {(isRequested || order.status === 'CANCELLED') ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-sm" style={{ fontWeight: 600 }}>Product Price</span>
                                <span style={{ color: 'var(--brand)', fontWeight: 700 }}>GHS {(order.product_price / 100).toFixed(2)}</span>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-sm" style={{ fontWeight: 600 }}>Delivery Fee</span>
                                    <span>GHS {(order.delivery_fee / 100).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-sm" style={{ fontWeight: 600 }}>Total Amount <span className="text-xs text-muted">(Paid by buyer)</span></span>
                                    <span style={{ color: 'var(--brand)', fontWeight: 700 }}>GHS {(order.total_amount / 100).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-sm" style={{ fontWeight: 600 }}>Platform Fee (5%)</span>
                                    <span className="text-danger">- GHS {(order.platform_fee / 100).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-color)', borderRadius: '6px' }}>
                                    <span className="text-sm" style={{ fontWeight: 600 }}>Your Payout</span>
                                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>GHS {(order.seller_payout_amount / 100).toFixed(2)}</span>
                                </div>
                            </>
                        )}

                        <hr className="divider" style={{ margin: '0.25rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-sm" style={{ fontWeight: 600 }}>Order Date</span>
                            <span className="text-sm">{new Date(order.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Buyer Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-sm" style={{ fontWeight: 600 }}>Name</span>
                            <span>{showFullBuyerDetails ? order.buyer_name : <span className="text-muted text-xs">Hidden until paid</span>}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-sm" style={{ fontWeight: 600 }}>Phone</span>
                            <span className="text-mono">{showFullBuyerDetails ? order.buyer_phone : <span className="text-muted text-xs">Hidden until paid</span>}</span>
                        </div>
                        {(showFullBuyerDetails && order.buyer_email) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-sm" style={{ fontWeight: 600 }}>Email</span>
                                <span>{order.buyer_email}</span>
                            </div>
                        )}
                        <hr className="divider" style={{ margin: '0.25rem 0' }} />
                        <div>
                            <span className="text-sm" style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Buyer Location / Address</span>
                            <span className="text-sm">{order.buyer_location_text || order.buyer_address || <span className="text-muted">Not provided</span>}</span>

                            {(order.buyer_lat && order.buyer_lng) && (
                                <a href={`https://www.google.com/maps/search/?api=1&query=${order.buyer_lat},${order.buyer_lng}`} target="_blank" rel="noopener noreferrer" className="text-xs mt-1" style={{ display: 'inline-block', color: 'var(--brand)' }}>
                                    📍 View on Google Maps
                                </a>
                            )}

                            {(order.buyer_lat && order.buyer_lng && order.seller_lat && order.seller_lng) && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    {routeLoading && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏳ Calculating route...</div>
                                    )}
                                    {routeInfo && (
                                        <div style={{
                                            background: 'rgba(255,107,0,0.06)',
                                            border: '1px solid rgba(255,107,0,0.18)',
                                            borderRadius: 10,
                                            padding: '0.75rem',
                                            display: 'flex',
                                            gap: '0.75rem',
                                        }}>
                                            {routeInfo.car && (
                                                <div style={{ flex: 1, textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}><Car size={20} color="var(--text-muted)" /></div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>{formatDuration(routeInfo.car.duration)}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDistance(routeInfo.car.distance)}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>By Car</div>
                                                </div>
                                            )}
                                            <div style={{ width: 1, background: 'var(--border)' }} />
                                            {routeInfo.bike && (
                                                <div style={{ flex: 1, textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}><Bike size={20} color="var(--text-muted)" /></div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>{formatDuration(routeInfo.bike.duration * 0.75)}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDistance(routeInfo.bike.distance)}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>By Motorbike</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        </div>
                </div>
            </div>

            {/* Quoting Form */}
            {isRequested && (
                <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--brand)', background: 'rgba(43,125,233,0.02)' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Quote Delivery Fee</h3>
                    <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                        Review the buyer's location above and provide a delivery fee. The buyer will be notified and can then complete payment. You have until <strong>{new Date(order.quote_deadline).toLocaleString()}</strong> to respond, otherwise the order will auto-cancel and affect your seller score.
                    </p>
                    <form onSubmit={handleQuote} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: 400 }}>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label>Delivery Fee (GHS) *</label>
                            <input className="form-input" type="number" step="0.01" min="0" required placeholder="0.00 if free" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={actionLoading}>{actionLoading ? 'Sending...' : 'Send Quote'}</button>
                    </form>
                </div>
            )}

            {order.status === 'QUOTED' && (
                <div className="card text-center" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏳</div>
                    <h3>Waiting for Buyer</h3>
                    <p className="text-sm mt-1">You quoted <strong>GHS {(order.delivery_fee / 100).toFixed(2)}</strong> for delivery. We are waiting for the buyer to accept and complete payment or cancel the order.</p>
                </div>
            )}

            {order.status === 'PAID' && (
                <div className="card" style={{ textAlign: 'center', background: 'rgba(43,125,233,0.03)' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Ready to Ship?</h3>
                    <p className="text-sm" style={{ marginBottom: '1rem' }}>
                        Mark this order as shipped to notify the buyer that it is on the way.
                    </p>
                    <button className="btn btn-primary btn-lg" onClick={handleShip} disabled={actionLoading}>
                        {actionLoading ? 'Processing...' : <><Package size={16} style={{ marginRight: '0.4rem' }} />Mark as Shipped / Picked Up</>}
                    </button>
                </div>
            )}

            {order.dispute_reason && (
                <div className="alert alert-danger" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <AlertTriangle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <strong>Dispute Raised</strong>
                        <p className="text-sm mt-1">{order.dispute_reason}</p>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
