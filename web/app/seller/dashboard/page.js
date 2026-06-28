'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart2, RefreshCw, ShieldCheck } from 'lucide-react';
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
    const scoreOver10 = (score / 10).toFixed(1);
    const circumference = 2 * Math.PI * 22;
    const offset = circumference - (score / 100) * circumference;

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

    const statusColor = {
        REQUESTED: '#F59E0B',
        QUOTED: '#3B82F6',
        ACCEPTED: '#8B5CF6',
        PAID: '#3B82F6',
        SHIPPED: '#8B5CF6',
        DELIVERED: '#10B981',
        RELEASED: '#10B981',
        AUTO_RELEASED: '#10B981',
        DISPUTED: '#EF4444',
        CANCELLED: '#6B7280',
        REFUNDED: '#EF4444',
    };

    return (
        <div style={{ paddingBottom: '6rem', maxWidth: 480, margin: '0 auto' }}>

            {/* ── Hero Card ── */}
            <div style={{
                background: 'linear-gradient(145deg, #FF6B00 0%, #FF9500 100%)',
                borderRadius: 24,
                padding: '1.5rem',
                marginBottom: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(255, 107, 0, 0.35)',
            }}>
                {/* Decorative blobs */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
                        Hello, {seller?.full_name?.split(' ')[0] || 'Seller'}!
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', margin: '0.1rem 0 1rem', fontWeight: 400 }}>
                        Welcome back to your store overview.
                    </p>

                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>
                        Current Balance
                    </p>
                    <p style={{ color: '#fff', fontSize: 'clamp(2rem, 8vw, 2.75rem)', fontWeight: 800, margin: '0 0 1.25rem', letterSpacing: '-1px', lineHeight: 1 }}>
                        GHS {((stats?.wallet_balance || 0)).toFixed(2)}
                    </p>

                    <Link href="/seller/dashboard/links/new" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: 'rgba(255,255,255,0.18)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        color: '#fff',
                        borderRadius: 14,
                        padding: '0.875rem',
                        fontWeight: 700,
                        fontSize: '1rem',
                        textDecoration: 'none',
                        width: '100%',
                    }}>
                        + New Link
                    </Link>
                </div>
            </div>

            {/* ── 3 Stat Tiles ── */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>

                    {/* Active Orders */}
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 18,
                        padding: '1rem 0.75rem',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                        boxShadow: 'var(--card-shadow)',
                    }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BarChart2 size={20} color="#FF6B00" />
                        </div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{stats.active_orders || 0}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Active</span>
                    </div>

                    {/* Pending Quotes */}
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 18,
                        padding: '1rem 0.75rem',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                        boxShadow: 'var(--card-shadow)',
                    }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RefreshCw size={20} color="#F59E0B" />
                        </div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{stats.pending_quotes || 0}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Quotes</span>
                    </div>

                    {/* Trust Score */}
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 18,
                        padding: '1rem 0.75rem',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                        boxShadow: 'var(--card-shadow)',
                    }}>
                        <svg width="40" height="40" viewBox="0 0 52 52">
                            <circle cx="26" cy="26" r="22" fill="none" stroke="var(--border)" strokeWidth="4" />
                            <circle cx="26" cy="26" r="22" fill="none" stroke="#FF6B00" strokeWidth="4"
                                strokeDasharray={circumference} strokeDashoffset={offset}
                                strokeLinecap="round" transform="rotate(-90 26 26)"
                                style={{ transition: 'stroke-dashoffset 1s ease' }} />
                        </svg>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{scoreOver10}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>/ 10</span>
                    </div>
                </div>
            )}

            {/* ── Escrow Balance (if any) ── */}
            {stats && (stats.escrow_balance || 0) > 0 && (
                <div style={{
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 14,
                    padding: '0.875rem 1.125rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Funds in Escrow</span>
                    <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: '1rem' }}>GHS {((stats.escrow_balance || 0) / 100).toFixed(2)}</span>
                </div>
            )}

            {/* ── Recent Activity ── */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text)' }}>Recent Activity</h3>
                    <Link href="/seller/dashboard/orders" style={{ color: '#FF6B00', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.5px', textDecoration: 'none' }}>HISTORY</Link>
                </div>

                {recentOrders.length === 0 ? (
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 18,
                        padding: '3rem 1rem',
                        textAlign: 'center',
                        boxShadow: 'var(--card-shadow)',
                    }}>
                        <ShieldCheck size={36} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>No orders yet. Create a checkout link and share it!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {recentOrders.map(tx => (
                            <Link key={tx.id} href={`/seller/dashboard/orders/${tx.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div style={{
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 18,
                                    padding: '0.875rem 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.875rem',
                                    boxShadow: 'var(--card-shadow)',
                                    transition: 'box-shadow 0.2s',
                                }}>
                                    {/* Thumbnail */}
                                    <div style={{
                                        width: 52, height: 52, borderRadius: 14,
                                        background: 'var(--bg-alt)',
                                        overflow: 'hidden', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {tx.image_url
                                            ? <img src={tx.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>◫</span>
                                        }
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {tx.product_name}
                                        </p>
                                        <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Buyer: {tx.buyer_name?.split(' ')[0] || 'Unknown'} · {timeAgo(tx.created_at)}
                                        </p>
                                    </div>

                                    {/* Amount + Status */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text)' }}>
                                            {(tx.total_amount / 100).toLocaleString('en-GH', { minimumFractionDigits: 0 })}
                                        </p>
                                        <span style={{
                                            display: 'inline-block',
                                            marginTop: '0.25rem',
                                            fontSize: '0.6rem',
                                            fontWeight: 700,
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase',
                                            color: statusColor[tx.status] || '#6B7280',
                                            background: `${statusColor[tx.status] || '#6B7280'}18`,
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: 6,
                                        }}>{tx.status}</span>
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
