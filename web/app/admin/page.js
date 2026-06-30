'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import {
    ArrowRightLeft, Scale, Users, Database, ClipboardList,
    Bell, ShieldCheck, MessageSquare, TrendingUp, AlertTriangle
} from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.get('/admin/stats')
            .then(data => { setStats(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    const fmt = (pesewas) => `GHS ${((pesewas || 0) / 100).toFixed(2)}`;

    const quickLinks = [
        { href: '/admin/transactions', icon: <ArrowRightLeft size={22} color="var(--brand)" />,   label: 'Transactions',  desc: 'View and manage all platform transactions' },
        { href: '/admin/disputes',     icon: <Scale size={22} color="var(--danger)" />,            label: 'Disputes',      desc: 'Resolve buyer-seller disputes' },
        { href: '/admin/sellers',      icon: <Users size={22} color="#7c3aed" />,                  label: 'Sellers',       desc: 'Manage seller accounts and KYC' },
        { href: '/admin/ledger',       icon: <Database size={22} color="#0284c7" />,               label: 'Ledger',        desc: 'Escrow and payout ledger entries' },
        { href: '/admin/audit',        icon: <ClipboardList size={22} color="#475569" />,          label: 'Audit Log',     desc: 'System activity and action history' },
        { href: '/admin/notifications',icon: <Bell size={22} color="#b45309" />,                   label: 'Notifications', desc: 'View all platform notifications' },
        { href: '/admin/kyc',          icon: <ShieldCheck size={22} color="#16a34a" />,            label: 'KYC Review',    desc: `${stats?.pending_kyc ?? 0} pending applications` },
        { href: '/admin/contact-enquiries', icon: <MessageSquare size={22} color="#6b7280" />,    label: 'Enquiries',     desc: 'Customer contact form submissions' },
    ];

    return (
        <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Admin Dashboard</h1>
            <p className="text-sm text-muted" style={{ marginBottom: '1.75rem' }}>Platform overview — live data</p>

            {stats && (
                <>
                    {/* Volume stats */}
                    <div className="grid-4" style={{ marginBottom: '1rem' }}>
                        {[
                            { label: 'Total Volume',    value: fmt(stats.total_volume),    color: 'var(--brand)' },
                            { label: 'Held in Escrow',  value: fmt(stats.held_volume),     color: '#b45309' },
                            { label: 'Funds Released',  value: fmt(stats.released_volume), color: 'var(--success)' },
                            { label: 'Platform Fees',   value: fmt(stats.platform_fees),   color: '#7c3aed' },
                        ].map(s => (
                            <div key={s.label} className="stat-card">
                                <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                                <span className="stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Order + seller stats */}
                    <div className="grid-4" style={{ marginBottom: '2rem' }}>
                        {[
                            { label: 'Total Orders',     value: stats.total_transactions, color: 'var(--text)' },
                            { label: 'Active Orders',    value: stats.active_orders,      color: 'var(--brand)' },
                            { label: 'Completed Orders', value: stats.completed_orders,   color: 'var(--success)' },
                            { label: 'Open Disputes',    value: stats.open_disputes,      color: stats.open_disputes > 0 ? 'var(--danger)' : 'var(--muted)' },
                            { label: 'Total Sellers',    value: stats.total_sellers,      color: 'var(--text)' },
                            { label: 'Active Sellers',   value: stats.active_sellers,     color: 'var(--success)' },
                            { label: 'KYC Pending',      value: stats.pending_kyc,        color: stats.pending_kyc > 0 ? '#b45309' : 'var(--muted)' },
                            { label: 'Orders (30d)',     value: stats.orders_last_30d,    color: 'var(--brand)' },
                        ].map(s => (
                            <div key={s.label} className="stat-card">
                                <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                                <span className="stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Quick links */}
            <div className="grid-3">
                {quickLinks.map(l => (
                    <a key={l.href} href={l.href} className="card-glow" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ marginBottom: '0.25rem' }}>{l.icon}</div>
                        <h3 style={{ margin: 0 }}>{l.label}</h3>
                        <p className="text-sm text-muted" style={{ margin: 0 }}>{l.desc}</p>
                    </a>
                ))}
            </div>
        </div>
    );
}
