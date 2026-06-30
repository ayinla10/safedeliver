'use client';
import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '@/lib/adminApi';
import { MessageSquare, Bell, Mail, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle2, AlertCircle, Clock, Inbox } from 'lucide-react';

const PAGE_SIZE = 25;

const CHANNEL_CONFIG = {
    SMS:   { icon: <MessageSquare size={14} />, color: '#0369a1', bg: 'rgba(14,165,233,0.1)' },
    PUSH:  { icon: <Bell size={14} />,          color: '#7c3aed', bg: 'rgba(168,85,247,0.1)' },
    EMAIL: { icon: <Mail size={14} />,          color: '#b45309', bg: 'rgba(234,179,8,0.1)'  },
};

const STATUS_CONFIG = {
    SENT:      { icon: <CheckCircle2 size={12} />, color: '#15803d', bg: 'rgba(34,197,94,0.1)',   label: 'SENT' },
    SIMULATED: { icon: <Clock size={12} />,         color: '#b45309', bg: 'rgba(234,179,8,0.1)',   label: 'SIMULATED' },
    FAILED:    { icon: <AlertCircle size={12} />,   color: '#b91c1c', bg: 'rgba(239,68,68,0.1)',   label: 'FAILED' },
};

function ChannelBadge({ channel }) {
    const c = CHANNEL_CONFIG[channel] || { icon: <MessageSquare size={14} />, color: '#555', bg: 'rgba(0,0,0,0.05)' };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: c.bg, color: c.color }}>
            {c.icon} {channel}
        </span>
    );
}

function StatusBadge({ status }) {
    const s = STATUS_CONFIG[status] || STATUS_CONFIG.SIMULATED;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: s.bg, color: s.color }}>
            {s.icon} {s.label}
        </span>
    );
}

