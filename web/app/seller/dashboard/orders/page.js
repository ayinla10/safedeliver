'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = filter ? `?status=${filter}` : '';
        api.get(`/transactions${params}`).then(data => {
            setOrders(data.transactions || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [filter]);

    const tabs = ['', 'REQUESTED', 'QUOTED', 'ACCEPTED', 'PAID', 'SHIPPED', 'DELIVERED', 'RELEASED', 'DISPUTED', 'CANCELLED'];
    const tabLabels = { '': 'All', REQUESTED: 'Requests', QUOTED: 'Quoted', ACCEPTED: 'Accepted', PAID: 'Paid', SHIPPED: 'Shipped', DELIVERED: 'Delivered', RELEASED: 'Released', DISPUTED: 'Disputed', CANCELLED: 'Cancelled' };

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    return (
        <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Orders</h1>
            <div className="tab-bar">
                {tabs.map(t => (
                    <button key={t} className={`tab-btn ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
                        {tabLabels[t]}
                    </button>
                ))}
            </div>

            {orders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
                    <p className="text-sm">No orders found</p>
                </div>
            ) : (
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
            )}
        </div>
    );
}
