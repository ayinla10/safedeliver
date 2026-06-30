'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bell, MessageSquare, Mail, Smartphone, CheckCheck, Package, ShieldCheck, DollarSign, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

const SEEN_KEY = 'sd-notif-last-seen';

function channelIcon(channel) {
    switch (channel) {
        case 'SMS':   return <MessageSquare size={15} />;
        case 'EMAIL': return <Mail size={15} />;
        case 'PUSH':  return <Smartphone size={15} />;
        default:      return <Bell size={15} />;
    }
}

function channelColor(channel) {
    switch (channel) {
        case 'SMS':   return { bg: 'rgba(59,130,246,0.1)',  color: '#3B82F6' };
        case 'EMAIL': return { bg: 'rgba(139,92,246,0.1)', color: '#8B5CF6' };
        case 'PUSH':  return { bg: 'rgba(16,185,129,0.1)', color: '#10B981' };
        default:      return { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' };
    }
}

function messageIcon(message) {
    const m = message.toLowerCase();
    if (m.includes('dispute'))  return <AlertTriangle size={20} color="#EF4444" />;
    if (m.includes('released') || m.includes('payout')) return <DollarSign size={20} color="#10B981" />;
    if (m.includes('shipped') || m.includes('order'))   return <Package size={20} color="#3B82F6" />;
    if (m.includes('kyc') || m.includes('verified'))    return <ShieldCheck size={20} color="#8B5CF6" />;
    return <Bell size={20} color="#FF6B00" />;
}

function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'Just now';
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [total, setTotal]   = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage]     = useState(0);
    const [lastSeen, setLastSeen] = useState(null);
    const LIMIT = 20;

    const fetchNotifs = useCallback(async (pg = 0) => {
        setLoading(true);
        try {
            const data = await api.get(`/seller/notifications?limit=${LIMIT}&offset=${pg * LIMIT}`);
            setNotifications(data.notifications || []);
            setTotal(data.total || 0);
        } catch {}
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        // Remember what was "last seen" BEFORE marking current as seen
        const prev = localStorage.getItem(SEEN_KEY);
        setLastSeen(prev ? new Date(parseInt(prev)) : null);
        // Mark all current as seen
        localStorage.setItem(SEEN_KEY, String(Date.now()));
        // Dispatch event so bell badge updates immediately
        window.dispatchEvent(new Event('notif-seen'));
        fetchNotifs(0);
    }, [fetchNotifs]);

    const isNew = (n) => lastSeen ? new Date(n.sent_at) > lastSeen : false;

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="animate-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={22} color="#FF6B00" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Notifications</h1>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {total} total notification{total !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                {lastSeen && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <CheckCheck size={14} color="#10B981" />
                        All caught up
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>
            ) : notifications.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Bell size={48} style={{ opacity: 0.15, marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 700, marginBottom: '0.35rem' }}>No notifications yet</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)', margin: 0 }}>
                        Order updates, payment confirmations, and KYC alerts will appear here.
                    </p>
                </div>
            ) : (
                <>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {notifications.map((n, i) => {
                            const ch = channelColor(n.channel);
                            const fresh = isNew(n);
                            return (
                                <div key={n.id} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '1rem',
                                    padding: '1rem 1.25rem',
                                    borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                                    background: fresh ? 'rgba(255,107,0,0.03)' : 'transparent',
                                    position: 'relative',
                                }}>
                                    {/* New dot */}
                                    {fresh && (
                                        <div style={{
                                            position: 'absolute', top: '1.1rem', left: '0.4rem',
                                            width: 7, height: 7, borderRadius: '50%', background: '#FF6B00',
                                        }} />
                                    )}

                                    {/* Message icon */}
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                                        background: 'var(--bg-alt)', border: '1px solid var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {messageIcon(n.message)}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            margin: '0 0 0.4rem', fontSize: '0.875rem', lineHeight: 1.5,
                                            color: 'var(--text)', fontWeight: fresh ? 600 : 400,
                                        }}>
                                            {n.message}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            {/* Channel badge */}
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.3px',
                                                textTransform: 'uppercase',
                                                color: ch.color, background: ch.bg,
                                                padding: '0.2rem 0.5rem', borderRadius: 6,
                                            }}>
                                                {channelIcon(n.channel)} {n.channel}
                                            </span>
                                            {/* Order ref */}
                                            {n.order_ref && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                                    #{n.order_ref}
                                                </span>
                                            )}
                                            {/* Time */}
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                                {timeAgo(n.sent_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                            <button
                                className="btn btn-ghost btn-sm"
                                disabled={page === 0}
                                onClick={() => { const p = page - 1; setPage(p); fetchNotifs(p); }}
                            >← Newer</button>
                            <span style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                className="btn btn-ghost btn-sm"
                                disabled={page >= totalPages - 1}
                                onClick={() => { const p = page + 1; setPage(p); fetchNotifs(p); }}
                            >Older →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
