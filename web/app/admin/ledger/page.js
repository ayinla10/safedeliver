'use client';
import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Search, Download, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Lock, CheckCircle2, Undo2, Banknote, ChevronUp, ChevronDown } from 'lucide-react';

const PAGE_SIZE = 25;

const ENTRY_STYLES = {
    HOLD:    { bg: 'rgba(168,85,247,0.1)',  color: '#7c3aed', icon: <Lock size={11} />,         label: 'HOLD' },
    RELEASE: { bg: 'rgba(34,197,94,0.12)',  color: '#15803d', icon: <CheckCircle2 size={11} />, label: 'RELEASE' },
    REFUND:  { bg: 'rgba(239,68,68,0.1)',   color: '#b91c1c', icon: <Undo2 size={11} />,        label: 'REFUND' },
    FEE:     { bg: 'rgba(234,179,8,0.1)',   color: '#b45309', icon: <Banknote size={11} />,     label: 'FEE' },
};

function EntryBadge({ type }) {
    const s = ENTRY_STYLES[type] || { bg: 'rgba(0,0,0,0.05)', color: '#555', icon: null, label: type };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.2rem 0.6rem', borderRadius: '6px',
            fontSize: '0.7rem', fontWeight: 700, background: s.bg, color: s.color,
        }}>{s.icon}{s.label}</span>
    );
}

