'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LogOut } from 'lucide-react';
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

    // Forms
    const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '', business_name: '', momo_number: '' });
    const [locationForm, setLocationForm] = useState({ city: '', region: '', pickup_description: '' });
    const [sellerLocation, setSellerLocation] = useState({ lat: null, lng: null, text: '' });

    // Messages
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
                momo_number: data.momo_number || ''
            });
            setLocationForm({
                city: data.city || '',
                region: data.region || '',
                pickup_description: data.pickup_description || ''
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

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
            // Get session token directly or let api handle it
            const token = localStorage.getItem('sd-token');
            const formData = new FormData();
            formData.append('file', kycFile);
            
            // Raw fetch because the api object handles JSON natively
            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
            
            // Patch the profile with the new URL
            await api.patch('/seller/profile', { kyc_document_url: uploadData.url });
            setKycMsg('Document uploaded successfully! Awaiting Admin review.');
            setKycFile(null);
            await fetchProfile();
        } catch (err) {
            setKycMsg(err.message);
        } finally {
            setUploadingKyc(false);
        }
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
        <div className="animate-in" style={{ maxWidth: 600 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Profile & Settings</h1>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Personal Info</h3>
                {profileMsg && <div className={`alert ${profileMsg.includes('updated') ? 'alert-success' : 'alert-danger'}`}>{profileMsg}</div>}

                <form onSubmit={saveProfile}>
                    <div className="form-group">
                        <label>Business Name *</label>
                        <input className="form-input" required value={profileForm.business_name} onChange={e => setProfileForm({ ...profileForm, business_name: e.target.value })} placeholder="Enter your business name" />
                    </div>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input className="form-input" value={profileForm.full_name} readOnly style={{ background: 'var(--bg-alt)', cursor: 'not-allowed', opacity: 0.7 }} />
                        <p className="text-xs text-muted mt-1">Full name cannot be changed. Contact support if needed.</p>
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input className="form-input" type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Phone Number</label>
                        <input className="form-input" value={profileForm.phone} readOnly style={{ background: 'var(--bg-alt)', cursor: 'not-allowed', opacity: 0.7 }} />
                        <p className="text-xs text-muted mt-1">Phone number cannot be changed directly.</p>
                    </div>
                    <div className="form-group">
                        <label>MoMo Number *</label>
                        <input
                            className="form-input"
                            value={profileForm.momo_number}
                            onChange={e => !seller?.momo_number && setProfileForm({ ...profileForm, momo_number: e.target.value })}
                            placeholder="e.g. 0241234567"
                            readOnly={!!seller?.momo_number}
                            style={seller?.momo_number ? { background: 'var(--bg-alt)', cursor: 'not-allowed', opacity: 0.7 } : {}}
                        />
                        {seller?.momo_number
                            ? <p className="text-xs text-muted mt-1">MoMo number cannot be changed. Contact support if needed.</p>
                            : <p className="text-xs text-muted mt-1">This is the number your earnings will be sent to. Once saved, it cannot be changed without contacting support.</p>
                        }
                        {!profileForm.momo_number && (
                            <p className="text-xs mt-1" style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠ You have not set a MoMo number. You will not be able to receive payouts until you do.</p>
                        )}
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</button>
                </form>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '0.25rem' }}>Location Settings</h3>
                <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                    Used to calculate delivery distance. You can only change your base location <strong>twice a year</strong> to prevent fraud. Buyers with open orders will be notified.
                </p>

                {locationMsg && <div className={`alert ${locationMsg.includes('updated') ? 'alert-success' : 'alert-danger'}`}>{locationMsg}</div>}

                <div style={{ padding: '0.75rem', background: 'rgba(43,125,233,0.05)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(43,125,233,0.1)' }}>
                    <span className="text-sm" style={{ fontWeight: 600, color: 'var(--brand)' }}>{changesRemaining} changes remaining this year.</span>
                </div>

                <form onSubmit={saveLocation}>
                    <div className="form-group" style={{ pointerEvents: canChangeLocation ? 'auto' : 'none', opacity: canChangeLocation ? 1 : 0.5 }}>
                        <LocationPicker onChange={setSellerLocation} />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={savingLocation || !canChangeLocation}>
                        {!canChangeLocation ? 'Limit Reached for This Year' : savingLocation ? 'Updating...' : 'Update Location'}
                    </button>
                    {!canChangeLocation && (
                        <p className="text-xs text-center text-danger mt-2">You have reached the limit of 2 location changes per year.</p>
                    )}
                </form>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>KYC & Limits Verification</h3>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <div><span className="text-xs">KYC Status</span><div><span className={`status-badge ${seller?.kyc_status || 'PENDING'}`}>{seller?.kyc_status || 'PENDING'}</span></div></div>
                    <div><span className="text-xs">Current Tier</span><div style={{ fontWeight: 700, color: 'var(--brand)' }}>Tier {seller?.kyc_tier || 1}</div></div>
                </div>
                
                <h4 className="text-sm" style={{ marginBottom: '0.5rem' }}>Upload ID Document</h4>
                <p className="text-xs text-muted mb-3">Upload a valid National ID, Passport, or Business Registration to apply for a higher transaction limit tier.</p>
                
                <form onSubmit={handleUploadDocument} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="file" accept="image/*,.pdf" onChange={e => { setKycFile(e.target.files[0]); setKycMsg(''); }} className="form-input" style={{ flex: 1, padding: '0.5rem', margin: 0 }} />
                    <button type="submit" className="btn btn-primary" disabled={uploadingKyc || !kycFile}>
                        {uploadingKyc ? 'Uploading...' : 'Upload & Submit'}
                    </button>
                </form>
                {kycMsg && <div className={`text-xs mt-2 ${kycMsg.includes('success') ? 'text-success' : 'text-danger'}`}>{kycMsg}</div>}
                {seller?.kyc_document_url && (
                    <div className="text-xs mt-3 p-2" style={{ background: 'rgba(56, 189, 248, 0.1)', borderRadius: '6px' }}>
                        ✅ Document previously uploaded. <a href={seller.kyc_document_url} target="_blank" rel="noopener noreferrer" className="text-brand" style={{textDecoration: 'underline'}}>View Document</a>
                    </div>
                )}
            </div>

            {seller && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '0.75rem' }}>Account Details</h3>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div><span className="text-xs">Seller Score</span><div style={{ fontWeight: 700, color: 'var(--brand)' }}>{seller.seller_score}/100</div></div>
                        <div><span className="text-xs">Joined</span><div style={{ fontWeight: 500 }}>{new Date(seller.created_at).toLocaleDateString()}</div></div>
                    </div>
                </div>
            )}

            <button
                onClick={logout}
                className="btn btn-block"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--danger)', color: '#fff', marginBottom: '2rem' }}
            >
                <LogOut size={16} /> Logout
            </button>
        </div>
    );
}
