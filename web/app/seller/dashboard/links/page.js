'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function LinksPage() {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewImages, setPreviewImages] = useState(null); // { images: [], index: 0 }

    function load() {
        api.get('/checkout-links').then(data => { setLinks(data); setLoading(false); }).catch(() => setLoading(false));
    }
    useEffect(load, []);

    async function toggleLink(code, active) {
        await api.patch(`/checkout-links/${code}`, { is_active: !active });
        load();
    }
    async function deleteLink(code) {
        if (!confirm('Delete this link?')) return;
        await api.delete(`/checkout-links/${code}`);
        load();
    }
    function copyLink(code) {
        navigator.clipboard.writeText(`${window.location.origin}/pay/${code}`);
        alert('Link copied!');
    }

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem' }}>Checkout Links</h1>
                <Link href="/seller/dashboard/links/new" className="btn btn-primary btn-sm">+ New Link</Link>
            </div>

            {links.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔗</div>
                    <p className="text-sm">No checkout links yet</p>
                    <Link href="/seller/dashboard/links/new" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>Create Your First Link</Link>
                </div>
            ) : (
                <div className="grid-2" style={{ gap: '1.25rem' }}>
                    {links.map(link => (
                        <LinkCard 
                            key={link.id} 
                            link={link} 
                            onToggle={() => toggleLink(link.link_code, link.is_active)}
                            onDelete={() => deleteLink(link.link_code)}
                            onPreview={(images, index) => setPreviewImages({ images, index })}
                        />
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            {previewImages && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.9)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }} onClick={() => setPreviewImages(null)}>
                    <button style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'white',
                        border: 'none',
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '24px',
                        fontWeight: 'bold'
                    }}>&times;</button>
                    
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '80vh' }}>
                        <img 
                            src={previewImages.images[previewImages.index]} 
                            style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', objectFit: 'contain' }}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {/* Navigation dots in lightbox */}
                        {previewImages.images.length > 1 && (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px' }} onClick={(e) => e.stopPropagation()}>
                                {previewImages.images.map((img, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setPreviewImages({ ...previewImages, index: i })}
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            background: i === previewImages.index ? '#FF6B00' : 'rgba(255,255,255,0.3)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-component for individual link card with carousel
function LinkCard({ link, onToggle, onDelete, onPreview }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const gallery = link.images && link.images.length > 0 ? link.images : [link.image_url];
    
    const handleScroll = (e) => {
        const scrollLeft = e.target.scrollLeft;
        const width = e.target.offsetWidth;
        const index = Math.round(scrollLeft / width);
        setActiveIndex(index);
    };

    function copyLink(code) {
        const url = `${window.location.origin}/pay/${code}`;
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    }

    return (
        <div className="card" style={{ 
            position: 'relative', 
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            padding: '1.25rem',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Gallery Section */}
            <div style={{ 
                margin: '-1.25rem -1.25rem 1rem -1.25rem', 
                height: 180, 
                position: 'relative',
                background: 'var(--bg-alt)',
                overflow: 'hidden'
            }}>
                <div 
                    onScroll={handleScroll}
                    style={{
                        display: 'flex',
                        overflowX: 'auto',
                        scrollSnapType: 'x mandatory',
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                        height: '100%'
                    }}
                    className="no-scrollbar"
                >
                    {gallery.map((img, i) => (
                        <div key={i} style={{ minWidth: '100%', scrollSnapAlign: 'start', position: 'relative', cursor: 'pointer' }} onClick={() => onPreview(gallery, i)}>
                            <img 
                                src={img} 
                                alt={`${link.product_name} - ${i}`} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                crossOrigin="anonymous"
                            />
                        </div>
                    ))}
                </div>

                {/* Dots indicator */}
                {gallery.length > 1 && (
                    <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '0',
                        right: '0',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '6px',
                        pointerEvents: 'none'
                    }}>
                        {gallery.map((_, i) => (
                            <div key={i} style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: 'white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                opacity: i === activeIndex ? 1 : 0.4,
                                transform: i === activeIndex ? 'scale(1.2)' : 'scale(1)',
                                transition: 'all 0.2s'
                            }} />
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 800 }}>{link.product_name}</h3>
                    <code style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '0.5px' }}>{link.link_code}</code>
                </div>
                <span className={`status-badge ${link.is_active ? 'RELEASED' : 'PENDING'}`} style={{ 
                    fontSize: '0.65rem', 
                    padding: '2px 8px',
                    borderRadius: '6px'
                }}>{link.is_active ? 'Active' : 'Paused'}</span>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem' }}>
                <div><span className="text-xs" style={{ opacity: 0.6 }}>Price</span><div style={{ fontWeight: 700, color: 'var(--brand)' }}>GHS {(link.price / 100).toFixed(2)}</div></div>
                <div><span className="text-xs" style={{ opacity: 0.6 }}>Orders</span><div style={{ fontWeight: 700 }}>{link.order_count || 0}</div></div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => copyLink(link.link_code)}>Copy</button>
                <Link href={`/seller/dashboard/links/new?code=${link.link_code}`} className="btn btn-sm" style={{ flex: 1, textAlign: 'center', border: '1px solid var(--border-color)', background: 'transparent' }}>Edit</Link>
                <button onClick={onToggle} className="btn btn-sm btn-ghost" style={{ padding: '0 10px' }}>
                    {link.is_active ? 'Pause' : 'Enable'}
                </button>
                <button onClick={onDelete} className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)', padding: '0 10px' }}>&times;</button>
            </div>
        </div>
    );
}
