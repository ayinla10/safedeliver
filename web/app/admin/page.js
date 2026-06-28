'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.get('/admin/transactions?limit=200').then(data => {
            const txs = data.transactions || [];
            const total = txs.reduce((s, t) => s + (t.total_amount || 0), 0);
            const fees = txs.reduce((s, t) => s + (t.platform_fee || 0), 0);
            
            const heldTxs = txs.filter(t => ['PAID', 'SHIPPED', 'DISPUTED'].includes(t.status));
            const releasedTxs = txs.filter(t => ['DELIVERED', 'RELEASED', 'AUTO_RELEASED'].includes(t.status));
            
            const heldVolume = heldTxs.reduce((s, t) => s + (t.total_amount || 0), 0);
            const releasedVolume = releasedTxs.reduce((s, t) => s + (t.total_amount || 0), 0);

            const disputed = txs.filter(t => t.status === 'DISPUTED').length;
            const activeCount = heldTxs.length;
            const completedCount = releasedTxs.length;

            setStats({ 
                total_transactions: txs.length, 
                total_volume: total, 
                platform_fees: fees, 
                held_volume: heldVolume,
                released_volume: releasedVolume,
                active_orders: activeCount,
                completed_orders: completedCount,
                disputes: disputed 
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    return (
        <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Admin Dashboard</h1>

            {stats && (
                <div className="grid-4" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: 'var(--brand)' }}>GHS {(stats.total_volume / 100).toFixed(2)}</span>
                        <span className="stat-label">Total Volume</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: 'var(--warning)' }}>GHS {(stats.held_volume / 100).toFixed(2)}</span>
                        <span className="stat-label">Held in Escrow</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: 'var(--success)' }}>GHS {(stats.released_volume / 100).toFixed(2)}</span>
                        <span className="stat-label">Funds Released</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: 'var(--success)' }}>GHS {(stats.platform_fees / 100).toFixed(2)}</span>
                        <span className="stat-label">Platform Fees</span>
                    </div>

                    <div className="stat-card">
                        <span className="stat-value">{stats.total_transactions}</span>
                        <span className="stat-label">Total Orders</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.completed_orders}</span>
                        <span className="stat-label">Orders Completed</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: 'var(--brand)' }}>{stats.active_orders}</span>
                        <span className="stat-label">Active Orders</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: 'var(--danger)' }}>{stats.disputes}</span>
                        <span className="stat-label">Open Disputes</span>
                    </div>
                </div>
            )}

            <div className="grid-3">
                <a href="/admin/transactions" className="card-glow" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>💰</div>
                    <h3>Transactions</h3>
                    <p className="text-sm">View and manage all platform transactions</p>
                </a>
                <a href="/admin/disputes" className="card-glow" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚖️</div>
                    <h3>Disputes</h3>
                    <p className="text-sm">Resolve buyer-seller disputes</p>
                </a>
                <a href="/admin/sellers" className="card-glow" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>👥</div>
                    <h3>Sellers</h3>
                    <p className="text-sm">Manage seller accounts and KYC</p>
                </a>
                <a href="/admin/ledger" className="card-glow" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📒</div>
                    <h3>Ledger</h3>
                    <p className="text-sm">Escrow and payout ledger entries</p>
                </a>
                <a href="/admin/audit" className="card-glow" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📋</div>
                    <h3>Audit Log</h3>
                    <p className="text-sm">System activity and action history</p>
                </a>
                <a href="/admin/notifications" className="card-glow" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🔔</div>
                    <h3>Notifications</h3>
                    <p className="text-sm">View platform notifications</p>
                </a>
            </div>
        </div>
    );
}
