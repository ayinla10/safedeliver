'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import { ShieldCheck, ArrowRight, AlertCircle, Search, CheckCircle2, XCircle, Eye } from 'lucide-react';

export default function AdminKYCReview() {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    async function fetchApps() {
        try {
            const data = await adminApi.get(`/admin/kyc-applications?status=${filter}`);
            setApps(data);
        } catch (err) { setMsg({ type: 'error', text: err.message }); }
        finally { setLoading(false); }
    }

    useEffect(() => { setLoading(true); fetchApps(); }, [filter]);

    async function handleApprove(id) {
        if (!window.confirm('Approve this KYC application and upgrade the seller?')) return;
        setActionLoading(true); setMsg(null);
        try {
            await adminApi.patch(`/admin/kyc-applications/${id}`, { action: 'APPROVE' });
            setMsg({ type: 'success', text: 'Application approved. Seller tier upgraded.' });
            await fetchApps();
        } catch (err) { setMsg({ type: 'error', text: err.message }); }
        finally { setActionLoading(false); }
    }

    async function handleReject(id) {
        if (!rejectReason.trim()) return setMsg({ type: 'error', text: 'A rejection reason is required.' });
        setActionLoading(true); setMsg(null);
        try {
            await adminApi.patch(`/admin/kyc-applications/${id}`, { action: 'REJECT', rejection_reason: rejectReason });
            setMsg({ type: 'success', text: 'Application rejected.' });
            setRejectModal(null); setRejectReason('');
            await fetchApps();
        } catch (err) { setMsg({ type: 'error', text: err.message }); }
        finally { setActionLoading(false); }
    }

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    const statusConfig = {
        PENDING: { bg: 'rgba(234,179,8,0.1)', color: '#b45309', border: 'rgba(234,179,8,0.3)', icon: <AlertCircle size={14} /> },
        APPROVED: { bg: 'rgba(34,197,94,0.1)', color: '#15803d', border: 'rgba(34,197,94,0.3)', icon: <CheckCircle2 size={14} /> },
        REJECTED: { bg: 'rgba(239,68,68,0.1)', color: '#b91c1c', border: 'rgba(239,68,68,0.3)', icon: <XCircle size={14} /> },
    };

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <ShieldCheck size={28} color="var(--brand)" /> KYC Applications
                </h1>
                <span className="text-sm text-muted">{apps.length} {filter.toLowerCase()} application{apps.length !== 1 ? 's' : ''}</span>
            </div>

            {msg && (
                <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {msg.text}
                </div>
            )}

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
                    <button key={s} onClick={() => setFilter(s)} style={{
                        padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid',
                        fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: '0.2s',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: filter === s ? statusConfig[s].bg : 'transparent',
                        color: filter === s ? statusConfig[s].color : 'var(--muted)',
                        borderColor: filter === s ? statusConfig[s].border : 'var(--border)',
                    }}>
                        {statusConfig[s].icon} {s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {apps.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', opacity: 0.3 }}>
                        <Search size={48} />
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>No Results</div>
                    <p className="text-sm text-muted">There are no {filter.toLowerCase()} applications at this time.</p>
                </div>
            )}

            {/* Application Cards */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                {apps.map(app => (
                    <div key={app.id} className="card" style={{
                        borderLeft: `4px solid ${statusConfig[app.status]?.color || 'var(--border)'}`,
                        transition: '0.2s'
                    }}>
                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>{app.seller_name}</h3>
                                <p className="text-xs text-muted" style={{ marginTop: '0.15rem' }}>{app.seller_email} | {app.seller_phone}</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                <span style={{
                                    padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                                    background: statusConfig[app.status]?.bg,
                                    color: statusConfig[app.status]?.color,
                                    border: `1px solid ${statusConfig[app.status]?.border}`
                                }}>{statusConfig[app.status]?.icon} {app.status}</span>
                                <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    Tier {app.current_tier} <ArrowRight size={12} /> Tier {app.target_tier}
                                </span>
                            </div>
                        </div>

                        {/* Document Previews */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                            {app.gov_id_url && (
                                <div style={{ background: 'var(--bg-color)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                    <a href={app.gov_id_url} target="_blank" rel="noreferrer">
                                        <img src={app.gov_id_url} alt="Government ID" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                                    </a>
                                    <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)' }}>Government ID</div>
                                </div>
                            )}
                            {app.selfie_url && (
                                <div style={{ background: 'var(--bg-color)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                    <a href={app.selfie_url} target="_blank" rel="noreferrer">
                                        <img src={app.selfie_url} alt="Selfie" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                                    </a>
                                    <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)' }}>Selfie with ID</div>
                                </div>
                            )}
                            {app.proof_of_address_url && (
                                <div style={{ background: 'var(--bg-color)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                    <a href={app.proof_of_address_url} target="_blank" rel="noreferrer">
                                        <img src={app.proof_of_address_url} alt="Address Proof" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                                    </a>
                                    <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)' }}>Proof of Address</div>
                                </div>
                            )}
                        </div>

                        {/* Rejection Reason */}
                        {app.rejection_reason && (
                            <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.25rem' }}>REJECTION REASON</div>
                                <p className="text-sm" style={{ margin: 0 }}>{app.rejection_reason}</p>
                            </div>
                        )}

                        {/* Meta + Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="text-xs text-muted">
                                Submitted {new Date(app.created_at).toLocaleString()}
                                {app.reviewed_at && <> | Reviewed {new Date(app.reviewed_at).toLocaleString()}</>}
                            </div>

                            {app.status === 'PENDING' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-primary btn-sm" onClick={() => handleApprove(app.id)} disabled={actionLoading}>
                                        Approve
                                    </button>
                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setRejectModal(app.id)} disabled={actionLoading}>
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Reject Modal */}
            {rejectModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)'
                }} onClick={() => setRejectModal(null)}>
                    <div className="card" style={{ maxWidth: 480, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '0.25rem', color: 'var(--danger)' }}>Reject Application</h3>
                        <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>The seller will see this reason and can resubmit their documents.</p>
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label>Reason for rejection</label>
                            <textarea className="form-input" value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="e.g. ID image is blurry, selfie does not match ID..."
                                style={{ minHeight: 100 }} required />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleReject(rejectModal)} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                            </button>
                            <button className="btn btn-ghost" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
