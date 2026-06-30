'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import {
    ShieldCheck, Percent, Clock, Users, Bell, AlertTriangle,
    Save, RotateCcw, CheckCircle2, Info
} from 'lucide-react';

// ── Static settings schema ─────────────────────────────────────────────────
// All metadata lives here. Backend is just a key/value store.
const SECTIONS = [
    {
        id: 'tiers',
        label: 'KYC Tiers',
        icon: ShieldCheck,
        color: '#4f46e5',
        description: 'Transaction and withdrawal limits for each seller verification tier.',
        settings: [
            // Tier 1
            { key: 'TIER_1_TX_LIMIT',          type: 'number', label: 'Tier 1 — Max Transaction (GHS)',    hint: '0 = Unlimited', min: 0, tier: 1 },
            { key: 'TIER_1_WITHDRAWAL_LIMIT',   type: 'number', label: 'Tier 1 — Weekly Withdrawal (GHS)', hint: '0 = Unlimited', min: 0, tier: 1 },
            { key: 'TIER_1_FEATURES',           type: 'text',   label: 'Tier 1 — Feature Flags',           hint: 'Comma-separated e.g. basic_links', tier: 1 },
            // Tier 2
            { key: 'TIER_2_TX_LIMIT',          type: 'number', label: 'Tier 2 — Max Transaction (GHS)',    hint: '0 = Unlimited', min: 0, tier: 2 },
            { key: 'TIER_2_WITHDRAWAL_LIMIT',   type: 'number', label: 'Tier 2 — Weekly Withdrawal (GHS)', hint: '0 = Unlimited', min: 0, tier: 2 },
            { key: 'TIER_2_FEATURES',           type: 'text',   label: 'Tier 2 — Feature Flags',           hint: 'Comma-separated e.g. basic_links,api_access', tier: 2 },
            // Tier 3
            { key: 'TIER_3_TX_LIMIT',          type: 'number', label: 'Tier 3 — Max Transaction (GHS)',    hint: '0 = Unlimited', min: 0, tier: 3 },
            { key: 'TIER_3_WITHDRAWAL_LIMIT',   type: 'number', label: 'Tier 3 — Weekly Withdrawal (GHS)', hint: '0 = Unlimited', min: 0, tier: 3 },
            { key: 'TIER_3_FEATURES',           type: 'text',   label: 'Tier 3 — Feature Flags',           hint: 'Comma-separated e.g. basic_links,api_access,priority_support', tier: 3 },
        ],
    },
    {
        id: 'fees',
        label: 'Platform Fees',
        icon: Percent,
        color: '#16a34a',
        description: 'Fee percentages and flat charges applied to transactions and payouts.',
        settings: [
            { key: 'FEE_ESCROW_PERCENT',  type: 'number', label: 'Escrow Fee (%)',          hint: 'Charged to buyer on each transaction e.g. 2.5', min: 0, max: 20, step: 0.1 },
            { key: 'FEE_PAYOUT_PERCENT',  type: 'number', label: 'Payout Fee (%)',           hint: 'Deducted from seller payout e.g. 1.0',          min: 0, max: 20, step: 0.1 },
            { key: 'FEE_DISPUTE_FLAT',    type: 'number', label: 'Dispute Admin Fee (GHS)',  hint: 'Flat fee charged when a dispute is raised e.g. 5.00', min: 0, step: 0.01 },
        ],
    },
    {
        id: 'escrow',
        label: 'Escrow Rules',
        icon: Clock,
        color: '#0284c7',
        description: 'Timers and thresholds governing how escrow funds are held and released.',
        settings: [
            { key: 'ESCROW_AUTO_RELEASE_DAYS',        type: 'number', label: 'Auto-Release After (days)',        hint: 'Days after SHIPPED status before funds are auto-released to seller', min: 1, max: 30 },
            { key: 'ESCROW_DISPUTE_WINDOW_HOURS',      type: 'number', label: 'Dispute Window (hours)',           hint: 'Hours after delivery confirmation during which buyer can raise a dispute', min: 1, max: 168 },
            { key: 'ESCROW_MAX_DISPUTE_EXTENSIONS',    type: 'number', label: 'Max Dispute Extensions',          hint: 'How many times a dispute deadline can be extended', min: 0, max: 5 },
        ],
    },
    {
        id: 'sellers',
        label: 'Seller Defaults',
        icon: Users,
        color: '#b45309',
        description: 'Default values assigned to new seller accounts.',
        settings: [
            { key: 'SELLER_DEFAULT_TRUST_SCORE', type: 'number', label: 'Default Trust Score',      hint: 'Score assigned to every new seller — stored as 0–100, displayed as X.X/10 (e.g. 100 → 10.0/10)', min: 0, max: 100 },
            { key: 'SELLER_GRACE_PERIOD_DAYS',   type: 'number', label: 'New Seller Grace (days)',  hint: 'Days before strict limits are enforced on new accounts', min: 0, max: 90 },
        ],
    },
    {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        color: '#7c3aed',
        description: 'Enable or disable outbound notification channels platform-wide.',
        settings: [
            { key: 'NOTIFY_SMS_ENABLED',   type: 'boolean', label: 'SMS Notifications',   hint: 'Send real SMS via Africa\'s Talking' },
            { key: 'NOTIFY_EMAIL_ENABLED', type: 'boolean', label: 'Email Notifications',  hint: 'Send transactional emails to sellers and buyers' },
        ],
    },
    {
        id: 'maintenance',
        label: 'Maintenance',
        icon: AlertTriangle,
        color: '#dc2626',
        description: 'Put the platform into maintenance mode. All API requests will return 503.',
        settings: [
            { key: 'MAINTENANCE_MODE',    type: 'boolean', label: 'Maintenance Mode',    hint: 'When ON, the platform rejects all non-admin requests' },
            { key: 'MAINTENANCE_MESSAGE', type: 'textarea', label: 'Maintenance Message', hint: 'Shown to users when maintenance mode is active' },
        ],
    },
];

