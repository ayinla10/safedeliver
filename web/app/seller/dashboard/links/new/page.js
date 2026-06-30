'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function InnerNewLinkPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editCode = searchParams.get('code');
    const [form, setForm] = useState({ product_name: '', description: '', price: '' });
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const [imageFiles, setImageFiles] = useState([]); // Array of files
    const [uploadingImage, setUploadingImage] = useState(false);
    const [loadingEdit, setLoadingEdit] = useState(!!editCode);

    useEffect(() => {
        if (editCode) {
            api.get(`/checkout-links/${editCode}`)
                .then(data => {
                    setForm({
                        product_name: data.product_name || '',
                        description: data.description || '',
                        price: data.price ? (data.price / 100).toString() : ''
                    });
                    setLoadingEdit(false);
                })
                .catch(err => {
                    setError('Failed to load link');
                    setLoadingEdit(false);
                });
        }
    }, [editCode]);

    async function create(e) {
        e.preventDefault();
        
        // Multi-image validation (Required for new links)
        if (!editCode && imageFiles.length === 0) {
            setError('Please select at least one product image.');
            return;
        }

        setCreating(true); setError('');
        try {
            let imageUrls = [];
            
            if (imageFiles.length > 0) {
                setUploadingImage(true);
                const token = localStorage.getItem('sd-token');
                
                // Upload all images concurrently
                const uploadPromises = Array.from(imageFiles).map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/upload`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                    const uploadData = await uploadRes.json();
                    if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed');
                    return uploadData.url;
                });

                imageUrls = await Promise.all(uploadPromises);
                setUploadingImage(false);
            }

            const data = {
                product_name: form.product_name,
                description: form.description,
                price: Math.round(parseFloat(form.price) * 100)
            };
            
            if (imageUrls.length > 0) {
                data.image_url = imageUrls[0]; // Set primary
                data.images = imageUrls;      // Set gallery
            }
            
            if (editCode) {
                await api.patch(`/checkout-links/${editCode}`, data);
            } else {
                await api.post('/checkout-links', data);
            }
            router.push('/seller/dashboard/links');
        } catch (err) { setError(err.message); setCreating(false); setUploadingImage(false); }
    }

    if (loadingEdit) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    return (
        <div className="animate-in" style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{editCode ? 'Edit Checkout Link' : 'Create Checkout Link'}</h1>
            {error && <div className="alert alert-danger" style={{ background: '#FFF1F0', border: '1px solid #FFA39E', color: '#CF1322', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}
            <div className="card">
                <form onSubmit={create}>
                    <div className="form-group">
                        <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Product Name</label>
                        <input className="form-input" placeholder="e.g. iPhone 15 Pro Max" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Description (optional)</label>
                        <textarea className="form-textarea" placeholder="Product details, color, condition..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Price (GHS)</label>
                        <input className="form-input" type="number" step="0.01" min="1" placeholder="100.00" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                    </div>
                    
                    <div className="form-group">
                        <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Product Images {!editCode && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
                        <p className="text-xs" style={{ marginBottom: '0.5rem', opacity: 0.6 }}>You can select up to 6 images.</p>
                        <input 
                            className="form-input" 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            onChange={e => {
                                const files = e.target.files;
                                if (files.length > 6) {
                                    setError('Maximum 6 images allowed.');
                                    e.target.value = '';
                                    return;
                                }
                                setImageFiles(files);
                            }} 
                        />
                        {imageFiles.length > 0 && (
                            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--brand)', fontWeight: 600 }}>
                                ✅ {imageFiles.length} images selected
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(43,125,233,0.05)', borderRadius: '8px', border: '1px solid rgba(43,125,233,0.1)' }}>
                        <p className="text-sm" style={{ fontWeight: 600, color: 'var(--brand)' }}>ℹ️ How delivery works</p>
                        <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            <li style={{ marginBottom: '0.25rem' }}>Buyers will provide their location when ordering.</li>
                            <li style={{ marginBottom: '0.25rem' }}>You will then have 12 hours to quote a delivery fee.</li>
                            <li>A <strong>5% service fee</strong> is deducted from the final payout to cover escrow and platform costs.</li>
                        </ul>
                    </div>

                    <button className="btn btn-primary btn-block" disabled={creating || uploadingImage}>
                        {uploadingImage ? 'Uploading Image...' : creating ? (editCode ? 'Updating...' : 'Creating...') : (editCode ? 'Update Checkout Link' : 'Create Checkout Link')}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function NewLinkPage() {
    return (
        <Suspense fallback={<div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>}>
            <InnerNewLinkPage />
        </Suspense>
    );
}