function NotificationRow({ n }) {
    const [expanded, setExpanded] = useState(false);
    const isLong = (n.message || '').length > 90;
    const displayMsg = expanded || !isLong ? n.message : n.message.substring(0, 90) + '…';

    return (
        <tr onClick={() => isLong && setExpanded(e => !e)} style={{ cursor: isLong ? 'pointer' : 'default' }}>
            <td>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{new Date(n.sent_at).toLocaleDateString()}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(n.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </td>
            <td><ChannelBadge channel={n.channel} /></td>
            <td>
                <div style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{n.phone}</div>
                {n.order_ref && <div style={{ fontSize: '0.72rem', color: 'var(--brand)', fontFamily: 'monospace', marginTop: '0.15rem' }}>{n.order_ref}</div>}
            </td>
            <td style={{ maxWidth: 380 }}>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.5, wordBreak: 'break-word' }}>{displayMsg}</div>
                {isLong && <div style={{ fontSize: '0.72rem', color: 'var(--brand)', marginTop: '0.2rem' }}>{expanded ? 'Show less ↑' : 'Show more ↓'}</div>}
            </td>
            <td><StatusBadge status={n.status} /></td>
        </tr>
    );
}

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [total, setTotal] = useState(0);
    const [globalSummary, setGlobalSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [channel, setChannel] = useState('');
    const [status, setStatus] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        setLoading(true);
        const offset = (page - 1) * PAGE_SIZE;
        const params = new URLSearchParams({ limit: PAGE_SIZE, offset });
        if (channel) params.set('channel', channel);
        if (status) params.set('status', status);
        if (search) params.set('search', search);
        adminApi.get(`/admin/notifications?${params}`).then(data => {
            const rows = data.notifications || data;
            setNotifications(Array.isArray(rows) ? rows : []);
            setTotal(typeof data.total === 'number' ? data.total : (Array.isArray(rows) ? rows.length : 0));
            if (data.summary) setGlobalSummary(data.summary);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [channel, status, search, page]);

    function changeChannel(c) { setChannel(c); setPage(1); }
    function changeStatus(s) { setStatus(s); setPage(1); }
    function submitSearch(e) { e.preventDefault(); setSearch(searchInput); setPage(1); }
    function clearSearch() { setSearchInput(''); setSearch(''); setPage(1); }

    // Use backend global summary if available, else fall back to current page
    const summary = useMemo(() => ({
        total:  globalSummary ? globalSummary.total       : total,
        sms:    globalSummary ? globalSummary.total_sms   : notifications.filter(n => n.channel === 'SMS').length,
        push:   globalSummary ? globalSummary.total_push  : notifications.filter(n => n.channel === 'PUSH').length,
        failed: globalSummary ? globalSummary.total_failed: notifications.filter(n => n.status === 'FAILED').length,
    }), [notifications, total, globalSummary]);

    return (
        <div className="animate-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Notification Logs</h1>
            </div>

            {/* Summary bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total',  value: summary.total,  color: 'var(--brand)',   icon: <Inbox size={14} /> },
                    { label: 'SMS',    value: summary.sms,    color: '#0369a1',        icon: <MessageSquare size={14} /> },
                    { label: 'Push',   value: summary.push,   color: '#7c3aed',        icon: <Bell size={14} /> },
                    { label: 'Failed', value: summary.failed, color: summary.failed > 0 ? 'var(--danger)' : 'var(--muted)', icon: <AlertCircle size={14} /> },
                ].map(s => (
                    <div key={s.label} style={{ padding: '0.875rem 1rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
                            <span style={{ color: s.color }}>{s.icon}</span>{s.label}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Channel tabs */}
            <div className="tab-bar" style={{ marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {[
                    { val: '',      label: 'All',   icon: null },
                    { val: 'SMS',   label: 'SMS',   icon: <MessageSquare size={13} /> },
                    { val: 'PUSH',  label: 'Push',  icon: <Bell size={13} /> },
                    { val: 'EMAIL', label: 'Email', icon: <Mail size={13} /> },
                ].map(({ val, label, icon }) => (
                    <button key={val} className={`tab-btn ${channel === val ? 'active' : ''}`} onClick={() => changeChannel(val)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {icon}{label}
                    </button>
                ))}
            </div>

            {/* Status tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {[
                    { val: '',          label: 'All Statuses' },
                    { val: 'SENT',      label: 'Sent' },
                    { val: 'SIMULATED', label: 'Simulated' },
                    { val: 'FAILED',    label: 'Failed' },
                ].map(({ val, label }) => {
                    const sc = val ? STATUS_CONFIG[val] : null;
                    const isActive = status === val;
                    return (
                        <button key={val} onClick={() => changeStatus(val)} style={{
                            padding: '0.35rem 0.875rem', borderRadius: '8px', border: '1px solid',
                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            background: isActive ? (sc?.bg || 'var(--bg-alt)') : 'transparent',
                            color: isActive ? (sc?.color || 'var(--text)') : 'var(--muted)',
                            borderColor: isActive ? (sc?.color || 'var(--border)') : 'var(--border)',
                        }}>
                            {sc?.icon}{label}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <form onSubmit={submitSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input
                        className="form-input"
                        placeholder="Search by phone number or order ref…"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        style={{ paddingLeft: '2.5rem', margin: 0 }}
                    />
                    {searchInput && (
                        <button type="button" onClick={clearSearch} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                            <X size={15} />
                        </button>
                    )}
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Search</button>
            </form>

            {/* Table */}
            {loading ? (
                <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    {notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                            <Inbox size={40} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                            <p className="text-sm">{search ? `No results for "${search}"` : 'No notifications found'}</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Channel</th>
                                        <th>Recipient</th>
                                        <th>Message</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notifications.map((n, i) => <NotificationRow key={n.id || i} n={n} />)}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer + Pagination */}
                    {notifications.length > 0 && (
                        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                {search
                                    ? `${notifications.length} result${notifications.length !== 1 ? 's' : ''} on this page for "${search}"`
                                    : `Showing ${total === 0 ? 0 : ((page - 1) * PAGE_SIZE) + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} notification${total !== 1 ? 's' : ''}`
                                }
                            </span>
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex' }}><ChevronsLeft size={15} /></button>
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex' }}><ChevronLeft size={15} /></button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                        .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                                        .map((p, i) => p === '...'
                                            ? <span key={`e${i}`} style={{ padding: '0 0.3rem', color: 'var(--muted)', fontSize: '0.8rem' }}>…</span>
                                            : <button key={p} onClick={() => setPage(p)} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid', fontSize: '0.8rem', fontWeight: p === page ? 700 : 400, cursor: 'pointer', background: p === page ? 'var(--brand)' : 'none', color: p === page ? '#fff' : 'var(--text)', borderColor: p === page ? 'var(--brand)' : 'var(--border)' }}>{p}</button>
                                        )}
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, display: 'flex' }}><ChevronRight size={15} /></button>
                                    <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, display: 'flex' }}><ChevronsRight size={15} /></button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
