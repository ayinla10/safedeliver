'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
    Users, ChevronLeft, CheckCircle2, AlertCircle, ShieldAlert, Eye,
    Search, X, ChevronsLeft, ChevronsRight, ChevronRight,
    Phone, Mail, MapPin, CreditCard, Star, Calendar, ShoppingBag,
    TrendingUp, Clock, Ban, RefreshCw, Building2,
    RotateCcw, LockOpen, MapPinOff, ShieldOff
} from 'lucide-react';

const PAGE_SIZE = 25;

const TIER_COLORS = { 1: 'var(--warning)', 2: 'var(--brand)', 3: 'var(--success)' };
const TIER_LABELS = { 1: 'Basic', 2: 'Verified', 3: 'Premium' };

const KYC_CONFIG = {
    APPROVED: { color: 'var(--success)', bg: 'rgba(34,197,94,0.1)',  icon: <CheckCircle2 size={13} /> },
    PENDING:  { color: 'var(--warning)', bg: 'rgba(234,179,8,0.1)',  icon: <AlertCircle size={13} /> },
    REJECTED: { color: 'var(--danger)',  bg: 'rgba(239,68,68,0.1)',  icon: <AlertCircle size={13} /> },
    SUSPENDED:{ color: 'var(--danger)',  bg: 'rgba(239,68,68,0.1)',  icon: <ShieldAlert size={13} /> },
};

function KycBadge({ status }) {
    const c = KYC_CONFIG[status] || KYC_CONFIG.PENDING;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: c.bg, color: c.color }}>
            {c.icon} {status || 'PENDING'}
        </span>
    );
}

function TierBadge({ tier }) {
    return (
        <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: TIER_COLORS[tier] || 'var(--muted)', color: '#fff' }}>
            T{tier} {TIER_LABELS[tier] || ''}
        </span>
    );
}

function StatMini({ icon, label, value, color }) {
    return (
        <div style={{ padding: '0.875rem 1rem', background: 'var(--bg-alt)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
                <span style={{ color: color || 'var(--muted)' }}>{icon}</span>{label}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: color || 'var(--text)' }}>{value}</div>
        </div>
    );
}

function PaginationBar({ page, totalPages, setPage }) {
    if (totalPages <= 1) return null;
    return (
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
    );
}