export default function AdminLedger() {
    const [entries, setEntries] = useState([]);
    const [total, setTotal] = useState(0);
    const [globalSummary, setGlobalSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [sortKey, setSortKey] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        setLoading(true);
        const offset = (page - 1) * PAGE_SIZE;
        const params = new URLSearchParams({ limit: PAGE_SIZE, offset });
        if (filter) params.set('type', filter);
        if (search) params.set('search', search);
        adminApi.get(`/admin/ledger?${params}`).then(data => {
            const rows = data.entries || data;
            setEntries(Array.isArray(rows) ? rows : []);
            setTotal(typeof data.total === 'number' ? data.total : (Array.isArray(rows) ? rows.length : 0));
            if (data.summary) setGlobalSummary(data.summary);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [filter, search, page]);

    function changeFilter(f) { setFilter(f); setPage(1); }
    function submitSearch(e) { e.preventDefault(); setSearch(searchInput); setPage(1); }
    function clearSearch() { setSearchInput(''); setSearch(''); setPage(1); }

    // Client-side sort
    const sorted = useMemo(() => {
        return [...entries].sort((a, b) => {
            let av = a[sortKey], bv = b[sortKey];
            if (sortKey === 'created_at') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
            if (typeof av === 'string') av = av.toLowerCase();
            if (typeof bv === 'string') bv = bv.toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [entries, sortKey, sortDir]);

    function toggleSort(key) {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    }

    function SortIcon({ col }) {
        if (sortKey !== col) return <ChevronDown size={12} style={{ opacity: 0.3 }} />;
        return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
    }

    // Use backend global summary if available, else fall back to page totals
    const summary = useMemo(() => {
        if (globalSummary) return {
            holds:    globalSummary.total_held,
            releases: globalSummary.total_released,
            refunds:  globalSummary.total_refunded,
            fees:     globalSummary.total_fees,
        };
        return {
            holds:    entries.filter(e => e.entry_type === 'HOLD').reduce((s, e) => s + (e.amount_ghs || 0), 0),
            releases: entries.filter(e => e.entry_type === 'RELEASE').reduce((s, e) => s + (e.amount_ghs || 0), 0),
            refunds:  entries.filter(e => e.entry_type === 'REFUND').reduce((s, e) => s + (e.amount_ghs || 0), 0),
            fees:     entries.filter(e => e.entry_type === 'FEE').reduce((s, e) => s + (e.amount_ghs || 0), 0),
        };
    }, [entries, globalSummary]);

    function exportCSV() {
        const headers = ['Type', 'Order Ref', 'Amount (GHS)', 'Reference', 'Note', 'Date'];
        const rows = sorted.map(e => [
            e.entry_type,
            e.order_ref,
            (e.amount_ghs / 100).toFixed(2),
            e.reference || '',
            `"${(e.note || '').replace(/"/g, '""')}"`,
            new Date(e.created_at).toLocaleString(),
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `safedeliver-ledger-${filter || 'all'}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const thStyle = col => ({
        cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
        color: sortKey === col ? 'var(--brand)' : undefined,
    });

    return (
        <div className="animate-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Escrow Ledger</h1>
                <button onClick={exportCSV} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} disabled={sorted.length === 0}>
                    <Download size={15} /> Export CSV
                </button>
            </div>

            {/* Summary bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Held',     value: summary.holds,    color: '#7c3aed',          icon: <Lock size={14} /> },
                    { label: 'Released', value: summary.releases,  color: 'var(--success)',   icon: <CheckCircle2 size={14} /> },
                    { label: 'Refunded', value: summary.refunds,   color: 'var(--danger)',    icon: <Undo2 size={14} /> },
                    { label: 'Fees',     value: summary.fees,      color: 'var(--warning)',   icon: <Banknote size={14} /> },
                ].map(s => (
                    <div key={s.label} style={{ padding: '0.875rem 1rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
                            <span style={{ color: s.color }}>{s.icon}</span>{s.label}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color }}>GHS {(s.value / 100).toFixed(2)}</div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="tab-bar" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                    { val: '',        label: 'All',      icon: null },
                    { val: 'HOLD',    label: 'Holds',    icon: <Lock size={13} /> },
                    { val: 'RELEASE', label: 'Releases', icon: <CheckCircle2 size={13} /> },
                    { val: 'REFUND',  label: 'Refunds',  icon: <Undo2 size={13} /> },
                    { val: 'FEE',     label: 'Fees',     icon: <Banknote size={13} /> },
                ].map(({ val, label, icon }) => (
                    <button key={val} className={`tab-btn ${filter === val ? 'active' : ''}`} onClick={() => changeFilter(val)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {icon}{label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <form onSubmit={submitSearch} style={{ position: 'relative', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input
                        className="form-input"
                        placeholder="Search by order ref…"
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
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th onClick={() => toggleSort('created_at')} style={thStyle('created_at')}>Date <SortIcon col="created_at" /></th>
                                    <th onClick={() => toggleSort('entry_type')} style={thStyle('entry_type')}>Type <SortIcon col="entry_type" /></th>
                                    <th onClick={() => toggleSort('order_ref')} style={thStyle('order_ref')}>Order Ref <SortIcon col="order_ref" /></th>
                                    <th onClick={() => toggleSort('amount_ghs')} style={thStyle('amount_ghs')}>Amount <SortIcon col="amount_ghs" /></th>
                                    <th>Reference</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                                        {search ? `No results for "${search}"` : 'No ledger entries yet'}
                                    </td></tr>
                                ) : sorted.map((e, i) => (
                                    <tr key={e.id || i}>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{new Date(e.created_at).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td><EntryBadge type={e.entry_type} /></td>
                                        <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{e.order_ref}</span></td>
                                        <td style={{ fontWeight: 700, color: e.entry_type === 'REFUND' ? 'var(--danger)' : e.entry_type === 'RELEASE' ? 'var(--success)' : 'var(--text)' }}>
                                            GHS {(e.amount_ghs / 100).toFixed(2)}
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--muted)' }}>{e.reference || '—'}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.note || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer + Pagination */}
                    <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            {search
                                ? `${sorted.length} result${sorted.length !== 1 ? 's' : ''} on this page for "${search}"`
                                : `Showing ${total === 0 ? 0 : ((page - 1) * PAGE_SIZE) + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} entr${total !== 1 ? 'ies' : 'y'}`
                            }
                        </span>
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <button onClick={() => setPage(1)} disabled={page === 1} title="First" style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex' }}><ChevronsLeft size={15} /></button>
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} title="Prev" style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex' }}><ChevronLeft size={15} /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                    .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                                    .map((p, i) => p === '...'
                                        ? <span key={`e${i}`} style={{ padding: '0 0.3rem', color: 'var(--muted)', fontSize: '0.8rem' }}>…</span>
                                        : <button key={p} onClick={() => setPage(p)} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid', fontSize: '0.8rem', fontWeight: p === page ? 700 : 400, cursor: 'pointer', background: p === page ? 'var(--brand)' : 'none', color: p === page ? '#fff' : 'var(--text)', borderColor: p === page ? 'var(--brand)' : 'var(--border)' }}>{p}</button>
                                    )}
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} title="Next" style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, display: 'flex' }}><ChevronRight size={15} /></button>
                                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Last" style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, display: 'flex' }}><ChevronsRight size={15} /></button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
