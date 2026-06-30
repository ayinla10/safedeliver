'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart2, RefreshCw, ShieldCheck, ArrowRight, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

const STATUS_COLOR = {
    REQUESTED:    '#F59E0B',
    QUOTED:       '#3B82F6',
    ACCEPTED:     '#8B5CF6',
    PAID:         '#3B82F6',
    SHIPPED:      '#8B5CF6',
    DELIVERED:    '#10B981',
    RELEASED:     '#10B981',
    AUTO_RELEASED:'#10B981',
    DISPUTED:     '#EF4444',
    CANCELLED:    '#6B7280',
    REFUNDED:     '#EF4444',
};

function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'just now';
}

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
            api.get('/transactions?limit=8'),
        ]).then(([s, t]) => {
            setStats(s);
            setRecentOrders(t.transactions || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    const score = stats?.seller_score ?? 0;
    const scoreOver10 = (score / 10).toFixed(1);
    const circumference = 2 * Math.PI * 22;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="animate-in">

            {/* ── Top: Hero + 2 Stat Cards ── */}
            <div className="seller-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem', alignItems: 'stretch' }}>

                {/* Hero Card — spans 2 cols */}
                <div style={{
                    gridColumn: 'span 2',
                    background: 'linear-gradient(145deg, #FF6B00 0%, #FF9500 100%)',
                    borderRadius: 20,
                    padding: '1.75rem',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(255,107,0,0.3)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -30, left: '40%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', margin: '0 0 0.1rem', fontWeight: 600 }}>
                            Hello, {seller?.full_name?.split(' ')[0] || 'Seller'}!
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', margin: '0 0 1.25rem', fontWeight: 400 }}>
                            Welcome back to your store overview.
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 0.2rem' }}>
                            Total Revenue
                        </p>
                        <p style={{ color: '#fff', fontSize: '2.25rem', fontWeight: 800, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>
                            GHS {((stats?.total_revenue || 0) / 100).toFixed(2)}
                        </p>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, marginTop: '1.25rem' }}>
                        <Link href="/seller/dashboard/links/new" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            background: 'rgba(255,255,255,0.2)',
                            color: '#fff', borderRadius: 10, padding: '0.5rem 1.1rem',
                            fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
                            border: '1px solid rgba(255,255,255,0.3)',
                        }}>
                            + Create New Link <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                {/* Active Orders */}
                <StatTile
                    icon={<BarChart2 size={22} color="#FF6B00" />}
                    iconBg="rgba(255,107,0,0.1)"
                    label="Active Orders"
                    value={stats?.active_orders || 0}
                    sub={`${stats?.pending_quotes || 0} pending quotes`}
                />

                {/* Trust Score */}
                <div style={{
                    background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18,
                    padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', boxShadow: 'var(--card-shadow)',
                }}>
                    <svg width="52" height="52" viewBox="0 0 52 52">
                        <circle cx="26" cy="26" r="22" fill="none" stroke="var(--border)" strokeWidth="4" />
                        <circle cx="26" cy="26" r="22" fill="none" stroke="#FF6B00" strokeWidth="4"
                            strokeDasharray={circumference} strokeDashoffset={offset}
                            strokeLinecap="round" transform="rotate(-90 26 26)"
                            style={{ transition: 'stroke-dashoffset 1s ease' }} />
                    </svg>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                        {scoreOver10}<span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>/10</span>
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Trust Score</span>
                </div>
            </div>

            {/* ── Second row: extra stats ── */}
            {stats && (
                <div className="grid-4" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                    <StatTile icon={<CheckCircle2 size={20} color="#10B981" />} iconBg="rgba(16,185,129,0.1)" label="Completed" value={stats.completed_orders || 0} />
                    <StatTile icon={<Clock size={20} color="#3B82F6" />} iconBg="rgba(59,130,246,0.1)" label="In Progress" value={stats.active_orders || 0} />
                    <StatTile icon={<AlertTriangle size={20} color="#EF4444" />} iconBg="rgba(239,68,68,0.1)" label="Disputed" value={stats.disputed_orders || 0} valueColor={stats.disputed_orders > 0 ? '#EF4444' : undefined} />
                    <StatTile icon={<TrendingUp size={20} color="#8B5CF6" />} iconBg="rgba(139,92,246,0.1)" label="Total Orders" value={stats.total_orders || 0} />
                </div>
            )}

            {/* ── Escrow balance banner ── */}
            {stats && (stats.escrow_balance || 0) > 0 && (
                <div style={{
                    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 14, padding: '0.875rem 1.25rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '1.25rem',
                }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Funds held in escrow</span>
                    <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: '1.05rem' }}>
                        GHS {((stats.escrow_balance || 0) / 100).toFixed(2)}
                    </span>
                </div>
            )}

            {/* ── Recent Activity ── */}
            <div className="card" style={{ padding: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Recent Activity</h3>
                    <Link href="/seller/dashboard/orders" style={{ color: '#FF6B00', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        View All <ArrowRight size={13} />
                    </Link>
                </div>

                {recentOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <ShieldCheck size={36} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
                        <p style={{ fontSize: '0.875rem', margin: 0 }}>No orders yet. Create a checkout link and share it!</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Buyer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(tx => (
                                    <tr key={tx.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-alt)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {tx.image_url
                                                        ? <img src={tx.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        : <span style={{ fontSize: '1.1rem', opacity: 0.25 }}>◫</span>
                                                    }
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tx.product_name}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {tx.buyer_name?.split(' ')[0] || '—'}
                                        </td>
                                        <td style={{ fontWeight: 700 }}>
                                            GHS {(tx.total_amount / 100).toFixed(2)}
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block', fontSize: '0.65rem', fontWeight: 700,
                                                letterSpacing: '0.3px', textTransform: 'uppercase',
                                                color: STATUS_COLOR[tx.status] || '#6B7280',
                                                background: `${STATUS_COLOR[tx.status] || '#6B7280'}18`,
                                                padding: '0.2rem 0.55rem', borderRadius: 6,
                                            }}>{tx.status}</span>
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{timeAgo(tx.created_at)}</td>
                                        <td>
                                            <Link href={`/seller/dashboard/orders/${tx.id}`} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                background: '#FF6B00', color: '#fff',
                                                fontSize: '0.72rem', fontWeight: 700,
                                                padding: '0.3rem 0.75rem', borderRadius: 8, textDecoration: 'none',
                                            }}>View <ArrowRight size={11} /></Link>
                                        </td>
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

function StatTile({ icon, iconBg, label, value, sub, valueColor }) {
    return (
        <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18,
            padding: '1.25rem', boxShadow: 'var(--card-shadow)',
        }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                {icon}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: valueColor || 'var(--text)', lineHeight: 1, marginBottom: '0.25rem' }}>{value}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
            {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', opacity: 0.7 }}>{sub}</div>}
        </div>
    );
}
