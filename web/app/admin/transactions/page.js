'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';

export default function AdminTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = filter ? `?status=${filter}` : '';
        adminApi.get(`/admin/transactions${params}`).then(data => {
            setTransactions(data.transactions || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [filter]);

    const tabs = ['', 'REQUESTED', 'QUOTED', 'ACCEPTED', 'PAID', 'SHIPPED', 'DELIVERED', 'RELEASED', 'DISPUTED', 'CANCELLED', 'REFUNDED'];
    const tabLabels = { '': 'All', REQUESTED: 'Req', QUOTED: 'Quoted', ACCEPTED: 'Accepted', PAID: 'Paid', SHIPPED: 'Ship', DELIVERED: 'Del', RELEASED: 'Rel', DISPUTED: 'Disp', CANCELLED: 'Canc', REFUNDED: 'Ref' };

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    return (
        <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>All Transactions</h1>
            <div className="tab-bar">
                {tabs.map(t => (
                    <button key={t} className={`tab-btn ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>{tabLabels[t]}</button>
                ))}
            </div>
            <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order Ref</th>
                                <th>Seller</th>
                                <th>Buyer</th>
                                <th>Product</th>
                                <th>Amount</th>
                                <th>Fee</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>No transactions found</td></tr>
                            ) : transactions.map(tx => (
                                <tr key={tx.id}>
                                    <td><span className="text-mono">{tx.order_ref}</span></td>
                                    <td>{tx.seller_name}</td>
                                    <td>{tx.buyer_name}</td>
                                    <td style={{ maxWidth: 150 }}>{tx.product_name}</td>
                                    <td style={{ fontWeight: 600 }}>GHS {(tx.total_amount / 100).toFixed(2)}</td>
                                    <td className="text-sm">GHS {(tx.platform_fee / 100).toFixed(2)}</td>
                                    <td><span className={`status-badge ${tx.status}`}>{tx.status}</span></td>
                                    <td className="text-sm">{new Date(tx.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
