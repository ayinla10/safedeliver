'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function KYCPage() {
    const [kycData, setKycData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState(null);

    // Upload files state
    const [govIdFile, setGovIdFile] = useState(null);
    const [selfieFile, setSelfieFile] = useState(null);
    const [addressFile, setAddressFile] = useState(null);

    async function fetchKYC() {
        try {
            const data = await api.get('/kyc');
            setKycData(data);
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchKYC(); }, []);

    async function uploadFile(file) {
        const token = localStorage.getItem('sd-token');
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        return data.url;
    }

    async function handleApplyTier2(e) {
        e.preventDefault();
        if (!govIdFile || !selfieFile) return setMsg({ type: 'error', text: 'Both Government ID and Selfie are required.' });
        setSubmitting(true); setUploading(true); setMsg(null);
        try {
            const gov_id_url = await uploadFile(govIdFile);
            const selfie_url = await uploadFile(selfieFile);
            setUploading(false);
            await api.post('/kyc/apply', { target_tier: 2, gov_id_url, selfie_url });
            setMsg({ type: 'success', text: 'Application submitted! Pending admin review.' });
            setGovIdFile(null); setSelfieFile(null);
            await fetchKYC();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setSubmitting(false); setUploading(false);
        }
    }

    async function handleApplyTier3(e) {
        e.preventDefault();
        if (!addressFile) return setMsg({ type: 'error', text: 'Proof of Address document is required.' });
        setSubmitting(true); setUploading(true); setMsg(null);
        try {
            const proof_of_address_url = await uploadFile(addressFile);
            setUploading(false);
            await api.post('/kyc/apply', { target_tier: 3, proof_of_address_url });
            setMsg({ type: 'success', text: 'Application submitted! Pending admin review.' });
            setAddressFile(null);
            await fetchKYC();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setSubmitting(false); setUploading(false);
        }
    }

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    const tier = kycData?.current_tier || 1;
    const app = kycData?.application;
    const limits = kycData?.limits || {};
    const hasPending = app?.status === 'PENDING';
    const wasRejected = app?.status === 'REJECTED';
    const nextTier = tier + 1;

    const tierLabels = { 1: 'Basic', 2: 'Verified', 3: 'Premium' };
    const tierColors = { 1: 'var(--warning)', 2: 'var(--brand)', 3: 'var(--success)' };

    return (
        <div className="animate-in" style={{ maxWidth: 700 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>KYC Verification</h1>

            {msg && (
                <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.5rem' }}>
                    {msg.text}
                </div>
            )}

            {/* Current Tier Badge */}
            <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                    {[1, 2, 3].map(t => (
                        <div key={t} style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.25rem', fontWeight: 700,
                                background: tier >= t ? tierColors[t] : 'var(--bg-color)',
                                color: tier >= t ? '#fff' : 'var(--muted)',
                                border: `2px solid ${tier >= t ? tierColors[t] : 'var(--border)'}`,
                                margin: '0 auto 0.5rem'
                            }}>
                                {tier >= t ? '✓' : t}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: tier >= t ? 'var(--text)' : 'var(--muted)' }}>
                                Tier {t}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{tierLabels[t]}</div>
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: tierColors[tier] }}>
                    Your Current Tier: {tier} ({tierLabels[tier]})
                </div>
            </div>

            {/* Tier Limits */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Your Tier Limits</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--border)' }}>
                        <div className="text-xs text-muted">Max Transaction</div>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem', marginTop: '0.25rem' }}>
                            {limits[`TIER_${tier}_TX_LIMIT`] === '0' ? 'Unlimited' : `GHS ${Number(limits[`TIER_${tier}_TX_LIMIT`] || 0).toLocaleString()}`}
                        </div>
                    </div>
                    <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--border)' }}>
                        <div className="text-xs text-muted">Weekly Withdrawal</div>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem', marginTop: '0.25rem' }}>
                            {limits[`TIER_${tier}_WITHDRAWAL_LIMIT`] === '0' ? 'Unlimited' : `GHS ${Number(limits[`TIER_${tier}_WITHDRAWAL_LIMIT`] || 0).toLocaleString()}`}
                        </div>
                    </div>
                </div>
                {limits[`TIER_${tier}_FEATURES`] && (
                    <div style={{ marginTop: '1rem' }}>
                        <div className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>Features</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {limits[`TIER_${tier}_FEATURES`].split(',').map(f => (
                                <span key={f} style={{
                                    padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem',
                                    background: 'rgba(43,125,233,0.1)', color: 'var(--brand)', fontWeight: 600
                                }}>{f.trim().replace(/_/g, ' ')}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Pending Status */}
            {hasPending && (
                <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--warning)', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                    <h3>Application Pending</h3>
                    <p className="text-sm mt-1">Your Tier {app.target_tier} application is under review. We will notify you once the admin has made a decision.</p>
                    <p className="text-xs text-muted mt-2">Submitted: {new Date(app.created_at).toLocaleString()}</p>
                </div>
            )}

            {/* Rejected Status */}
            {wasRejected && app.target_tier === nextTier && (
                <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
                    <strong>❌ Your Tier {app.target_tier} application was rejected</strong>
                    <p className="text-sm mt-1">Reason: {app.rejection_reason}</p>
                    <p className="text-xs text-muted mt-1">You can resubmit your documents below.</p>
                </div>
            )}

            {/* Tier 2 Application Form */}
            {tier === 1 && !hasPending && (
                <div className="card" style={{ border: '2px solid var(--brand)' }}>
                    <h3 style={{ marginBottom: '0.25rem', color: 'var(--brand)' }}>Upgrade to Tier 2 — Verified</h3>
                    <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
                        Increase your transaction and withdrawal limits by submitting your Government ID and a selfie.
                    </p>
                    <form onSubmit={handleApplyTier2}>
                        <div className="form-group">
                            <label>Government-Issued ID *</label>
                            <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>National ID, Passport, or Voter's Card (JPEG/PNG, max 5MB)</p>
                            <input className="form-input" type="file" accept="image/*,.pdf" onChange={e => setGovIdFile(e.target.files[0])} required />
                        </div>
                        <div className="form-group">
                            <label>Selfie Photo *</label>
                            <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>A clear photo of yourself holding your ID document</p>
                            <input className="form-input" type="file" accept="image/*" onChange={e => setSelfieFile(e.target.files[0])} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                            {uploading ? 'Uploading Documents...' : submitting ? 'Submitting...' : '🔐 Submit for Tier 2 Verification'}
                        </button>
                    </form>
                </div>
            )}

            {/* Tier 3 Application Form */}
            {tier === 2 && !hasPending && (
                <div className="card" style={{ border: '2px solid var(--success)' }}>
                    <h3 style={{ marginBottom: '0.25rem', color: 'var(--success)' }}>Upgrade to Tier 3 — Premium</h3>
                    <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
                        Unlock unlimited transactions and priority support by submitting proof of your business address.
                    </p>
                    <form onSubmit={handleApplyTier3}>
                        <div className="form-group">
                            <label>Proof of Address *</label>
                            <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>Utility bill, bank statement, or business registration (max 5MB)</p>
                            <input className="form-input" type="file" accept="image/*,.pdf" onChange={e => setAddressFile(e.target.files[0])} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                            {uploading ? 'Uploading Document...' : submitting ? 'Submitting...' : '🔐 Submit for Tier 3 Verification'}
                        </button>
                    </form>
                </div>
            )}

            {/* Tier 3 Already Achieved */}
            {tier === 3 && (
                <div className="card text-center" style={{ padding: '2rem', border: '2px solid var(--success)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                    <h3 style={{ color: 'var(--success)' }}>Maximum Tier Achieved!</h3>
                    <p className="text-sm mt-1">You have the highest verification level. All platform features and limits are unlocked.</p>
                </div>
            )}
        </div>
    );
}
