'use client';
import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Search, Download, ChevronDown, ChevronUp, X, Phone, MapPin, Package, Calendar, CreditCard } from 'lucide-react';

const STATUS_COLORS = {
    REQUESTED:   { bg: 'rgba(99,102,241,0.1)',  color: '#4f46e5' },
    QUOTED:      { bg: 'rgba(234,179,8,0.1)',   color: '#b45309' },
    ACCEPTED:    { bg: 'rgba(14,165,233,0.1)',  color: '#0369a1' },
    PAID:        { bg: 'rgba(168,85,247,0.1)',  color: '#7c3aed' },
    SHIPPED:     { bg: 'rgba(249,115,22,0.1)',  color: '#c2410c' },
    DELIVERED:   { bg: 'rgba(34,197,94,0.1)',   color: '#15803d' },
    RELEASED:    { bg: 'rgba(34,197,94,0.15)',  color: '#15803d' },
    AUTO_RELEASED:{ bg: 'rgba(34,197,94,0.15)', color: '#15803d' },
    DISPUTED:    { bg: 'rgba(239,68,68,0.1)',   color: '#b91c1c' },
    CANCELLED:   { bg: 'rgba(156,163,175,0.1)', color: '#6b7280' },
    REFUNDED:    { bg: 'rgba(239,68,68,0.08)',  color: '#b91c1c' },
};

function StatusBadge({ status }) {
    const s = STATUS_COLORS[status] || { bg: 'rgba(0,0,0,0.05)', color: '#555' };
    return (
        <span style={{
            display: 'inline-block', padding: '0.2rem 0.55rem', borderRadius: '6px',
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3px',
            background: s.bg, color: s.color,
        }}>{status}</span>
    );
}

