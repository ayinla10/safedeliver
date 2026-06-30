'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import {
    ShieldCheck, Search, Download, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Activity, User, Settings, AlertTriangle,
    Copy, Check
} from 'lucide-react';

const PAGE_SIZE = 25;

// ── Action colour mapping ──────────────────────────────────────────────────
function getActionStyle(action = '') {
    const a = action.toUpperCase();
    if (/APPROVE|REACTIVATE|RELEASE|AUTO_RELEASE|REGISTER|VERIFY/.test(a))
        return { bg: 'rgba(34,197,94,0.12)', color: '#16a34a' };
    if (/REJECT|SUSPEND|REFUND|CANCEL|DELETE|BLOCK|LOCK/.test(a))
        return { bg: 'rgba(239,68,68,0.12)', color: '#dc2626' };
    if (/DISPUTE|ESCALATE|FLAG/.test(a))
        return { bg: 'rgba(245,158,11,0.12)', color: '#b45309' };
    if (/LOGIN|LOGOUT|REFRESH/.test(a))
        return { bg: 'rgba(99,102,241,0.12)', color: '#4f46e5' };
    if (/UPDATE|SETTING|BULK/.test(a))
        return { bg: 'rgba(14,165,233,0.12)', color: '#0284c7' };
    return { bg: 'rgba(100,116,139,0.12)', color: '#475569' };
}

// ── Metadata pill renderer ─────────────────────────────────────────────────
function MetaPills({ metadata }) {
    if (!metadata || Object.keys(metadata).length === 0) return <span className="text-muted">—</span>;
    return (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Object.entries(metadata).map(([k, v]) => (
                <span key={k} style={{
                    display: 'inline-flex', gap: 3, alignItems: 'center',
                    padding: '1px 7px', borderRadius: 12,
                    background: 'var(--bg-alt)', border: '1px solid var(--border)',
                    fontSize: '0.7rem', maxWidth: 220
                }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{k}:</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {String(v).length > 40 ? String(v).slice(0, 40) + '…' : String(v)}
                    </span>
                </span>
            ))}
        </div>
    );
}

// ── Copy-on-click IP ──────────────────────────────────────────────────────
function CopyIP({ ip }) {
    const [copied, setCopied] = useState(false);
    if (!ip) return <span className="text-muted">—</span>;
    function copy() {
        navigator.clipboard.writeText(ip).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }
    return (
        <button onClick={copy} title="Copy IP" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--muted)',
            padding: 0
        }}>
            {ip}
            {copied ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
        </button>
    );
}