// All known keys so we can seed defaults for missing ones
const DEFAULTS = {
    TIER_1_TX_LIMIT: '1000', TIER_1_WITHDRAWAL_LIMIT: '5000', TIER_1_FEATURES: 'basic_links',
    TIER_2_TX_LIMIT: '5000', TIER_2_WITHDRAWAL_LIMIT: '20000', TIER_2_FEATURES: 'basic_links,api_access',
    TIER_3_TX_LIMIT: '0',    TIER_3_WITHDRAWAL_LIMIT: '0',     TIER_3_FEATURES: 'basic_links,api_access,priority_support',
    FEE_ESCROW_PERCENT: '2.5', FEE_PAYOUT_PERCENT: '1.0', FEE_DISPUTE_FLAT: '5.00',
    ESCROW_AUTO_RELEASE_DAYS: '5', ESCROW_DISPUTE_WINDOW_HOURS: '48', ESCROW_MAX_DISPUTE_EXTENSIONS: '2',
    SELLER_DEFAULT_TRUST_SCORE: '50', SELLER_GRACE_PERIOD_DAYS: '7',
    NOTIFY_SMS_ENABLED: 'true', NOTIFY_EMAIL_ENABLED: 'true',
    MAINTENANCE_MODE: 'false', MAINTENANCE_MESSAGE: 'SafeDeliver is currently undergoing maintenance. Please check back soon.',
};

// ── Toggle component ───────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!checked)}
            style={{
                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                background: checked ? 'var(--brand)' : '#d1d5db',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <span style={{
                position: 'absolute', top: 3, left: checked ? 25 : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
        </button>
    );
}

// ── Last saved chip ────────────────────────────────────────────────────────
function LastSaved({ updatedAt, updatedByName }) {
    if (!updatedAt) return null;
    const d = new Date(updatedAt);
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 12,
            background: 'var(--bg-alt)', border: '1px solid var(--border)',
            fontSize: '0.7rem', color: 'var(--muted)'
        }}>
            <CheckCircle2 size={10} color="#16a34a" />
            {updatedByName ? `${updatedByName} · ` : ''}
            {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} {d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
    );
}

