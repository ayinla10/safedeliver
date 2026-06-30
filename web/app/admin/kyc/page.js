'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import {
    Search, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Star, ShoppingBag, TrendingUp,
    AlertTriangle, FileText, X
} from 'lucide-react';

const PAGE_SIZE = 20;

function waitingDays(createdAt) {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
}

function WaitingBadge({ createdAt }) {
    const days = waitingDays(createdAt);
    const color = days >= 7 ? 'var(--danger)' : days >= 3 ? '#f59e0b' : 'var(--brand)';
    const bg = days >= 7 ? 'rgba(239,68,68,0.1)' : days >= 3 ? 'rgba(245,158,11,0.1)' : 'rgba(43,125,233,0.1)';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
            color, background: bg
        }}>
            <Clock size={11} /> {days === 0 ? 'Today' : `${days}d waiting`}
        </span>
    );
}

function TierBadge({ tier }) {
    const colors = { 1: '#6b7280', 2: '#3b82f6', 3: '#8b5cf6', 4: '#f59e0b' };
    return (
        <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 12,
            fontSize: '0.7rem', fontWeight: 700,
            background: `${colors[tier] || '#6b7280'}20`, color: colors[tier] || '#6b7280',
            border: `1px solid ${colors[tier] || '#6b7280'}40`
        }}>Tier {tier}</span>
    );
}

