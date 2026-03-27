'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';

export default function AdminSettings() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        adminApi.get('/admin/settings').then(data => { setSettings(data); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg('');
        try {
            await adminApi.patch('/admin/settings', { settings });
            setMsg('Settings successfully updated!');
        } catch (err) {
            setMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    // Group settings by tier
    const tiers = [1, 2, 3];
    const tierLabels = { 1: 'Basic', 2: 'Verified', 3: 'Premium' };
    const tierColors = { 1: 'var(--warning)', 2: 'var(--brand)', 3: 'var(--success)' };

    const settingTypes = [
        { suffix: 'TX_LIMIT', label: 'Max Transaction Value (GHS)', hint: 'Set to 0 for unlimited' },
        { suffix: 'WITHDRAWAL_LIMIT', label: 'Weekly Withdrawal Limit (GHS)', hint: 'Set to 0 for unlimited' },
        { suffix: 'FEATURES', label: 'Feature Flags', hint: 'Comma-separated: basic_links,api_access,priority_support', isText: true },
    ];

    return (
        <div className="animate-in" style={{ maxWidth: 900 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>System Settings</h1>

            {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.5rem' }}>{msg}</div>}

            <form onSubmit={handleSave}>
                {tiers.map(tier => (
                    <div key={tier} className="card" style={{ marginBottom: '1.5rem', borderLeft: `4px solid ${tierColors[tier]}` }}>
                        <h3 style={{ marginBottom: '0.25rem' }}>
                            <span style={{ color: tierColors[tier] }}>●</span> Tier {tier} — {tierLabels[tier]}
                        </h3>
                        <p className="text-xs text-muted" style={{ marginBottom: '1.5rem' }}>
                            {tier === 1 ? 'Default tier for all new sellers (no documents required)' :
                             tier === 2 ? 'Verified with Government ID + Selfie' :
                             'Fully verified with Proof of Address'}
                        </p>

                        {settingTypes.map(st => {
                            const key = `TIER_${tier}_${st.suffix}`;
                            const setting = settings.find(s => s.key === key);
                            if (!setting) return null;
                            return (
                                <div key={key} className="form-group" style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ margin: 0, fontWeight: 600 }}>{st.label}</label>
                                        <span className="text-xs text-muted">{st.hint}</span>
                                    </div>
                                    {st.isText ? (
                                        <input
                                            className="form-input"
                                            type="text"
                                            value={setting.value}
                                            onChange={e => handleChange(key, e.target.value)}
                                            style={{ margin: 0, marginTop: '0.5rem' }}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--muted)' }}>GHS</span>
                                            <input
                                                className="form-input"
                                                type="number"
                                                min="0"
                                                value={setting.value}
                                                onChange={e => handleChange(key, e.target.value)}
                                                style={{ margin: 0, flex: 1 }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                <div style={{ textAlign: 'right' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving || settings.length === 0}>
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
