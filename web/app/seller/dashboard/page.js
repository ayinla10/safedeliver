'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function SellerDashboard() {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState(null);

    useEffect(() => {
        const s = localStorage.getItem('sd-seller');
        if (s) setSeller(JSON.parse(s));
        Promise.all([
            api.get('/seller/stats'),
            api.get('/transactions?limit=5'),
        ]).then(([s, t]) => {
            setStats(s);
            setRecentOrders(t.transactions || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    const score = stats?.seller_score ?? 0;
    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="animate-in" style={{ paddingBottom: '5rem' }}>
            {/* Greeting */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.75rem)', margin: 0 }}>
                            Hello, {seller?.full_name?.split(' ')[0] || 'Seller'}
                        </h1>
                        <p className="text-sm" style={{ marginTop: '0.25rem' }}>Here&apos;s your overview</p>
                    </div>
                    <Link href="/seller/dashboard/links/new" className="btn btn-primary btn-sm">+ New Link</Link>
                </div>
            </div>

            {/* Stat Cards — 2x2 grid */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem', marginBottom: '1.5rem' }}>
                    <div className="stat-card" style={{ background: 'var(--card-bg)', position: 'relative', overflow: 'hidden' }}>
                        <span className="stat-label" style={{ 
                            textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 
                        }}>Revenue</span>
                        <span className="stat-value" style={{ color: 'var(--success)', fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', marginTop: '0.5rem' }}>
                            GHS {((stats.total_revenue || 0) / 100).toFixed(2)}
                        </span>
                        <div style={{ marginTop: '0.5rem', height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '65%', background: 'var(--success)', borderRadius: '2px' }} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Active Orders</span>
                            <span style={{ fontSize: '1rem', color: 'var(--brand)' }}>⊞</span>
                        </div>
                        <span className="stat-value" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginTop: '0.5rem' }}>{stats.active_orders || 0}</span>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Pending Quotes</span>
                            <span style={{ fontSize: '1rem', color: 'var(--warning)' }}>◉</span>
                        </div>
                        <span className="stat-value" style={{ color: 'var(--warning)', fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginTop: '0.5rem' }}>{stats.pending_quotes || 0}</span>
                    </div>

                    {/* Circular Trust Score */}
                    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="80" height="80" viewBox="0 0 96 96" style={{ marginBottom: '0.25rem' }}>
                            <circle cx="48" cy="48" r="42" fill="none" stroke="var(--border)" strokeWidth="6" />
                            <circle cx="48" cy="48" r="42" fill="none" stroke="var(--brand)" strokeWidth="6"
                                strokeDasharray={circumference} strokeDashoffset={offset}
                                strokeLinecap="round" transform="rotate(-90 48 48)"
                                style={{ transition: 'stroke-dashoffset 1s ease' }} />
                            <text x="48" y="48" textAnchor="middle" dominantBaseline="central"
                                fill="var(--text)" fontSize="22" fontWeight="700">{score}</text>
                        </svg>
                        <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px', fontWeight: 600 }}>Trust Score</span>
                    </div>
                </div>
            )}

            {/* Escrow balance strip */}
            {stats && (stats.escrow_balance || 0) > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
                    <span className="stat-label">Funds in Escrow</span>
                    <span style={{ fontWeight: 700, color: 'var(--warning)', fontSize: '1.1rem' }}>GHS {((stats.escrow_balance || 0) / 100).toFixed(2)}</span>
                </div>
            )}

            {/* Recent Orders */}
            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Recent Orders</h3>
                    <Link href="/seller/dashboard/orders" style={{ color: 'var(--brand)', fontWeight: 600, fontSize: '0.875rem' }}>VIEW ALL</Link>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.5 }}>◫</div>
                        <p className="text-sm">No orders yet. Create a checkout link and share it!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {recentOrders.map(tx => (
                            <Link key={tx.id} href={`/seller/dashboard/orders/${tx.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', cursor: 'pointer' }}>
                                    {/* Product thumbnail */}
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 'var(--radius-md)', 
                                        background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.25rem', flexShrink: 0, overflow: 'hidden'
                                    }}>
                                        {tx.image_url ? (
                                            <img src={tx.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ opacity: 0.4 }}>◫</span>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.product_name}</div>
                                        <div className="text-xs" style={{ marginTop: '0.125rem' }}>
                                            Buyer: {tx.buyer_name?.split(' ')[0] || 'Unknown'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>GHS {(tx.total_amount / 100).toFixed(2)}</div>
                                        <span className={`status-badge ${tx.status}`} style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>{tx.status}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
