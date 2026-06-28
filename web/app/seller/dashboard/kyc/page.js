'use client';
import { useState, useEffect, useRef } from 'react';
import { CheckCircle, CreditCard, Wallet, Upload, Lock, Info, Trophy, Clock } from 'lucide-react';
import { api } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function KYCPage() {
    const [kycData, setKycData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState(null);

    const [govIdFile, setGovIdFile] = useState(null);
    const [selfieFile, setSelfieFile] = useState(null);
    const [addressFile, setAddressFile] = useState(null);
    const [dragging, setDragging] = useState(null); // 'govid' | 'selfie' | 'address'

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
        } finally { setSubmitting(false); setUploading(false); }
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
        } finally { setSubmitting(false); setUploading(false); }
    }

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    const tier = kycData?.current_tier || 1;
    const app = kycData?.application;
    const limits = kycData?.limits || {};
    const hasPending = app?.status === 'PENDING';
    const wasRejected = app?.status === 'REJECTED';
    const nextTier = tier + 1;
    const tierLabels = { 1: 'Basic', 2: 'Verified', 3: 'Premium' };

    const txLimit = limits[`TIER_${tier}_TX_LIMIT`];
    const withdrawLimit = limits[`TIER_${tier}_WITHDRAWAL_LIMIT`];
    const features = limits[`TIER_${tier}_FEATURES`] ? limits[`TIER_${tier}_FEATURES`].split(',').map(f => f.trim().replace(/_/g, ' ')) : [];

    return (
        <div className="animate-in" style={{ maxWidth: 480, margin: '0 auto', paddingBottom: '6rem' }}>

            {msg && (
                <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.25rem' }}>
                    {msg.text}
                </div>
            )}

            {/* ── Verification Status Card ── */}
            <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: 'var(--card-shadow)',
            }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 0.375rem', color: 'var(--text)' }}>Verification Status</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
                    Complete tiers to unlock higher limits and premium features.
                </p>

                {/* Current tier pill */}
                <div style={{
                    display: 'inline-block',
                    background: 'rgba(255,107,0,0.1)',
                    color: '#FF6B00',
                    border: '1px solid rgba(255,107,0,0.25)',
                    borderRadius: 20,
                    padding: '0.35rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginBottom: '1.5rem',
                }}>
                    Your Current Tier: {tier} ({tierLabels[tier]})
                </div>

                {/* Tier stepper */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0 }}>
                    {[1, 2, 3].map((t, i) => {
                        const done = tier >= t;
                        const current = tier === t;
                        return (
                            <div key={t} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                    {/* Circle */}
                                    <div style={{
                                        width: 48, height: 48, borderRadius: '50%',
                                        background: done ? '#FF6B00' : 'var(--bg-alt)',
                                        border: done ? 'none' : '2px solid var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800,
                                        color: done ? '#fff' : 'var(--text-muted)',
                                        fontSize: done ? '1.1rem' : '1rem',
                                        boxShadow: done ? '0 4px 16px rgba(255,107,0,0.3)' : 'none',
                                        transition: 'all 0.3s',
                                    }}>
                                        {done ? <CheckCircle size={22} strokeWidth={2.5} /> : t}
                                    </div>
                                    {/* Label */}
                                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>Tier {t}</p>
                                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.65rem', fontWeight: 800, color: current ? '#FF6B00' : 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.5px' }}>
                                        {current ? 'CURRENT' : tierLabels[t].toUpperCase()}
                                    </p>
                                </div>
                                {/* Connector line */}
                                {i < 2 && (
                                    <div style={{
                                        height: 3, flex: 0.6,
                                        background: tier > t ? '#FF6B00' : 'var(--border)',
                                        marginTop: 22, borderRadius: 2,
                                        transition: 'background 0.3s',
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Current Tier Limits ── */}
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.875rem', color: 'var(--text)' }}>Current Tier Limits</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {/* Max Transaction */}
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: '1rem 1.25rem',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    boxShadow: 'var(--card-shadow)',
                }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CreditCard size={22} color="#6366F1" />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Max Transaction</p>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                            {txLimit === '0' ? 'Unlimited' : `GHS ${Number(txLimit || 0).toLocaleString()}`}
                        </p>
                    </div>
                </div>

                {/* Weekly Withdrawal */}
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: '1rem 1.25rem',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    boxShadow: 'var(--card-shadow)',
                }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Wallet size={22} color="#10B981" />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Weekly Withdrawal</p>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                            {withdrawLimit === '0' ? 'Unlimited' : `GHS ${Number(withdrawLimit || 0).toLocaleString()}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Feature chips */}
            {features.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {features.map(f => (
                        <span key={f} style={{
                            fontSize: '0.72rem', fontWeight: 600,
                            background: 'var(--bg-alt)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            padding: '0.3rem 0.75rem',
                            borderRadius: 20,
                        }}>⊕ {f}</span>
                    ))}
                </div>
            )}

            {/* ── Pending State ── */}
            {hasPending && (
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 20,
                    padding: '1.5rem',
                    textAlign: 'center',
                    boxShadow: 'var(--card-shadow)',
                }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Clock size={26} color="#F59E0B" />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text)' }}>Application Pending</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>
                        Your Tier {app.target_tier} application is under review. We'll notify you once a decision is made.
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        Submitted: {new Date(app.created_at).toLocaleString()}
                    </p>
                </div>
            )}

            {/* ── Rejected Banner ── */}
            {wasRejected && app.target_tier === nextTier && (
                <div className="alert alert-danger" style={{ marginBottom: '1.25rem', borderRadius: 14 }}>
                    <strong>❌ Your Tier {app.target_tier} application was rejected</strong>
                    <p style={{ margin: '0.375rem 0 0', fontSize: '0.875rem' }}>Reason: {app.rejection_reason}</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', opacity: 0.8 }}>You can resubmit your documents below.</p>
                </div>
            )}

            {/* ── Tier 2 Upgrade Form ── */}
            {tier === 1 && !hasPending && (
                <UpgradeCard
                    title="Upgrade to Tier 2 — Verified"
                    description="Increase your transaction and withdrawal limits by submitting your Government ID and a selfie."
                    onSubmit={handleApplyTier2}
                    submitting={submitting}
                    uploading={uploading}
                    submitLabel="Submit for Tier 2 Verification"
                >
                    <DropZone
                        label="Government-Issued ID *"
                        hint="National ID, Passport, or Voter's Card (JPEG/PNG, max 5MB)"
                        file={govIdFile}
                        onFile={setGovIdFile}
                        accept="image/*,.pdf"
                    />
                    <DropZone
                        label="Selfie Photo *"
                        hint="A clear photo of yourself holding your ID document"
                        file={selfieFile}
                        onFile={setSelfieFile}
                        accept="image/*"
                    />
                </UpgradeCard>
            )}

            {/* ── Tier 3 Upgrade Form ── */}
            {tier === 2 && !hasPending && (
                <UpgradeCard
                    title="Upgrade to Tier 3 — Premium"
                    description="Unlock unlimited transactions and priority support by submitting proof of your business address."
                    onSubmit={handleApplyTier3}
                    submitting={submitting}
                    uploading={uploading}
                    submitLabel="Submit for Tier 3 Verification"
                >
                    <DropZone
                        label="Proof of Address *"
                        hint="Utility bill, bank statement, or business registration (max 5MB)"
                        file={addressFile}
                        onFile={setAddressFile}
                        accept="image/*,.pdf"
                    />
                </UpgradeCard>
            )}

            {/* ── Max Tier ── */}
            {tier === 3 && (
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 20,
                    padding: '2rem',
                    textAlign: 'center',
                    boxShadow: 'var(--card-shadow)',
                }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Trophy size={30} color="#10B981" />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem', color: '#10B981' }}>Maximum Tier Achieved!</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                        You have the highest verification level. All platform features and limits are unlocked.
                    </p>
                </div>
            )}
        </div>
    );
}

/* ── Upgrade Card wrapper ── */
function UpgradeCard({ title, description, onSubmit, submitting, uploading, submitLabel, children }) {
    return (
        <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(255,107,0,0.15)' }}>
            {/* Orange header */}
            <div style={{
                background: 'linear-gradient(135deg, #FF6B00, #FF9500)',
                padding: '1.125rem 1.5rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
                <Lock size={20} color="#fff" />
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{title}</span>
            </div>

            {/* White body */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: 'none', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
                    {description}
                </p>

                <form onSubmit={onSubmit}>
                    {children}

                    {/* Info note */}
                    <div style={{
                        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                        background: 'var(--bg-alt)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: '0.875rem 1rem',
                        marginBottom: '1.25rem',
                    }}>
                        <Info size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Documents must be dated within the last 3 months and clearly show your full name and address.
                        </p>
                    </div>

                    <button type="submit" disabled={submitting} style={{
                        width: '100%',
                        padding: '1rem',
                        background: submitting ? '#ccc' : '#FF6B00',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 14,
                        fontWeight: 800,
                        fontSize: '0.9375rem',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        boxShadow: submitting ? 'none' : '0 6px 20px rgba(255,107,0,0.35)',
                        transition: 'all 0.2s',
                    }}>
                        <Lock size={16} />
                        {uploading ? 'Uploading Documents...' : submitting ? 'Submitting...' : submitLabel}
                    </button>
                </form>
            </div>
        </div>
    );
}

/* ── Drag & Drop Upload Zone ── */
function DropZone({ label, hint, file, onFile, accept }) {
    const [over, setOver] = useState(false);
    const ref = useRef();

    return (
        <div style={{ marginBottom: '1.125rem' }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
            <p style={{ margin: '0 0 0.625rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hint}</p>

            <div
                onClick={() => ref.current.click()}
                onDragOver={e => { e.preventDefault(); setOver(true); }}
                onDragLeave={() => setOver(false)}
                onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
                style={{
                    border: `2px dashed ${over ? '#FF6B00' : file ? '#10B981' : 'rgba(255,107,0,0.35)'}`,
                    borderRadius: 14,
                    padding: '1.75rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: over ? 'rgba(255,107,0,0.04)' : file ? 'rgba(16,185,129,0.04)' : 'var(--bg-alt)',
                    transition: 'all 0.2s',
                }}
            >
                <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }} />
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                    <Upload size={18} color={file ? '#10B981' : 'var(--text-muted)'} />
                </div>
                {file ? (
                    <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: '#10B981' }}>✓ {file.name}</p>
                ) : (
                    <>
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--text)' }}>Click to upload</strong> or drag and drop
                        </p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>PDF, PNG, JPG (Max 5MB)</p>
                    </>
                )}
            </div>
        </div>
    );
}
