'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Scale, Search, X, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PAGE_SIZE = 20;

export default function AdminDisputes() {
    const [disputes, setDisputes] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(null);
    const [notes, setNotes] = useState('');
    const [actionError, setActionError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    function load() {
        setLoading(true);
        const offset = (page - 1) * PAGE_SIZE;
        const params = new URLSearchParams({ limit: PAGE_SIZE, offset });
        if (search) params.set('search', search);
        adminApi.get(`/admin/disputes?${params}`).then(data => {
            const rows = data.disputes || data;
            setDisputes(Array.isArray(rows) ? rows : []);
            setTotal(typeof data.total === 'number' ? data.total : (Array.isArray(rows) ? rows.length : 0));
            setLoading(false);
        }).catch(() => setLoading(false));
    }

    useEffect(() => { load(); }, [page, search]);

    function submitSearch(e) { e.preventDefault(); setSearch(searchInput); setPage(1); }
    function clearSearch() { setSearchInput(''); setSearch(''); setPage(1); }

    async function resolve(id, decision) {
        setActionLoading(true); setActionError(null);
        try {
            await adminApi.patch(`/admin/disputes/${id}/resolve`, { decision, notes });
            setResolving(null); setNotes('');
            load();
        } catch (err) { setActionError(err.message); }
        finally { setActionLoading(false); }
    }

    return (
        <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>Disputes</h1>

            {/* Search */}
            <form onSubmit={submitSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input
                        className="form-input"
                        placeholder="Search by order ref, buyer or seller…"
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

            {loading ? (
                <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>
            ) : disputes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <Scale size={40} style={{ opacity: 0.15, marginBottom: '0.75rem', color: 'var(--muted)' }} />
                    <p className="text-sm text-muted">{search ? `No disputes matching "${search}"` : 'No open disputes'}</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {disputes.map(d => (
                            <div key={d.id} className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <span className="text-mono" style={{ fontWeight: 600 }}>{d.order_ref}</span>
                                        <span className="status-badge DISPUTED" style={{ marginLeft: '0.75rem' }}>Disputed</span>
                                    </div>
                                    <span className="text-sm text-muted">{new Date(d.updated_at).toLocaleDateString()}</span>
                                </div>
                                <div className="grid-3" style={{ marginBottom: '0.75rem' }}>
                                    <div><span className="text-xs text-muted">Buyer</span><div style={{ fontWeight: 500 }}>{d.buyer_name}</div></div>
                                    <div><span className="text-xs text-muted">Seller</span><div style={{ fontWeight: 500 }}>{d.seller_name}</div></div>
                                    <div><span className="text-xs text-muted">Amount</span><div style={{ fontWeight: 600 }}>GHS {(d.total_amount / 100).toFixed(2)}</div></div>
                                </div>
                                <div style={{ background: 'var(--warning-bg,rgba(234,179,8,0.08))', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Dispute Reason</div>
                                    <div style={{ fontSize: '0.9375rem' }}>{d.dispute_reason || 'No reason provided'}</div>
                                </div>

                                {actionError && resolving === d.id && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                                        <AlertCircle size={16} /> {actionError}
                                    </div>
                                )}

                                {resolving === d.id ? (
                                    <div>
                                        <textarea
                                            className="form-input"
                                            placeholder="Admin notes (optional)…"
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            style={{ marginBottom: '0.75rem', minHeight: '80px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-primary btn-sm" onClick={() => resolve(d.id, 'RELEASE')} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <CheckCircle2 size={14} /> {actionLoading ? 'Processing…' : 'Release to Seller'}
                                            </button>
                                            <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }} onClick={() => resolve(d.id, 'REFUND')} disabled={actionLoading}>
                                                {actionLoading ? 'Processing…' : 'Refund Buyer'}
                                            </button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => { setResolving(null); setNotes(''); setActionError(null); }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className="btn btn-primary btn-sm" onClick={() => { setResolving(d.id); setActionError(null); }}>
                                        Resolve Dispute
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            Showing {total === 0 ? 0 : ((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} dispute{total !== 1 ? 's' : ''}
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
                </>
            )}
        </div>
    );
}
