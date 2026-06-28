'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const STATUS_STYLES = {
    REQUESTED: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    QUOTED:    { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    ACCEPTED:  { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
    PAID:      { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
    SHIPPED:   { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' },
    DELIVERED: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    RELEASED:  { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
    AUTO_RELEASED: { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
    DISPUTED:  { bg: '#FFF7ED', color: '#B45309', border: '#FDE68A' },
    CANCELLED: { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' },
    REFUNDED:  { bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' },
};

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => { setPage(1); }, [filter]);

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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Orders</h1>
                <span style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    background: 'rgba(255,107,0,0.1)',
                    color: '#FF6B00',
                    padding: '0.3rem 0.75rem',
                    borderRadius: 20,
                    border: '1px solid rgba(255,107,0,0.2)',
                }}>{total} total</span>
            </div>

            {/* Filter tabs */}
            <div className="tab-bar" style={{ marginBottom: '1.25rem' }}>
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
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ minWidth: 640 }}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Order Ref</th>
                                        <th>Product</th>
                                        <th>Buyer</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(tx => {
                                        const s = STATUS_STYLES[tx.status] || STATUS_STYLES.CANCELLED;
                                        return (
                                            <tr key={tx.id}>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                                                    <div>{new Date(tx.created_at).toLocaleDateString()}</div>
                                                    <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                {/* Order Ref — light blue pill */}
                                                <td>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        fontFamily: "'SF Mono','Fira Code',monospace",
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        background: 'rgba(59,130,246,0.08)',
                                                        color: '#2563EB',
                                                        border: '1px solid rgba(59,130,246,0.2)',
                                                        padding: '0.25rem 0.625rem',
                                                        borderRadius: 8,
                                                        whiteSpace: 'nowrap',
                                                    }}>{tx.order_ref}</span>
                                                </td>
                                                <td style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {tx.product_name}
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{tx.buyer_name}</td>
                                                <td style={{ fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--text)' }}>
                                                    GHS {(tx.total_amount / 100).toFixed(2)}
                                                </td>
                                                {/* Status — unique color per status */}
                                                <td>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 700,
                                                        letterSpacing: '0.3px',
                                                        textTransform: 'uppercase',
                                                        background: s.bg,
                                                        color: s.color,
                                                        border: `1px solid ${s.border}`,
                                                        padding: '0.25rem 0.625rem',
                                                        borderRadius: 8,
                                                        whiteSpace: 'nowrap',
                                                    }}>{tx.status}</span>
                                                </td>
                                                {/* View button — orange */}
                                                <td>
                                                    <Link href={`/seller/dashboard/orders/${tx.id}`} style={{
                                                        display: 'inline-block',
                                                        background: '#FF6B00',
                                                        color: '#fff',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        padding: '0.375rem 0.875rem',
                                                        borderRadius: 8,
                                                        textDecoration: 'none',
                                                        whiteSpace: 'nowrap',
                                                        transition: 'background 0.2s',
                                                    }}>View</Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
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