// ── Export CSV ─────────────────────────────────────────────────────────────
function exportCSV(logs) {
    const headers = ['Timestamp', 'Actor Type', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'IP', 'Metadata'];
    const rows = logs.map(l => [
        new Date(l.created_at).toISOString(),
        l.actor_type,
        l.actor_name || l.actor_id || '',
        l.action,
        l.entity_type || '',
        l.entity_id || '',
        l.ip_address || '',
        l.metadata ? JSON.stringify(l.metadata) : ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [summary, setSummary] = useState({ total: 0, admin_count: 0, seller_count: 0, system_count: 0, today_count: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [actorType, setActorType] = useState('');
    const [entityType, setEntityType] = useState('');
    const [page, setPage] = useState(0);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
            if (search) params.set('search', search);
            if (actorType) params.set('actor_type', actorType);
            if (entityType) params.set('entity_type', entityType);
            const data = await adminApi.get(`/admin/audit-logs?${params}`);
            setLogs(data.logs || []);
            setTotal(typeof data.total === 'number' ? data.total : (data.logs || []).length);
            if (data.summary) setSummary(data.summary);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [page, search, actorType, entityType]);

    useEffect(() => { load(); }, [load]);

    function handleSearch(e) {
        e.preventDefault();
        setSearch(searchInput);
        setPage(0);
    }

    function setFilter(setter) {
        return (v) => { setter(v); setPage(0); };
    }

    // ── Stat card ────────────────────────────────────────────────────────
    const StatCard = ({ label, value, icon, color }) => (
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: 10, background: `${color}20` }}>{icon}</div>
            <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{Number(value).toLocaleString()}</div>
                <div className="text-xs text-muted">{label}</div>
            </div>
        </div>
    );

    const actorTabs = [
        { key: '', label: 'All' },
        { key: 'ADMIN', label: 'Admin' },
        { key: 'SELLER', label: 'Seller' },
        { key: 'SYSTEM', label: 'System' },
    ];

    const entityTabs = [
        { key: '', label: 'All Entities' },
        { key: 'SELLER', label: 'Seller' },
        { key: 'TRANSACTION', label: 'Transaction' },
        { key: 'SYSTEM', label: 'System' },
    ];

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.25rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Audit Logs</h1>
                <button
                    className="btn"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
                    onClick={() => exportCSV(logs)}
                    disabled={logs.length === 0}
                >
                    <Download size={15} /> Export CSV
                </button>
            </div>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
                Immutable record of every admin action, login, and system event.
            </p>

            {/* Summary bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <StatCard label="Today" value={summary.today_count || 0} color="var(--brand)"
                    icon={<Activity size={18} color="var(--brand)" />} />
                <StatCard label="Admin Actions" value={summary.admin_count || 0} color="#4f46e5"
                    icon={<ShieldCheck size={18} color="#4f46e5" />} />
                <StatCard label="Seller Events" value={summary.seller_count || 0} color="#0284c7"
                    icon={<User size={18} color="#0284c7" />} />
                <StatCard label="System Events" value={summary.system_count || 0} color="#475569"
                    icon={<Settings size={18} color="#475569" />} />
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input
                        className="form-input"
                        style={{ paddingLeft: 32, margin: 0 }}
                        placeholder="Search by action, IP address, entity ID..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-primary">Search</button>
                {search && (
                    <button type="button" className="btn" onClick={() => { setSearch(''); setSearchInput(''); setPage(0); }}>Clear</button>
                )}
            </form>

            {/* Filter rows */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <span className="text-xs text-muted" style={{ alignSelf: 'center', minWidth: 60 }}>Actor:</span>
                {actorTabs.map(t => (
                    <button key={t.key} onClick={() => setFilter(setActorType)(t.key)} style={{
                        padding: '0.3rem 0.85rem', borderRadius: 20, border: 'none', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.8rem',
                        background: actorType === t.key ? 'var(--brand)' : 'var(--bg-alt)',
                        color: actorType === t.key ? '#fff' : 'var(--text)',
                        transition: 'all 0.15s'
                    }}>{t.label}</button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <span className="text-xs text-muted" style={{ alignSelf: 'center', minWidth: 60 }}>Entity:</span>
                {entityTabs.map(t => (
                    <button key={t.key} onClick={() => setFilter(setEntityType)(t.key)} style={{
                        padding: '0.3rem 0.85rem', borderRadius: 20, border: 'none', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.8rem',
                        background: entityType === t.key ? '#475569' : 'var(--bg-alt)',
                        color: entityType === t.key ? '#fff' : 'var(--text)',
                        transition: 'all 0.15s'
                    }}>{t.label}</button>
                ))}
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            {loading ? (
                <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>
            ) : logs.length === 0 ? (
                <div className="card flex-center" style={{ padding: '3rem', flexDirection: 'column', gap: '0.5rem' }}>
                    <AlertTriangle size={32} color="var(--muted)" />
                    <p className="text-muted">No audit logs found</p>
                </div>
            ) : (
                <>
                    <div className="text-xs text-muted" style={{ marginBottom: '0.75rem' }}>
                        {total.toLocaleString()} log{total !== 1 ? 's' : ''} found
                        {(search || actorType || entityType) && ' (filtered)'}
                    </div>

                    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ minWidth: 110 }}>Timestamp</th>
                                    <th style={{ minWidth: 140 }}>Actor</th>
                                    <th style={{ minWidth: 180 }}>Action</th>
                                    <th style={{ minWidth: 130 }}>Entity</th>
                                    <th style={{ minWidth: 200 }}>Metadata</th>
                                    <th style={{ minWidth: 120 }}>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => {
                                    const { bg, color } = getActionStyle(log.action);
                                    const actorLabel = log.actor_name || (log.actor_type === 'SYSTEM' ? 'System' : null);
                                    return (
                                        <tr key={log.id}>
                                            {/* Timestamp */}
                                            <td>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-xs text-muted">
                                                    {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                            </td>

                                            {/* Actor */}
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <span style={{
                                                        display: 'inline-block', padding: '1px 6px', borderRadius: 10,
                                                        fontSize: '0.65rem', fontWeight: 700,
                                                        background: log.actor_type === 'ADMIN' ? 'rgba(79,70,229,0.12)' : log.actor_type === 'SELLER' ? 'rgba(2,132,199,0.12)' : 'rgba(71,85,105,0.12)',
                                                        color: log.actor_type === 'ADMIN' ? '#4f46e5' : log.actor_type === 'SELLER' ? '#0284c7' : '#475569'
                                                    }}>{log.actor_type}</span>
                                                </div>
                                                {actorLabel && (
                                                    <div style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: 2 }}>{actorLabel}</div>
                                                )}
                                                {log.actor_email && (
                                                    <div className="text-xs text-muted">{log.actor_email}</div>
                                                )}
                                                {!actorLabel && log.actor_id && (
                                                    <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>
                                                        {String(log.actor_id).slice(0, 8)}…
                                                    </div>
                                                )}
                                            </td>

                                            {/* Action */}
                                            <td>
                                                <span style={{
                                                    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                                                    fontSize: '0.72rem', fontWeight: 700, background: bg, color
                                                }}>{log.action}</span>
                                            </td>

                                            {/* Entity */}
                                            <td>
                                                {log.entity_type && (
                                                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{log.entity_type}</div>
                                                )}
                                                {log.entity_id && (
                                                    <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>
                                                        {String(log.entity_id).slice(0, 8)}…
                                                    </div>
                                                )}
                                                {!log.entity_type && <span className="text-muted">—</span>}
                                            </td>

                                            {/* Metadata */}
                                            <td><MetaPills metadata={log.metadata} /></td>

                                            {/* IP */}
                                            <td><CopyIP ip={log.ip_address} /></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span className="text-xs text-muted">
                                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
                            </span>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button className="btn" onClick={() => setPage(0)} disabled={page === 0}><ChevronsLeft size={14} /></button>
                                <button className="btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}><ChevronLeft size={14} /></button>
                                {Array.from({ length: totalPages }, (_, i) => i)
                                    .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 2)
                                    .reduce((acc, i, idx, arr) => {
                                        if (idx > 0 && i - arr[idx - 1] > 1) acc.push('...');
                                        acc.push(i);
                                        return acc;
                                    }, [])
                                    .map((item, idx) => item === '...'
                                        ? <span key={`e${idx}`} style={{ padding: '0 4px', alignSelf: 'center', color: 'var(--muted)' }}>…</span>
                                        : <button key={item} className="btn"
                                            style={page === item ? { background: 'var(--brand)', color: '#fff' } : {}}
                                            onClick={() => setPage(item)}
                                          >{item + 1}</button>
                                    )
                                }
                                <button className="btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}><ChevronRight size={14} /></button>
                                <button className="btn" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}><ChevronsRight size={14} /></button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