function DetailDrawer({ tx, onClose }) {
    if (!tx) return null;
    const rows = [
        { icon: <Package size={14} />, label: 'Product', value: tx.product_name },
        { icon: <CreditCard size={14} />, label: 'Total Amount', value: `GHS ${(tx.total_amount / 100).toFixed(2)}` },
        { icon: <CreditCard size={14} />, label: 'Platform Fee', value: `GHS ${(tx.platform_fee / 100).toFixed(2)}` },
        { icon: <CreditCard size={14} />, label: 'Seller Payout', value: tx.seller_payout_amount ? `GHS ${(tx.seller_payout_amount / 100).toFixed(2)}` : '—' },
        { icon: <Phone size={14} />, label: 'Buyer Phone', value: tx.buyer_phone || '—' },
        { icon: <MapPin size={14} />, label: 'Delivery Address', value: tx.delivery_address || '—' },
        { icon: <Calendar size={14} />, label: 'Created', value: new Date(tx.created_at).toLocaleString() },
        { icon: <Calendar size={14} />, label: 'Last Updated', value: new Date(tx.updated_at).toLocaleString() },
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 9999, backdropFilter: 'blur(4px)',
        }} onClick={onClose}>
            <div
                className="card animate-in"
                style={{ width: '100%', maxWidth: 640, maxHeight: '80vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', margin: 0 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Order Details</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace' }}>{tx.order_ref}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <StatusBadge status={tx.status} />
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Seller / Buyer */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ padding: '0.875rem', background: 'var(--bg-alt)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Seller</div>
                        <div style={{ fontWeight: 700 }}>{tx.seller_name}</div>
                    </div>
                    <div style={{ padding: '0.875rem', background: 'var(--bg-alt)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Buyer</div>
                        <div style={{ fontWeight: 700 }}>{tx.buyer_name || '—'}</div>
                        {tx.buyer_phone && <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>{tx.buyer_phone}</div>}
                    </div>
                </div>

                {/* Detail rows */}
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                    {rows.map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)', marginTop: '0.1rem', flexShrink: 0 }}>{r.icon}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', width: 120, flexShrink: 0 }}>{r.label}</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, wordBreak: 'break-word' }}>{r.value}</span>
                        </div>
                    ))}
                </div>

                {/* Track link */}
                <div style={{ marginTop: '1.25rem' }}>
                    <a
                        href={`/track/${tx.order_ref}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-block"
                        style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}
                    >
                        View Buyer Tracking Page ↗
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function AdminTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [sortKey, setSortKey] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');

    useEffect(() => {
        setLoading(true);
        const params = filter ? `?status=${filter}` : '';
        adminApi.get(`/admin/transactions${params}`).then(data => {
            setTransactions(data.transactions || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [filter]);

    // Client-side search
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        let list = q
            ? transactions.filter(tx =>
                (tx.order_ref || '').toLowerCase().includes(q) ||
                (tx.seller_name || '').toLowerCase().includes(q) ||
                (tx.buyer_name || '').toLowerCase().includes(q) ||
                (tx.buyer_phone || '').toLowerCase().includes(q) ||
                (tx.product_name || '').toLowerCase().includes(q)
            )
            : transactions;

        // Sort
        list = [...list].sort((a, b) => {
            let av = a[sortKey], bv = b[sortKey];
            if (sortKey === 'created_at' || sortKey === 'updated_at') {
                av = new Date(av).getTime(); bv = new Date(bv).getTime();
            }
            if (typeof av === 'string') av = av.toLowerCase();
            if (typeof bv === 'string') bv = bv.toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [transactions, search, sortKey, sortDir]);

    // Summary stats for current filtered view
    const summary = useMemo(() => ({
        count: filtered.length,
        volume: filtered.reduce((s, t) => s + (t.total_amount || 0), 0),
        fees: filtered.reduce((s, t) => s + (t.platform_fee || 0), 0),
        disputes: filtered.filter(t => t.status === 'DISPUTED').length,
    }), [filtered]);

    function toggleSort(key) {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    }

    function SortIcon({ col }) {
        if (sortKey !== col) return <ChevronDown size={12} style={{ opacity: 0.3 }} />;
        return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
    }

    function exportCSV() {
        const headers = ['Order Ref', 'Seller', 'Buyer', 'Buyer Phone', 'Product', 'Amount (GHS)', 'Fee (GHS)', 'Payout (GHS)', 'Status', 'Date'];
        const rows = filtered.map(tx => [
            tx.order_ref,
            tx.seller_name,
            tx.buyer_name || '',
            tx.buyer_phone || '',
            `"${(tx.product_name || '').replace(/"/g, '""')}"`,
            (tx.total_amount / 100).toFixed(2),
            (tx.platform_fee / 100).toFixed(2),
            tx.seller_payout_amount ? (tx.seller_payout_amount / 100).toFixed(2) : '',
            tx.status,
            new Date(tx.created_at).toLocaleString(),
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `safedeliver-transactions-${filter || 'all'}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const tabs = ['', 'REQUESTED', 'QUOTED', 'ACCEPTED', 'PAID', 'SHIPPED', 'DELIVERED', 'RELEASED', 'DISPUTED', 'CANCELLED', 'REFUNDED'];
    const tabLabels = { '': 'All', REQUESTED: 'Requested', QUOTED: 'Quoted', ACCEPTED: 'Accepted', PAID: 'Paid', SHIPPED: 'Shipped', DELIVERED: 'Delivered', RELEASED: 'Released', DISPUTED: 'Disputed', CANCELLED: 'Cancelled', REFUNDED: 'Refunded' };

    const thStyle = (col) => ({
        cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
        color: sortKey === col ? 'var(--brand)' : undefined,
    });

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>All Transactions</h1>
                <button
                    onClick={exportCSV}
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    disabled={filtered.length === 0}
                >
                    <Download size={15} /> Export CSV
                </button>
            </div>

            {/* Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Orders', value: summary.count, color: 'var(--brand)' },
                    { label: 'Volume', value: `GHS ${(summary.volume / 100).toFixed(2)}`, color: 'var(--text)' },
                    { label: 'Fees Earned', value: `GHS ${(summary.fees / 100).toFixed(2)}`, color: 'var(--success)' },
                    { label: 'Disputes', value: summary.disputes, color: summary.disputes > 0 ? 'var(--danger)' : 'var(--muted)' },
                ].map(s => (
                    <div key={s.label} style={{ padding: '0.875rem 1rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>{s.label}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Status tabs */}
            <div className="tab-bar" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
                {tabs.map(t => (
                    <button key={t} className={`tab-btn ${filter === t ? 'active' : ''}`} onClick={() => { setFilter(t); setSearch(''); }}>
                        {tabLabels[t]}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input
                    className="form-input"
                    placeholder="Search by order ref, seller, buyer, phone or product…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: '2.5rem', margin: 0 }}
                />
                {search && (
                    <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                        <X size={15} />
                    </button>
                )}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th onClick={() => toggleSort('created_at')} style={thStyle('created_at')}>
                                        Date <SortIcon col="created_at" />
                                    </th>
                                    <th onClick={() => toggleSort('order_ref')} style={thStyle('order_ref')}>
                                        Order Ref <SortIcon col="order_ref" />
                                    </th>
                                    <th onClick={() => toggleSort('seller_name')} style={thStyle('seller_name')}>
                                        Seller <SortIcon col="seller_name" />
                                    </th>
                                    <th>Buyer</th>
                                    <th onClick={() => toggleSort('product_name')} style={thStyle('product_name')}>
                                        Product <SortIcon col="product_name" />
                                    </th>
                                    <th onClick={() => toggleSort('total_amount')} style={thStyle('total_amount')}>
                                        Amount <SortIcon col="total_amount" />
                                    </th>
                                    <th onClick={() => toggleSort('platform_fee')} style={thStyle('platform_fee')}>
                                        Fee <SortIcon col="platform_fee" />
                                    </th>
                                    <th onClick={() => toggleSort('status')} style={thStyle('status')}>
                                        Status <SortIcon col="status" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                                        {search ? `No results for "${search}"` : 'No transactions found'}
                                    </td></tr>
                                ) : filtered.map(tx => (
                                    <tr
                                        key={tx.id}
                                        onClick={() => setSelected(tx)}
                                        style={{ cursor: 'pointer' }}
                                        className="hoverable-row"
                                    >
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{tx.order_ref}</span></td>
                                        <td style={{ fontWeight: 600 }}>{tx.seller_name}</td>
                                        <td>
                                            <div>{tx.buyer_name || '—'}</div>
                                            {tx.buyer_phone && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{tx.buyer_phone}</div>}
                                        </td>
                                        <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.product_name}</td>
                                        <td style={{ fontWeight: 700 }}>GHS {(tx.total_amount / 100).toFixed(2)}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>GHS {(tx.platform_fee / 100).toFixed(2)}</td>
                                        <td><StatusBadge status={tx.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length > 0 && (
                        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--muted)' }}>
                            Showing {filtered.length} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                            {search && <span> matching <strong>"{search}"</strong></span>}
                        </div>
                    )}
                </div>
            )}

            {/* Detail Drawer */}
            <DetailDrawer tx={selected} onClose={() => setSelected(null)} />
        </div>
    );
}
