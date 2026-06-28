'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        setPage(1);
    }, [filter]);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ page, limit: 20 });
        if (filter) params.set('status', filter);
        api.get(`/transactions?${params}`).then(data => {
            setOrders(data.transactions || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [filter, page]);

    const tabs = ['', 'REQUESTED', 'QUOTED', 'ACCEPTED', 'PAID', 'SHIPPED', 'DELIVERED', 'RELEASED', 'DISPUTED', 'CANCELLED'];
    const tabLabels = { '': 'All', REQUESTED: 'Requests', QUOTED: 'Quoted', ACCEPTED: 'Accepted', PAID: 'Paid', SHIPPED: 'Shipped', DELIVERED: 'Delivered', RELEASED: 'Released', DISPUTED: 'Disputed', CANCELLED: 'Cancelled' };

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem' }}>Orders</h1>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{total} total</span>
            </div>
            <div className="tab-bar">
                {tabs.map(t => (
                    <button key={t} className={`tab-btn ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
                        {tabLabels[t]}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>
            ) : orders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
                    <p className="text-sm">No orders found</p>
                </div>
            ) : (
                <>
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Order Ref</th>
                                        <th>Product</th>
                                        <th>Buyer</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(tx => (
                                        <tr key={tx.id}>
                                            <td><span className="text-mono">{tx.order_ref}</span></td>
                                            <td style={{ maxWidth: 180 }}>{tx.product_name}</td>
                                            <td>{tx.buyer_name}</td>
                                            <td style={{ fontWeight: 600 }}>GHS {(tx.total_amount / 100).toFixed(2)}</td>
                                            <td><span className={`status-badge ${tx.status}`}>{tx.status}</span></td>
                                            <td className="text-sm">{new Date(tx.created_at).toLocaleDateString()}</td>
                                            <td><Link href={`/seller/dashboard/orders/${tx.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
                            <span className="text-sm">Page {page} of {totalPages}</span>
                            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
