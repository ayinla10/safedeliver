'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LogOut, User, MapPin, ShieldCheck, Star, CreditCard } from 'lucide-react';
import LocationPicker from '@/components/LocationPicker';

export default function ProfilePage() {
    const router = useRouter();
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingLocation, setSavingLocation] = useState(false);
    const [uploadingKyc, setUploadingKyc] = useState(false);
    const [kycFile, setKycFile] = useState(null);
    const [kycMsg, setKycMsg] = useState('');

    const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '', business_name: '', momo_number: '' });
    const [originalMomo, setOriginalMomo] = useState('');
    const [locationForm, setLocationForm] = useState({ city: '', region: '', pickup_description: '' });
    const [sellerLocation, setSellerLocation] = useState({ lat: null, lng: null, text: '' });

    const [profileMsg, setProfileMsg] = useState('');
    const [locationMsg, setLocationMsg] = useState('');

    const fetchProfile = async () => {
        try {
            const data = await api.get('/seller/profile');
            setSeller(data);
            setProfileForm({
                full_name: data.full_name || '',
                email: data.email || '',
                phone: data.phone || '',
                business_name: data.business_name || '',
                momo_number: data.momo_number || '',
            });
            if (data.momo_number) setOriginalMomo(data.momo_number);
            setLocationForm({
                city: data.city || '',
                region: data.region || '',
                pickup_description: data.pickup_description || '',
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    async function saveProfile(e) {
        e.preventDefault();
        setSavingProfile(true); setProfileMsg('');
        try {
            await api.patch('/seller/profile', profileForm);
            setProfileMsg('Profile updated successfully!');
            await fetchProfile();
        } catch (err) { setProfileMsg(err.message); }
        setSavingProfile(false);
    }

    async function saveLocation(e) {
        e.preventDefault();
        if (!sellerLocation.text) return setLocationMsg('Please pick a location on the map or search for one.');
        if (!window.confirm('Are you sure you want to change your location? You can only do this twice a year.')) return;
        setSavingLocation(true); setLocationMsg('');
        try {
            const res = await api.patch('/seller/location', {
                city: sellerLocation.text,
                region: sellerLocation.text,
                lat: sellerLocation.lat,
                lng: sellerLocation.lng,
                location_text: sellerLocation.text,
            });
            setLocationMsg(res.message || 'Location updated successfully!');
            await fetchProfile();
        } catch (err) { setLocationMsg(err.message); }
        setSavingLocation(false);
    }

    async function handleUploadDocument(e) {
        e.preventDefault();
        if (!kycFile) return;
        setUploadingKyc(true); setKycMsg('');
        try {
            const token = localStorage.getItem('sd-token');
            const formData = new FormData();
            formData.append('file', kycFile);
            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
            await api.patch('/seller/profile', { kyc_document_url: uploadData.url });
            setKycMsg('Document uploaded successfully! Awaiting Admin review.');
            setKycFile(null);
            await fetchProfile();
        } catch (err) {
            setKycMsg(err.message);
        } finally { setUploadingKyc(false); }
    }

    function logout() {
        localStorage.removeItem('sd-token');
        localStorage.removeItem('sd-refresh-token');
        localStorage.removeItem('sd-seller');
        router.push('/seller/login');
    }

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    const changesRemaining = 2 - (seller?.location_changes_this_year || 0);
    const canChangeLocation = changesRemaining > 0;

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Profile &amp; Settings</h1>
                <button
                    onClick={logout}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                    <LogOut size={15} /> Logout
                </button>
            </div>

            {/* ── Two-column layout on desktop ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>

                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Account Summary */}
                    {seller && (
                        <div className="card" style={{ borderLeft: '4px solid #FF6B00' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <User size={26} color="#FF6B00" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{seller.full_name}</div>
                                    {seller.business_name && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{seller.business_name}</div>}
                                    <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            <ShieldCheck size={13} /> Tier {seller.kyc_tier || 1} — {seller.kyc_status || 'PENDING'}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            <Star size={13} /> {((seller.seller_score ?? 100) / 10).toFixed(1)}/10 Trust
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Personal Info */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={18} color="#FF6B00" /> Personal Info
                        </h3>
                        {profileMsg && (
                            <div className={`alert ${profileMsg.includes('successfully') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
                                {profileMsg}
                            </div>
                        )}
                        <form onSubmit={saveProfile}>
                            <div className="form-group">
                                <label>Business Name *</label>
                                <input className="form-input" required value={profileForm.business_name}
                                    onChange={e => setProfileForm({ ...profileForm, business_name: e.target.value })}
                                    placeholder="Enter your business name" />
                            </div>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input className="form-input" value={profileForm.full_name} readOnly
                                    style={{ background: 'var(--bg-alt)', cursor: 'not-allowed', opacity: 0.7 }} />
                                <p className="text-xs text-muted mt-1">Cannot be changed. Contact support if needed.</p>
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input className="form-input" type="email" value={profileForm.email}
                                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input className="form-input" value={profileForm.phone} readOnly
                                    style={{ background: 'var(--bg-alt)', cursor: 'not-allowed', opacity: 0.7 }} />
                                <p className="text-xs text-muted mt-1">Phone cannot be changed directly.</p>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <CreditCard size={14} /> MoMo Payout Number *
                                </label>
                                <input
                                    className="form-input"
                                    value={profileForm.momo_number}
                                    onChange={e => !originalMomo && setProfileForm({ ...profileForm, momo_number: e.target.value })}
                                    placeholder="e.g. 0241234567"
                                    readOnly={!!originalMomo}
                                    style={originalMomo ? { background: 'var(--bg-alt)', cursor: 'not-allowed', opacity: 0.7 } : {}}
                                />
                                {originalMomo
                                    ? <p className="text-xs text-muted mt-1">MoMo number locked. Contact support to change.</p>
                                    : <p className="text-xs text-muted mt-1">Your earnings will be sent to this number. Cannot be changed once saved.</p>
                                }
                                {!profileForm.momo_number && (
                                    <p className="text-xs mt-1" style={{ color: 'var(--danger)', fontWeight: 600 }}>
                                        No MoMo number set — you cannot receive payouts until you add one.
                                    </p>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary btn-block" disabled={savingProfile}>
                                {savingProfile ? 'Saving...' : 'Save Profile'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Location Settings */}
                    <div className="card">
                        <h3 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={18} color="#FF6B00" /> Location Settings
                        </h3>
                        <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                            Used to calculate delivery distance. You can change your base location <strong>twice a year</strong> to prevent fraud.
                        </p>
                        {locationMsg && (
                            <div className={`alert ${locationMsg.includes('successfully') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
                                {locationMsg}
                            </div>
                        )}
                        <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,107,0,0.05)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,107,0,0.15)' }}>
                            <span className="text-sm" style={{ fontWeight: 600, color: '#FF6B00' }}>
                                {changesRemaining} location change{changesRemaining !== 1 ? 's' : ''} remaining this year
                            </span>
                        </div>
                        <form onSubmit={saveLocation}>
                            <div className="form-group" style={{ pointerEvents: canChangeLocation ? 'auto' : 'none', opacity: canChangeLocation ? 1 : 0.5 }}>
                                <LocationPicker onChange={setSellerLocation} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block" disabled={savingLocation || !canChangeLocation}>
                                {!canChangeLocation ? 'Limit Reached for This Year' : savingLocation ? 'Updating...' : 'Update Location'}
                            </button>
                            {!canChangeLocation && (
                                <p className="text-xs text-center mt-2" style={{ color: 'var(--danger)' }}>You have reached the limit of 2 location changes per year.</p>
                            )}
                        </form>
                    </div>

                    {/* KYC */}
                    <div className="card">
                        <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={18} color="#FF6B00" /> KYC Verification
                        </h3>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                            <div>
                                <span className="text-xs text-muted">KYC Status</span>
                                <div><span className={`status-badge ${seller?.kyc_status || 'PENDING'}`}>{seller?.kyc_status || 'PENDING'}</span></div>
                            </div>
                            <div>
                                <span className="text-xs text-muted">Current Tier</span>
                                <div style={{ fontWeight: 700, color: '#FF6B00', fontSize: '1rem' }}>Tier {seller?.kyc_tier || 1}</div>
                            </div>
                        </div>
                        <p className="text-xs text-muted" style={{ marginBottom: '1rem' }}>
                            Upload a valid National ID, Passport, or Business Registration to apply for a higher transaction limit tier.
                        </p>
                        <form onSubmit={handleUploadDocument} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input type="file" accept="image/*,.pdf"
                                onChange={e => { setKycFile(e.target.files[0]); setKycMsg(''); }}
                                className="form-input" style={{ flex: 1, padding: '0.5rem', margin: 0 }} />
                            <button type="submit" className="btn btn-primary" disabled={uploadingKyc || !kycFile}>
                                {uploadingKyc ? 'Uploading...' : 'Upload'}
                            </button>
                        </form>
                        {kycMsg && (
                            <div className={`text-xs mt-2 ${kycMsg.includes('success') ? 'text-success' : 'text-danger'}`}>{kycMsg}</div>
                        )}
                        {seller?.kyc_document_url && (
                            <div className="text-xs mt-3 p-2" style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.15)' }}>
                                Document previously uploaded. <a href={seller.kyc_document_url} target="_blank" rel="noopener noreferrer" style={{ color: '#FF6B00', textDecoration: 'underline' }}>View Document</a>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