// ── Tier colour helper ─────────────────────────────────────────────────────
const TIER_COLORS = { 1: '#6b7280', 2: '#3b82f6', 3: '#8b5cf6' };
const TIER_LABELS = { 1: 'Basic', 2: 'Verified', 3: 'Premium' };

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminSettings() {
    const [dbValues, setDbValues] = useState({});   // { key: { value, updated_at, updated_by_name } }
    const [draft, setDraft] = useState({});         // { key: string }
    const [saved, setSaved] = useState({});         // { sectionId: bool }
    const [saving, setSaving] = useState({});       // { sectionId: bool }
    const [msgs, setMsgs] = useState({});           // { sectionId: string }
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tiers');

    // ── Load settings ──────────────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const rows = await adminApi.get('/admin/settings');
            const map = {};
            rows.forEach(r => { map[r.key] = { value: r.value, updated_at: r.updated_at, updated_by_name: r.updated_by_name }; });
            setDbValues(map);
            // Initialise draft from DB or default
            const d = {};
            SECTIONS.forEach(sec => sec.settings.forEach(s => {
                d[s.key] = map[s.key]?.value ?? DEFAULTS[s.key] ?? '';
            }));
            setDraft(d);
        } catch (err) {
            console.error('Settings load error', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── Dirty detection ────────────────────────────────────────────────────
    function isDirty(sectionId) {
        const sec = SECTIONS.find(s => s.id === sectionId);
        if (!sec) return false;
        return sec.settings.some(s => {
            const dbVal = dbValues[s.key]?.value ?? DEFAULTS[s.key] ?? '';
            return String(draft[s.key] ?? '') !== String(dbVal);
        });
    }

    // ── Field change ───────────────────────────────────────────────────────
    function change(key, val) {
        setDraft(prev => ({ ...prev, [key]: val }));
        // Clear section message on edit
        const sec = SECTIONS.find(s => s.settings.some(st => st.key === key));
        if (sec) setMsgs(prev => ({ ...prev, [sec.id]: '' }));
    }

    // ── Reset section ──────────────────────────────────────────────────────
    function reset(sectionId) {
        const sec = SECTIONS.find(s => s.id === sectionId);
        if (!sec) return;
        setDraft(prev => {
            const next = { ...prev };
            sec.settings.forEach(s => { next[s.key] = dbValues[s.key]?.value ?? DEFAULTS[s.key] ?? ''; });
            return next;
        });
        setMsgs(prev => ({ ...prev, [sectionId]: '' }));
    }

    // ── Save section ───────────────────────────────────────────────────────
    async function saveSection(sectionId) {
        const sec = SECTIONS.find(s => s.id === sectionId);
        if (!sec) return;

        // Validate
        for (const s of sec.settings) {
            if (s.type === 'number') {
                const v = parseFloat(draft[s.key]);
                if (isNaN(v)) { setMsgs(prev => ({ ...prev, [sectionId]: `"${s.label}" must be a valid number.` })); return; }
                if (s.min !== undefined && v < s.min) { setMsgs(prev => ({ ...prev, [sectionId]: `"${s.label}" cannot be less than ${s.min}.` })); return; }
                if (s.max !== undefined && v > s.max) { setMsgs(prev => ({ ...prev, [sectionId]: `"${s.label}" cannot exceed ${s.max}.` })); return; }
            }
        }

        // Maintenance mode danger confirm
        if (sectionId === 'maintenance' && draft['MAINTENANCE_MODE'] === 'true' && dbValues['MAINTENANCE_MODE']?.value !== 'true') {
            if (!window.confirm('⚠️ You are about to enable Maintenance Mode. All sellers and buyers will be blocked from the platform. Are you sure?')) return;
        }

        setSaving(prev => ({ ...prev, [sectionId]: true }));
        setMsgs(prev => ({ ...prev, [sectionId]: '' }));
        try {
            const settings = sec.settings.map(s => ({ key: s.key, value: draft[s.key] }));
            await adminApi.patch('/admin/settings', { settings });
            // Update local dbValues so dirty detection resets
            setDbValues(prev => {
                const next = { ...prev };
                const now = new Date().toISOString();
                settings.forEach(s => { next[s.key] = { ...(prev[s.key] || {}), value: s.value, updated_at: now }; });
                return next;
            });
            setMsgs(prev => ({ ...prev, [sectionId]: 'Saved successfully.' }));
            setTimeout(() => setMsgs(prev => ({ ...prev, [sectionId]: '' })), 3000);
        } catch (err) {
            setMsgs(prev => ({ ...prev, [sectionId]: 'Error: ' + err.message }));
        } finally {
            setSaving(prev => ({ ...prev, [sectionId]: false }));
        }
    }

    // ── Render a single field ──────────────────────────────────────────────
    function renderField(s) {
        const val = draft[s.key] ?? '';
        const meta = dbValues[s.key];

        if (s.type === 'boolean') {
            const isOn = val === 'true';
            return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.label}</span>
                            {isOn
                                ? <span style={{ padding: '1px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>ON</span>
                                : <span style={{ padding: '1px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(100,116,139,0.1)', color: '#64748b' }}>OFF</span>
                            }
                        </div>
                        <div className="text-xs text-muted" style={{ marginTop: 2 }}>{s.hint}</div>
                        {meta?.updated_at && <div style={{ marginTop: 4 }}><LastSaved updatedAt={meta.updated_at} updatedByName={meta.updated_by_name} /></div>}
                    </div>
                    <Toggle checked={isOn} onChange={v => change(s.key, v ? 'true' : 'false')} />
                </div>
            );
        }

        if (s.type === 'textarea') {
            return (
                <div key={s.key} className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <label style={{ margin: 0, fontWeight: 600 }}>{s.label}</label>
                        {meta?.updated_at && <LastSaved updatedAt={meta.updated_at} updatedByName={meta.updated_by_name} />}
                    </div>
                    <p className="text-xs text-muted" style={{ marginBottom: '0.4rem' }}>{s.hint}</p>
                    <textarea
                        className="form-input"
                        rows={3}
                        value={val}
                        onChange={e => change(s.key, e.target.value)}
                        style={{ margin: 0, resize: 'vertical' }}
                    />
                </div>
            );
        }

        // number or text
        return (
            <div key={s.key} className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem' }}>{s.label}</label>
                    {meta?.updated_at && <LastSaved updatedAt={meta.updated_at} updatedByName={meta.updated_by_name} />}
                </div>
                <p className="text-xs text-muted" style={{ marginBottom: '0.4rem' }}>{s.hint}</p>
                <input
                    className="form-input"
                    type={s.type === 'number' ? 'number' : 'text'}
                    min={s.min}
                    max={s.max}
                    step={s.step ?? (s.type === 'number' ? 1 : undefined)}
                    value={val}
                    onChange={e => change(s.key, e.target.value)}
                    style={{ margin: 0 }}
                />
            </div>
        );
    }

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    const activeSection = SECTIONS.find(s => s.id === activeTab);

    return (
        <div className="animate-in" style={{ maxWidth: 820 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>System Settings</h1>
            <p className="text-sm text-muted" style={{ marginBottom: '1.75rem' }}>
                Platform-wide configuration. Changes take effect immediately.
            </p>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '1.75rem', borderBottom: '2px solid var(--border)', paddingBottom: '0' }}>
                {SECTIONS.map(sec => {
                    const dirty = isDirty(sec.id);
                    const Icon = sec.icon;
                    const isActive = activeTab === sec.id;
                    return (
                        <button
                            key={sec.id}
                            onClick={() => setActiveTab(sec.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '0.55rem 1rem', border: 'none', cursor: 'pointer',
                                borderBottom: isActive ? `3px solid ${sec.color}` : '3px solid transparent',
                                marginBottom: -2,
                                background: 'none',
                                color: isActive ? sec.color : 'var(--text)',
                                fontWeight: isActive ? 700 : 500,
                                fontSize: '0.85rem',
                                transition: 'all 0.15s',
                            }}
                        >
                            <Icon size={15} />
                            {sec.label}
                            {dirty && (
                                <span style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: '#f59e0b', display: 'inline-block', flexShrink: 0
                                }} title="Unsaved changes" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Active section */}
            {activeSection && (() => {
                const Icon = activeSection.icon;
                const dirty = isDirty(activeSection.id);
                const isSaving = saving[activeSection.id];
                const msg = msgs[activeSection.id];

                // Group tier section by tier number
                const isTierSection = activeSection.id === 'tiers';
                const tiers = isTierSection ? [1, 2, 3] : null;

                return (
                    <div className="card animate-in" style={{ borderTop: `4px solid ${activeSection.color}` }}>
                        {/* Section header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.6rem', borderRadius: 10, background: `${activeSection.color}15`, flexShrink: 0 }}>
                                <Icon size={20} color={activeSection.color} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{activeSection.label}</h2>
                                <p className="text-sm text-muted" style={{ margin: '0.25rem 0 0' }}>{activeSection.description}</p>
                            </div>
                        </div>

                        {/* Maintenance mode warning banner */}
                        {activeSection.id === 'maintenance' && draft['MAINTENANCE_MODE'] === 'true' && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem',
                                background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)'
                            }}>
                                <AlertTriangle size={18} color="#dc2626" />
                                <span className="text-sm" style={{ color: '#dc2626', fontWeight: 600 }}>
                                    Maintenance mode is currently ON. All non-admin platform access is blocked.
                                </span>
                            </div>
                        )}

                        {/* Tier section: group by tier */}
                        {isTierSection ? (
                            tiers.map(tier => {
                                const tierSettings = activeSection.settings.filter(s => s.tier === tier);
                                return (
                                    <div key={tier} style={{
                                        marginBottom: '1.5rem', padding: '1.1rem',
                                        borderRadius: 10, border: `1px solid ${TIER_COLORS[tier]}30`,
                                        background: `${TIER_COLORS[tier]}06`
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                                                background: `${TIER_COLORS[tier]}18`, color: TIER_COLORS[tier]
                                            }}>Tier {tier}</span>
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{TIER_LABELS[tier]}</span>
                                            <span className="text-xs text-muted">
                                                {tier === 1 ? '— New sellers, no documents required'
                                                : tier === 2 ? '— Verified with Government ID'
                                                : '— Fully verified with Proof of Address'}
                                            </span>
                                        </div>
                                        {tierSettings.map(s => renderField(s))}
                                    </div>
                                );
                            })
                        ) : (
                            activeSection.settings.map(s => renderField(s))
                        )}

                        {/* Feedback message */}
                        {msg && (
                            <div className={`alert ${msg.startsWith('Error') ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
                                {msg}
                            </div>
                        )}

                        {/* Action bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {dirty
                                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
                                        <Info size={13} /> Unsaved changes
                                      </span>
                                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#16a34a', fontWeight: 500 }}>
                                        <CheckCircle2 size={13} /> All saved
                                      </span>
                                }
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {dirty && (
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => reset(activeSection.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem' }}
                                    >
                                        <RotateCcw size={14} /> Reset
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => saveSection(activeSection.id)}
                                    disabled={isSaving || !dirty}
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', opacity: !dirty ? 0.5 : 1 }}
                                >
                                    <Save size={14} /> {isSaving ? 'Saving…' : `Save ${activeSection.label}`}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