function RejectModal({ app, onConfirm, onClose }) {
    const [reason, setReason] = useState('');
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '100%', maxWidth: 480, margin: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Reject KYC Application</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                    Seller: <strong>{app.seller_name}</strong> — Tier {app.target_tier - 1} → {app.target_tier}
                </p>
                <p className="text-xs text-muted" style={{ marginBottom: '1rem' }}>
                    The seller will receive an SMS with this rejection reason.
                </p>
                <div className="form-group">
                    <label>Rejection Reason *</label>
                    <textarea
                        className="form-input"
                        rows={3}
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="e.g. Document was blurry. Please resubmit a clear photo of your National ID."
                        style={{ resize: 'vertical' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn" onClick={onClose}>Cancel</button>
                    <button
                        className="btn"
                        style={{ background: 'var(--danger)', color: '#fff' }}
                        disabled={!reason.trim()}
                        onClick={() => onConfirm(reason.trim())}
                    >Reject &amp; Notify</button>
                </div>
            </div>
        </div>
    );
}

function ApplicationCard({ app, onAction }) {
    const fromTier = app.target_tier - 1;
    const toTier = app.target_tier;
    const revenue = parseFloat(app.total_revenue || 0);
    const score = parseFloat(app.seller_score || 0);

    return (
        <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{app.seller_name}</span>
                        <TierBadge tier={fromTier} />
                        <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>→</span>
                        <TierBadge tier={toTier} />
                        <WaitingBadge createdAt={app.created_at} />
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                        {app.seller_email} · {app.seller_phone}
                    </div>
                </div>
                {app.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            className="btn"
                            style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)', padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => onAction(app, 'APPROVE')}
                        >
                            <CheckCircle2 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Approve
                        </button>
                        <button
                            className="btn"
                            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => onAction(app, 'REJECT')}
                        >
                            <XCircle size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Reject
                        </button>
                    </div>
                )}
                {app.status !== 'PENDING' && (
                    <span style={{
                        padding: '0.35rem 0.8rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                        background: app.status === 'APPROVED' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: app.status === 'APPROVED' ? '#16a34a' : 'var(--danger)'
                    }}>{app.status}</span>
                )}
            </div>

            {/* Seller context strip */}
            <div style={{
                display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
                padding: '0.6rem 0.75rem', borderRadius: 8,
                background: 'var(--bg-alt)', marginBottom: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={13} color="#f59e0b" />
                    <span className="text-xs"><strong>{(score / 10).toFixed(1)}</strong>/10</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShoppingBag size={13} color="var(--brand)" />
                    <span className="text-xs"><strong>{app.total_orders || 0}</strong> orders</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={13} color="#16a34a" />
                    <span className="text-xs"><strong>GHS {revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> revenue</span>
                </div>
                {(app.gov_id_url || app.selfie_url || app.proof_of_address_url) && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {app.gov_id_url && <a href={app.gov_id_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--brand)', textDecoration: 'none' }}><FileText size={13} /> Gov ID</a>}
                        {app.selfie_url && <a href={app.selfie_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--brand)', textDecoration: 'none' }}><FileText size={13} /> Selfie</a>}
                        {app.proof_of_address_url && <a href={app.proof_of_address_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--brand)', textDecoration: 'none' }}><FileText size={13} /> Proof of Address</a>}
                    </div>
                )}
            </div>

            {/* Dates */}
            <div className="text-xs text-muted">
                Submitted: {new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' '}at {new Date(app.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                {app.reviewed_at && (
                    <span style={{ marginLeft: '1rem' }}>
                        Reviewed: {new Date(app.reviewed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                )}
                {app.rejection_reason && (
                    <div style={{ marginTop: 4, color: 'var(--danger)' }}>Reason: {app.rejection_reason}</div>
                )}
            </div>
        </div>
    );
}

export default function KYCReviewPage() {
    const [apps, setApps] = useState([]);
    const [total, setTotal] = useState(0);
    const [summary, setSummary] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [page, setPage] = useState(0);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [actionMsg, setActionMsg] = useState('');

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
            if (statusFilter) params.set('status', statusFilter);
            if (search) params.set('search', search);
            const data = await adminApi.get(`/admin/kyc-applications?${params}`);
            setApps(data.applications || []);
            setTotal(typeof data.total === 'number' ? data.total : (data.applications || []).length);
            if (data.summary) setSummary(data.summary);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, search]);

    useEffect(() => { load(); }, [load]);

    function handleSearch(e) {
        e.preventDefault();
        setSearch(searchInput);
        setPage(0);
    }

    function handleStatusFilter(s) {
        setStatusFilter(s);
        setPage(0);
    }

    async function handleAction(app, action) {
        if (action === 'REJECT') { setRejectTarget(app); return; }
        await executeAction(app.id, 'APPROVE', null);
    }

    async function executeAction(appId, action, rejectionReason) {
        setRejectTarget(null);
        try {
            const body = { action };
            if (rejectionReason) body.rejection_reason = rejectionReason;
            const res = await adminApi.patch(`/admin/kyc-applications/${appId}`, body);
            setActionMsg(res.message || 'Done');
            // Optimistic removal from list
            setApps(prev => prev.filter(a => a.id !== appId));
            setTotal(prev => Math.max(0, prev - 1));
            setSummary(prev => ({
                ...prev,
                PENDING: Math.max(0, prev.PENDING - 1),
                [action === 'APPROVE' ? 'APPROVED' : 'REJECTED']: (prev[action === 'APPROVE' ? 'APPROVED' : 'REJECTED'] || 0) + 1
            }));
            setTimeout(() => setActionMsg(''), 4000);
        } catch (err) {
            setActionMsg('Error: ' + err.message);
        }
    }

    const StatCard = ({ label, value, icon, color }) => (
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: 10, background: `${color}20` }}>{icon}</div>
            <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
                <div className="text-xs text-muted">{label}</div>
            </div>
        </div>
    );

    const filterTabs = [
        { key: 'PENDING', label: 'Pending', color: '#f59e0b' },
        { key: 'APPROVED', label: 'Approved', color: '#16a34a' },
        { key: 'REJECTED', label: 'Rejected', color: 'var(--danger)' },
        { key: '', label: 'All', color: 'var(--brand)' },
    ];

    const grandTotal = (summary.PENDING || 0) + (summary.APPROVED || 0) + (summary.REJECTED || 0);

    return (
        <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>KYC Review</h1>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>Review seller identity verification applications</p>

            {/* Summary bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <StatCard label="Pending" value={summary.PENDING || 0} color="#f59e0b" icon={<Clock size={18} color="#f59e0b" />} />
                <StatCard label="Approved" value={summary.APPROVED || 0} color="#16a34a" icon={<CheckCircle2 size={18} color="#16a34a" />} />
                <StatCard label="Rejected" value={summary.REJECTED || 0} color="var(--danger)" icon={<XCircle size={18} color="var(--danger)" />} />
                <StatCard label="Total" value={grandTotal} color="var(--brand)" icon={<FileText size={18} color="var(--brand)" />} />
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input
                        className="form-input"
                        style={{ paddingLeft: 32, margin: 0 }}
                        placeholder="Search by name, email or phone..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-primary">Search</button>
                {search && (
                    <button type="button" className="btn" onClick={() => { setSearch(''); setSearchInput(''); setPage(0); }}>Clear</button>
                )}
            </form>

            {/* Status filter tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {filterTabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => handleStatusFilter(t.key)}
                        style={{
                            padding: '0.4rem 1rem', borderRadius: 20, border: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.82rem',
                            background: statusFilter === t.key ? t.color : 'var(--bg-alt)',
                            color: statusFilter === t.key ? '#fff' : 'var(--text)',
                            transition: 'all 0.15s'
                        }}
                    >
                        {t.label} ({t.key ? (summary[t.key] || 0) : grandTotal})
                    </button>
                ))}
            </div>

            {/* Action feedback */}
            {actionMsg && (
                <div className={`alert ${actionMsg.startsWith('Error') ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '1rem' }}>
                    {actionMsg}
                </div>
            )}

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            {loading ? (
                <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>
            ) : apps.length === 0 ? (
                <div className="card flex-center" style={{ padding: '3rem', flexDirection: 'column', gap: '0.5rem' }}>
                    <AlertTriangle size={32} color="var(--muted)" />
                    <p className="text-muted">No applications found</p>
                </div>
            ) : (
                <>
                    <div className="text-xs text-muted" style={{ marginBottom: '0.75rem' }}>
                        {total} application{total !== 1 ? 's' : ''} found
                    </div>
                    {apps.map(app => (
                        <ApplicationCard key={app.id} app={app} onAction={handleAction} />
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span className="text-xs text-muted">
                                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
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

            {/* Reject modal */}
            {rejectTarget && (
                <RejectModal
                    app={rejectTarget}
                    onClose={() => setRejectTarget(null)}
                    onConfirm={(reason) => executeAction(rejectTarget.id, 'REJECT', reason)}
                />
            )}
        </div>
    );
}
