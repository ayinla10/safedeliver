'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import {
    MessageSquare, Search, X, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Mail, Phone, Inbox, CheckCircle2, Eye
} from 'lucide-react';

const PAGE_SIZE = 20;

function EnquiryModal({ enquiry, onClose, onMarkRead }) {
    const [marking, setMarking] = useState(false);

    async function markRead() {
        if (enquiry.is_read) return;
        setMarking(true);
        try {
            await adminApi.patch(`/admin/contact-enquiries/${enquiry.id}/read`, {});
            onMarkRead(enquiry.id);
        } catch (_) {}
        finally { setMarking(false); }
    }

    // Auto-mark as read when opened
    useEffect(() => { markRead(); }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }} onClick={onClose}>
            <div className="card animate-in" style={{ maxWidth: 560, width: '90%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Enquiry</div>
                        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{enquiry.subject || '(No Subject)'}</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {enquiry.is_read
                            ? <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={13} /> Read</span>
                            : <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309' }}>Unread</span>
                        }
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><X size={20} /></button>
                    </div>
                </div>

                {/* Sender Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-alt)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>From</div>
                        <div style={{ fontWeight: 700 }}>{enquiry.full_name || '—'}</div>
                        {enquiry.user_type && <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.15rem' }}>{enquiry.user_type}</div>}
                    </div>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-alt)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Received</div>
                        <div style={{ fontSize: '0.85rem' }}>{enquiry.created_at ? new Date(enquiry.created_at).toLocaleString() : '—'}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    {enquiry.email && (
                        <a href={`mailto:${enquiry.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--brand)', textDecoration: 'none' }}>
                            <Mail size={14} />{enquiry.email}
                        </a>
                    )}
                    {enquiry.phone && (
                        <a href={`tel:${enquiry.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--brand)', textDecoration: 'none' }}>
                            <Phone size={14} />{enquiry.phone}
                        </a>
                    )}
                </div>

                {/* Message */}
                <div style={{ background: 'var(--bg-alt)', padding: '1rem', borderRadius: '8px', lineHeight: 1.7, fontSize: '0.925rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {enquiry.message || '(No message)'}
                </div>
            </div>
        </div>
    );
}

export default function AdminEnquiries() {
    const [enquiries, setEnquiries] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [readFilter, setReadFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        setLoading(true);
        const offset = (page - 1) * PAGE_SIZE;
        const params = new URLSearchParams({ limit: PAGE_SIZE, offset });
        if (readFilter !== '') params.set('read', readFilter);
        if (search) params.set('search', search);
        adminApi.get(`/admin/contact-enquiries?${params}`).then(data => {
            const rows = data.enquiries || data;
            setEnquiries(Array.isArray(rows) ? rows : []);
            setTotal(typeof data.total === 'number' ? data.total : (Array.isArray(rows) ? rows.length : 0));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [page, readFilter, search]);

    function changeFilter(val) { setReadFilter(val); setPage(1); }
    function submitSearch(e) { e.preventDefault(); setSearch(searchInput); setPage(1); }
    function clearSearch() { setSearchInput(''); setSearch(''); setPage(1); }

    function handleMarkRead(id) {
        setEnquiries(prev => prev.map(e => e.id === id ? { ...e, is_read: true } : e));
        if (selected?.id === id) setSelected(prev => ({ ...prev, is_read: true }));
    }

    const unreadCount = enquiries.filter(e => !e.is_read).length;

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <MessageSquare size={26} color="var(--brand)" /> Contact Enquiries
                </h1>
                {unreadCount > 0 && (
                    <span style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(234,179,8,0.15)', color: '#b45309' }}>
                        {unreadCount} unread on this page
                    </span>
                )}
            </div>

            {/* Filter tabs */}
            <div className="tab-bar" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                    { val: '',      label: 'All' },
                    { val: 'false', label: 'Unread' },
                    { val: 'true',  label: 'Read' },
                ].map(({ val, label }) => (
                    <button key={val} className={`tab-btn ${readFilter === val ? 'active' : ''}`} onClick={() => changeFilter(val)}>{label}</button>
                ))}
            </div>

            {/* Search */}
            <form onSubmit={submitSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input
                        className="form-input"
                        placeholder="Search by name, email, subject or message…"
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
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    {enquiries.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                            <Inbox size={40} style={{ opacity: 0.18, marginBottom: '0.75rem' }} />
                            <p className="text-sm">{search ? `No results for "${search}"` : 'No enquiries found'}</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Name</th>
                                        <th>Contact</th>
                                        <th>Subject</th>
                                        <th>Preview</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enquiries.map((e, i) => (
                                        <tr
                                            key={e.id || i}
                                            style={{ cursor: 'pointer', fontWeight: !e.is_read ? 700 : 400 }}
                                            onClick={() => setSelected(e)}
                                        >
                                            <td>
                                                <div style={{ fontSize: '0.85rem' }}>{e.created_at ? new Date(e.created_at).toLocaleDateString() : '—'}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{e.created_at ? new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: !e.is_read ? 700 : 600 }}>{e.full_name || '—'}</div>
                                                {e.user_type && <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{e.user_type}</div>}
                                            </td>
                                            <td>
                                                {e.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--muted)' }}><Mail size={12} />{e.email}</div>}
                                                {e.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.1rem' }}><Phone size={12} />{e.phone}</div>}
                                            </td>
                                            <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{e.subject || '—'}</td>
                                            <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--muted)' }}>
                                                {e.message || '—'}
                                            </td>
                                            <td>
                                                {e.is_read
                                                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)' }}><CheckCircle2 size={12} /> Read</span>
                                                    : <span style={{ display: 'inline-block', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(234,179,8,0.12)', color: '#b45309' }}>Unread</span>
                                                }
                                            </td>
                                            <td>
                                                <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                                                    <Eye size={13} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer + Pagination */}
                    {enquiries.length > 0 && (
                        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                {total === 0 ? 'No enquiries' : `Showing ${((page - 1) * PAGE_SIZE) + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} enquir${total !== 1 ? 'ies' : 'y'}`}
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

            {/* Detail Modal */}
            {selected && (
                <EnquiryModal
                    enquiry={selected}
                    onClose={() => setSelected(null)}
                    onMarkRead={handleMarkRead}
                />
            )}
        </div>
    );
}
