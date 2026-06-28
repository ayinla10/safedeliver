'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Users, ChevronLeft, CheckCircle2, AlertCircle, ShieldAlert, ArrowRight, Eye, MoreHorizontal } from 'lucide-react';

export default function AdminSellers() {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [kycApps, setKycApps] = useState([]);
    const [msg, setMsg] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    function load() {
        adminApi.get('/admin/sellers').then(data => { setSellers(data); setLoading(false); }).catch(() => setLoading(false));
    }
    useEffect(load, []);

    async function openDetail(seller) {
        setSelected(seller);
        setMsg(null);
        try {
            const apps = await adminApi.get(`/admin/kyc-applications`);
            setKycApps(apps.filter(a => a.seller_id === seller.id));
        } catch { setKycApps([]); }
    }

    async function handleSuspend(id, currentActive) {
        const action = currentActive ? 'suspend' : 'reactivate';
        if (!window.confirm(`Are you sure you want to ${action} this seller?`)) return;
        setActionLoading(true);
        try {
            await adminApi.patch(`/admin/sellers/${id}/kyc`, {
                status: currentActive ? 'SUSPENDED' : 'APPROVED',
                tier: selected?.kyc_tier || 1,
                notes: `Seller ${action}d by admin`
            });
            setMsg({ type: 'success', text: `Seller ${action}d successfully.` });
            load();
            if (selected) setSelected({ ...selected, is_active: !currentActive, kyc_status: currentActive ? 'SUSPENDED' : 'APPROVED' });
        } catch (err) { setMsg({ type: 'error', text: err.message }); }
        finally { setActionLoading(false); }
    }

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    const tierLabel = t => t === 3 ? 'Premium' : t === 2 ? 'Verified' : 'Basic';
    const tierColor = t => t === 3 ? 'var(--success)' : t === 2 ? 'var(--brand)' : 'var(--warning)';

    // Detail View
    if (selected) {
        return (
            <div className="animate-in" style={{ maxWidth: 800 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ChevronLeft size={16} /> Back to Sellers
                </button>

                {msg && (
                    <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {msg.text}
                    </div>
                )}

                {/* Seller Header */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ margin: 0 }}>{selected.full_name}</h2>
                            <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>{selected.email} | {selected.phone}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{
                                display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '999px',
                                fontSize: '0.75rem', fontWeight: 700,
                                background: tierColor(selected.kyc_tier || 1),
                                color: '#fff'
                            }}>
                                Tier {selected.kyc_tier || 1} — {tierLabel(selected.kyc_tier || 1)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <div className="text-xs text-muted">Trust Score</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: (selected.seller_score || 100) < 50 ? 'var(--danger)' : 'var(--success)', marginTop: '0.25rem' }}>
                            {selected.seller_score ?? 100}
                        </div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <div className="text-xs text-muted">KYC Status</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', color: selected.kyc_status === 'APPROVED' ? 'var(--success)' : selected.kyc_status === 'SUSPENDED' ? 'var(--danger)' : 'var(--warning)' }}>
                            {selected.kyc_status || 'PENDING'}
                        </div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <div className="text-xs text-muted">Joined</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '0.5rem' }}>
                            {new Date(selected.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {/* Uploaded Documents */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Uploaded Documents</h3>
                    {selected.kyc_document_url ? (
                        <div style={{ marginBottom: '1rem' }}>
                            <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>Legacy KYC Document</p>
                            <a href={selected.kyc_document_url} target="_blank" rel="noreferrer">
                                <img src={selected.kyc_document_url} alt="KYC Document" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid var(--border)' }} />
                            </a>
                        </div>
                    ) : null}

                    {kycApps.length > 0 ? kycApps.map(app => (
                        <div key={app.id} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1rem', background: 'var(--bg-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ fontWeight: 600 }}>Tier {app.target_tier} Application</span>
                                <span style={{
                                    padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600,
                                    background: app.status === 'PENDING' ? 'rgba(234,179,8,0.15)' : app.status === 'APPROVED' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: app.status === 'PENDING' ? 'var(--warning)' : app.status === 'APPROVED' ? 'var(--success)' : 'var(--danger)'
                                }}>{app.status}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                {app.gov_id_url && (
                                    <div>
                                        <p className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Government ID</p>
                                        <a href={app.gov_id_url} target="_blank" rel="noreferrer">
                                            <img src={app.gov_id_url} alt="Gov ID" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                                        </a>
                                    </div>
                                )}
                                {app.selfie_url && (
                                    <div>
                                        <p className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Selfie</p>
                                        <a href={app.selfie_url} target="_blank" rel="noreferrer">
                                            <img src={app.selfie_url} alt="Selfie" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                                        </a>
                                    </div>
                                )}
                                {app.proof_of_address_url && (
                                    <div>
                                        <p className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Proof of Address</p>
                                        <a href={app.proof_of_address_url} target="_blank" rel="noreferrer">
                                            <img src={app.proof_of_address_url} alt="Address Proof" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {app.rejection_reason && (
                                <div className="alert alert-danger" style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem' }}>
                                    <strong>Rejected:</strong> {app.rejection_reason}
                                </div>
                            )}
                            <div className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
                                Submitted {new Date(app.created_at).toLocaleString()}
                                {app.reviewed_at && <> | Reviewed {new Date(app.reviewed_at).toLocaleString()}</>}
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-muted">No KYC applications submitted yet.</p>
                    )}
                </div>

                {/* Admin Actions */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Administrative Actions</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {selected.is_active !== false ? (
                            <button className="btn btn-danger btn-sm" onClick={() => handleSuspend(selected.id, true)} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : 'Suspend Seller'}
                            </button>
                        ) : (
                            <button className="btn btn-primary btn-sm" onClick={() => handleSuspend(selected.id, false)} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : 'Reactivate Seller'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Sellers List
    return (
        <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Users size={28} color="var(--brand)" /> Sellers ({sellers.length})
            </h1>
            <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Score</th>
                                <th>Tier</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sellers.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No sellers registered yet.</td></tr>
                            ) : sellers.map(s => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                                    <td>
                                        <div className="text-sm">{s.email}</div>
                                        <div className="text-xs text-muted">{s.phone}</div>
                                    </td>
                                    <td style={{ fontWeight: 700, color: (s.seller_score || 100) < 50 ? 'var(--danger)' : 'var(--brand)' }}>
                                        {s.seller_score ?? 100}
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px',
                                            fontSize: '0.7rem', fontWeight: 700,
                                            background: tierColor(s.kyc_tier || 1), color: '#fff'
                                        }}>
                                            T{s.kyc_tier || 1}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: 600,
                                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                                            color: s.kyc_status === 'APPROVED' ? 'var(--success)' : s.kyc_status === 'SUSPENDED' ? 'var(--danger)' : 'var(--warning)'
                                        }}>
                                            {s.kyc_status === 'APPROVED' ? <CheckCircle2 size={14} /> : s.kyc_status === 'SUSPENDED' ? <ShieldAlert size={14} /> : <AlertCircle size={14} />}
                                            {s.kyc_status || 'PENDING'}
                                        </span>
                                    </td>
                                    <td className="text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => openDetail(s)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Eye size={14} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