// ── Detail View ──────────────────────────────────────────────
function SellerDetail({ seller, onBack, onAction }) {
    const [kycApps, setKycApps] = useState([]);
    const [stats, setStats] = useState(null);
    const [msg, setMsg] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [confirm, setConfirm] = useState(null);

    useEffect(() => {
        adminApi.get(`/admin/kyc-applications?seller_id=${seller.id}`).then(data => {
            const apps = data.applications || (Array.isArray(data) ? data : []);
            setKycApps(apps);
        }).catch(() => {});
        adminApi.get(`/admin/sellers/${seller.id}/stats`).then(setStats).catch(() => {});
    }, [seller.id]);

    async function handleSuspend() {
        const action = seller.is_active !== false ? 'suspend' : 'reactivate';
        setConfirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Seller?`,
            message: `Are you sure you want to ${action} ${seller.full_name}?`,
            variant: action === 'suspend' ? 'danger' : 'info',
            confirmLabel: `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await adminApi.patch(`/admin/sellers/${seller.id}`, { is_active: seller.is_active === false });
                    setMsg({ type: 'success', text: `Seller ${action}d successfully.` });
                    onAction();
                } catch (err) { setMsg({ type: 'error', text: err.message }); }
                finally { setActionLoading(false); }
            },
        });
    }

    async function handleKycApprove(id) {
        setConfirm({
            title: 'Approve KYC Application?',
            message: 'This will upgrade the seller\'s tier and grant them higher transaction limits.',
            variant: 'info',
            confirmLabel: 'Yes, Approve',
            onConfirm: async () => {
                setActionLoading(true); setMsg(null);
                try {
                    await adminApi.patch(`/admin/kyc-applications/${id}`, { action: 'APPROVE' });
                    setMsg({ type: 'success', text: 'Application approved. Seller tier upgraded.' });
                    const data = await adminApi.get(`/admin/kyc-applications?seller_id=${seller.id}`);
                    setKycApps(data.applications || (Array.isArray(data) ? data : []));
                } catch (err) { setMsg({ type: 'error', text: err.message }); }
                finally { setActionLoading(false); }
            },
        });
    }

    async function handleUnlock() {
        setConfirm({
            title: 'Unlock Account?',
            message: `Remove the login lock on ${seller.full_name}'s account and reset failed login attempts to 0.`,
            variant: 'info',
            confirmLabel: 'Yes, Unlock',
            onConfirm: async () => {
                setActionLoading(true); setMsg(null);
                try {
                    await adminApi.post(`/admin/sellers/${seller.id}/unlock`);
                    setMsg({ type: 'success', text: 'Account unlocked. Seller can now log in.' });
                } catch (err) { setMsg({ type: 'error', text: err.message }); }
                finally { setActionLoading(false); }
            },
        });
    }

    async function handleResetScore() {
        setConfirm({
            title: 'Reset Trust Score?',
            message: `This will reset ${seller.full_name}'s trust score back to the platform default.`,
            variant: 'warning',
            confirmLabel: 'Yes, Reset Score',
            onConfirm: async () => {
                setActionLoading(true); setMsg(null);
                try {
                    const res = await adminApi.post(`/admin/sellers/${seller.id}/reset-score`);
                    setMsg({ type: 'success', text: res.message || 'Trust score reset.' });
                    onAction(); // refresh parent list
                } catch (err) { setMsg({ type: 'error', text: err.message }); }
                finally { setActionLoading(false); }
            },
        });
    }

    async function handleResetLocation() {
        setConfirm({
            title: 'Reset Location Counter?',
            message: `This will give ${seller.full_name} back their full 2 location changes for this year.`,
            variant: 'info',
            confirmLabel: 'Yes, Reset Counter',
            onConfirm: async () => {
                setActionLoading(true); setMsg(null);
                try {
                    await adminApi.post(`/admin/sellers/${seller.id}/reset-location`);
                    setMsg({ type: 'success', text: 'Location counter reset. Seller can change location again.' });
                } catch (err) { setMsg({ type: 'error', text: err.message }); }
                finally { setActionLoading(false); }
            },
        });
    }

    async function handleResetKyc() {
        setConfirm({
            title: 'Reset KYC Status?',
            message: `This will set ${seller.full_name}'s KYC back to PENDING and downgrade their tier to 1. Any approved KYC applications will be cancelled.`,
            variant: 'danger',
            confirmLabel: 'Yes, Reset KYC',
            onConfirm: async () => {
                setActionLoading(true); setMsg(null);
                try {
                    await adminApi.post(`/admin/sellers/${seller.id}/reset-kyc`);
                    setMsg({ type: 'success', text: 'KYC reset to PENDING. Tier downgraded to 1.' });
                    onAction();
                } catch (err) { setMsg({ type: 'error', text: err.message }); }
                finally { setActionLoading(false); }
            },
        });
    }

    async function handleKycReject(id) {
        if (!rejectReason.trim()) return setMsg({ type: 'error', text: 'Rejection reason is required.' });
        setActionLoading(true); setMsg(null);
        try {
            await adminApi.patch(`/admin/kyc-applications/${id}`, { action: 'REJECT', rejection_reason: rejectReason });
            setMsg({ type: 'success', text: 'Application rejected.' });
            setRejectModal(null); setRejectReason('');
            const data = await adminApi.get(`/admin/kyc-applications?seller_id=${seller.id}`);
            setKycApps(data.applications || (Array.isArray(data) ? data : []));
        } catch (err) { setMsg({ type: 'error', text: err.message }); }
        finally { setActionLoading(false); }
    }

    const scoreOver10 = ((seller.seller_score || 100) / 10).toFixed(1);
    const isSuspended = seller.is_active === false;
    const pendingApps = kycApps.filter(a => a.status === 'PENDING');

    return (
        <>
        {confirm && <ConfirmDialog {...confirm} onClose={() => setConfirm(null)} />}
        <div className="animate-in" style={{ maxWidth: 860 }}>
            {/* Back */}
            <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ChevronLeft size={16} /> Back to Sellers
            </button>

            {msg && (
                <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {msg.text}
                </div>
            )}

            {/* Seller Header Card */}
            <div className="card" style={{ marginBottom: '1.25rem', borderLeft: `4px solid ${isSuspended ? 'var(--danger)' : 'var(--brand)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{seller.full_name}</h2>
                            {isSuspended && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
                                    <Ban size={11} /> SUSPENDED
                                </span>
                            )}
                        </div>
                        {seller.business_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                                <Building2 size={14} /> {seller.business_name}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--muted)' }}><Mail size={14} />{seller.email}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--muted)' }}><Phone size={14} />{seller.phone}</span>
                            {(seller.city || seller.region) && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--muted)' }}><MapPin size={14} />{seller.city || seller.region}</span>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <TierBadge tier={seller.kyc_tier || 1} />
                        <KycBadge status={seller.kyc_status} />
                    </div>
                </div>

                {/* Joined + Last Login */}
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                        <Calendar size={13} /> Joined {new Date(seller.created_at).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                        <Clock size={13} /> Last login: {seller.last_login_at ? new Date(seller.last_login_at).toLocaleString() : 'Never'}
                    </span>
                </div>
            </div>

            {/* MoMo Payout Number */}
            <div className="card" style={{ marginBottom: '1.25rem', borderLeft: `4px solid ${seller.momo_number ? 'var(--success)' : 'var(--danger)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CreditCard size={20} color={seller.momo_number ? 'var(--success)' : 'var(--danger)'} />
                        <div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>MoMo Payout Number</div>
                            {seller.momo_number
                                ? <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--success)' }}>{seller.momo_number}</div>
                                : <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--danger)' }}>⚠ Not set — seller cannot be paid out</div>
                            }
                        </div>
                    </div>
                    {seller.momo_number && (
                        <button onClick={() => { navigator.clipboard.writeText(seller.momo_number); }} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                            Copy Number
                        </button>
                    )}
                </div>
            </div>

            {/* Order Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <StatMini icon={<ShoppingBag size={14} />} label="Total Orders" value={stats?.total_orders ?? '—'} color="var(--brand)" />
                <StatMini icon={<TrendingUp size={14} />}  label="Completed"    value={stats?.completed_orders ?? '—'} color="var(--success)" />
                <StatMini icon={<Clock size={14} />}       label="Active"       value={stats?.active_orders ?? '—'} color="#0369a1" />
                <StatMini icon={<AlertCircle size={14} />} label="Disputed"     value={stats?.disputed_orders ?? '—'} color={stats?.disputed_orders > 0 ? 'var(--danger)' : 'var(--muted)'} />
                <StatMini icon={<Star size={14} />}        label="Trust Score"  value={`${scoreOver10}/10`} color={(seller.seller_score || 100) < 50 ? 'var(--danger)' : 'var(--success)'} />
            </div>

            {/* Revenue */}
            {stats && (
                <div className="card" style={{ marginBottom: '1.25rem', background: 'rgba(43,125,233,0.03)', border: '1px solid rgba(43,125,233,0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Total Revenue Earned</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
                                GHS {(stats.total_revenue / 100).toFixed(2)}
                            </div>
                        </div>
                        <TrendingUp size={36} style={{ opacity: 0.15, color: 'var(--success)' }} />
                    </div>
                </div>
            )}

            {/* KYC Applications */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    KYC Applications
                    {pendingApps.length > 0 && (
                        <span style={{ padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(234,179,8,0.15)', color: '#b45309' }}>
                            {pendingApps.length} pending
                        </span>
                    )}
                </h3>

                {/* Legacy doc */}
                {seller.kyc_document_url && kycApps.length === 0 && (
                    <div style={{ marginBottom: '1rem', padding: '0.875rem', background: 'var(--bg-alt)', borderRadius: '8px' }}>
                        <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>Legacy KYC Document</p>
                        <a href={seller.kyc_document_url} target="_blank" rel="noreferrer">
                            <img src={seller.kyc_document_url} alt="KYC" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 6, border: '1px solid var(--border)' }} />
                        </a>
                    </div>
                )}

                {kycApps.length === 0 && !seller.kyc_document_url && (
                    <p className="text-sm text-muted">No KYC applications submitted yet.</p>
                )}

                {kycApps.map(app => (
                    <div key={app.id} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '0.875rem', background: 'var(--bg-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Tier {app.target_tier - 1} → Tier {app.target_tier}</span>
                            </div>
                            <KycBadge status={app.status} />
                        </div>

                        {/* Documents */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.875rem' }}>
                            {[
                                { url: app.gov_id_url, label: 'Government ID' },
                                { url: app.selfie_url, label: 'Selfie with ID' },
                                { url: app.proof_of_address_url, label: 'Proof of Address' },
                            ].filter(d => d.url).map(d => (
                                <div key={d.label} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                    <a href={d.url} target="_blank" rel="noreferrer">
                                        <img src={d.url} alt={d.label} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                                    </a>
                                    <div style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)', background: 'var(--bg-alt)' }}>{d.label}</div>
                                </div>
                            ))}
                        </div>

                        {app.rejection_reason && (
                            <div className="alert alert-danger" style={{ padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}>
                                <strong>Rejected:</strong> {app.rejection_reason}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="text-xs text-muted">
                                Submitted {new Date(app.created_at).toLocaleString()}
                                {app.reviewed_at && <> · Reviewed {new Date(app.reviewed_at).toLocaleString()}</>}
                            </span>
                            {app.status === 'PENDING' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-primary btn-sm" onClick={() => handleKycApprove(app.id)} disabled={actionLoading}>Approve</button>
                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setRejectModal(app.id)} disabled={actionLoading}>Reject</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Admin Actions */}
            <div className="card">
                <h3 style={{ marginBottom: '0.25rem' }}>Administrative Actions</h3>
                <p className="text-xs text-muted" style={{ marginBottom: '1.25rem' }}>All actions are logged in the audit trail.</p>

                {/* Account Status */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>Account Status</div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {isSuspended ? (
                            <button className="btn btn-primary btn-sm" onClick={handleSuspend} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <RefreshCw size={14} /> Reactivate Seller
                            </button>
                        ) : (
                            <button className="btn btn-ghost btn-sm" onClick={handleSuspend} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}>
                                <Ban size={14} /> Suspend Seller
                            </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={handleUnlock} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <LockOpen size={14} /> Unlock Account
                        </button>
                    </div>
                </div>

                {/* Reset Actions */}
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>Reset</div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={handleResetScore} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <RotateCcw size={14} /> Reset Trust Score
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={handleResetLocation} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <MapPinOff size={14} /> Reset Location Counter
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={handleResetKyc} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}>
                            <ShieldOff size={14} /> Reset KYC to Pending
                        </button>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {rejectModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }} onClick={() => setRejectModal(null)}>
                    <div className="card" style={{ maxWidth: 480, width: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '0.25rem', color: 'var(--danger)' }}>Reject Application</h3>
                        <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>The seller will see this reason and can resubmit.</p>
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label>Reason for rejection</label>
                            <textarea className="form-input" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. ID image is blurry, selfie does not match..." style={{ minHeight: 100 }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleKycReject(rejectModal)} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                            </button>
                            <button className="btn btn-ghost" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}

// ── Sellers List ─────────────────────────────────────────────
export default function AdminSellers() {
    const [sellers, setSellers] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const load = useCallback(() => {
        setLoading(true);
        const offset = (page - 1) * PAGE_SIZE;
        const params = new URLSearchParams({ limit: PAGE_SIZE, offset });
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);
        adminApi.get(`/admin/sellers?${params}`).then(data => {
            const rows = data.sellers || data;
            setSellers(Array.isArray(rows) ? rows : []);
            setTotal(typeof data.total === 'number' ? data.total : (Array.isArray(rows) ? rows.length : 0));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [page, search, statusFilter]);

    useEffect(() => { load(); }, [load]);

    function changeStatus(s) { setStatusFilter(s); setPage(1); }
    function submitSearch(e) { e.preventDefault(); setSearch(searchInput); setPage(1); }
    function clearSearch() { setSearchInput(''); setSearch(''); setPage(1); }

    if (selected) {
        return (
            <SellerDetail
                seller={selected}
                onBack={() => { setSelected(null); load(); }}
                onAction={() => { load(); setSelected(null); }}
            />
        );
    }

    return (
        <div className="animate-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Users size={26} color="var(--brand)" /> Sellers
                </h1>
            </div>

            {/* Status filter tabs */}
            <div className="tab-bar" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                    { val: '',          label: 'All' },
                    { val: 'ACTIVE',    label: 'Active' },
                    { val: 'SUSPENDED', label: 'Suspended' },
                    { val: 'PENDING',   label: 'KYC Pending' },
                ].map(({ val, label }) => (
                    <button key={val} className={`tab-btn ${statusFilter === val ? 'active' : ''}`} onClick={() => changeStatus(val)}>{label}</button>
                ))}
            </div>

            {/* Search */}
            <form onSubmit={submitSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input className="form-input" placeholder="Search by name, email, phone or business…" value={searchInput} onChange={e => setSearchInput(e.target.value)} style={{ paddingLeft: '2.5rem', margin: 0 }} />
                    {searchInput && (
                        <button type="button" onClick={clearSearch} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><X size={15} /></button>
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
                                    <th>Seller</th>
                                    <th>Contact</th>
                                    <th>Tier</th>
                                    <th>KYC</th>
                                    <th>Trust</th>
                                    <th>Revenue</th>
                                    <th>Orders</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sellers.length === 0 ? (
                                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                                        {search ? `No sellers matching "${search}"` : 'No sellers found'}
                                    </td></tr>
                                ) : sellers.map(s => (
                                    <tr key={s.id} onClick={() => setSelected(s)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{s.full_name}</div>
                                            {s.business_name && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{s.business_name}</div>}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>{s.email}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{s.phone}</div>
                                        </td>
                                        <td><TierBadge tier={s.kyc_tier || 1} /></td>
                                        <td><KycBadge status={s.kyc_status} /></td>
                                        <td style={{ fontWeight: 700, color: (s.seller_score || 100) < 50 ? 'var(--danger)' : 'var(--success)' }}>
                                            {((s.seller_score || 100) / 10).toFixed(1)}/10
                                        </td>
                                        <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                            GHS {(s.total_revenue / 100).toFixed(2)}
                                        </td>
                                        <td style={{ fontSize: '0.875rem' }}>{s.total_orders || 0}</td>
                                        <td>
                                            {s.is_active === false
                                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--danger)' }}><Ban size={12} /> Suspended</span>
                                                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)' }}><CheckCircle2 size={12} /> Active</span>
                                            }
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.8rem' }}>{new Date(s.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td>
                                            <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Eye size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            {total === 0 ? 'No sellers found' : `Showing ${((page - 1) * PAGE_SIZE) + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} seller${total !== 1 ? 's' : ''}`}
                        </span>
                        <PaginationBar page={page} totalPages={totalPages} setPage={setPage} />
                    </div>
                </div>
            )}
        </div>
    );
}
