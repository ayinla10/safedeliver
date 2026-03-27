'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function SellerDashboard() {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Dashboard</h1>
                        {stats && stats.seller_score !== undefined && (
                            <div style={{ padding: '0.25rem 0.5rem', background: 'rgba(43,125,233,0.1)', color: 'var(--brand)', borderRadius: '16px', fontSize: '0.875rem', fontWeight: 600 }}>
                                ⭐️ Score: {stats.seller_score}/100
                            </div>
                        )}
                    </div>
                    <p className="text-sm mt-1">Welcome to your SafeDeliver seller panel</p>
                </div>
                <Link href="/seller/dashboard/links/new" className="btn btn-primary btn-sm">+ New Checkout Link</Link>
            </div>

            {stats && (
                <div className="grid-5" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: 'var(--brand)' }}>GHS {((stats.total_revenue || 0) / 100).toFixed(2)}</span>
                        <span className="stat-label">Total Revenue</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{stats.total_orders || 0}</span>
                        <span className="stat-label">Total Orders</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{stats.pending_quotes || 0}</span>
                        <span className="stat-label">Pending Quotes</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{stats.active_orders || 0}</span>
                        <span className="stat-label">Active Orders</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: 'var(--warning)' }}>GHS {((stats.escrow_balance || 0) / 100).toFixed(2)}</span>
                        <span className="stat-label">In Escrow</span>
                    </div>
                </div>
            )}

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Recent Orders</h3>
                    <Link href="/seller/dashboard/orders" className="btn btn-ghost btn-sm">View All →</Link>
                </div>
                {recentOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
                        <p className="text-sm">No orders yet. Create a checkout link and share it!</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Product</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(tx => (
                                    <tr key={tx.id}>
                                        <td><Link href={`/seller/dashboard/orders/${tx.id}`} className="text-mono" style={{ color: 'var(--brand)' }}>{tx.order_ref}</Link></td>
                                        <td style={{ maxWidth: 200 }}>{tx.product_name}</td>
                                        <td style={{ fontWeight: 600 }}>GHS {(tx.total_amount / 100).toFixed(2)}</td>
                                        <td><span className={`status-badge ${tx.status}`}>{tx.status}</span></td>
                                        <td className="text-sm">{new Date(tx.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
