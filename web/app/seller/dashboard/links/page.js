'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pencil, Pause, Play, Trash2, Link2, Plus, Image } from 'lucide-react';
import { api } from '@/lib/api';

export default function LinksPage() {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewImages, setPreviewImages] = useState(null);
    const [copied, setCopied] = useState(null);

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
        const url = `${window.location.origin}/pay/${code}`;
        navigator.clipboard.writeText(url);
        setCopied(code);
        setTimeout(() => setCopied(null), 2000);
    }

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    return (
        <div className="animate-in" style={{ paddingBottom: '6rem', maxWidth: 480, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>Checkout Links</h1>
                <Link href="/seller/dashboard/links/new" style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: '#FF6B00',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 20px rgba(255,107,0,0.4)',
                    textDecoration: 'none',
                }}>
                    <Plus size={22} color="#fff" strokeWidth={2.5} />
                </Link>
            </div>

            {/* Empty state */}
            {links.length === 0 ? (
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    boxShadow: 'var(--card-shadow)',
                }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,107,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Link2 size={28} color="#FF6B00" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: '0 0 1.25rem' }}>No checkout links yet</p>
                    <Link href="/seller/dashboard/links/new" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        background: '#FF6B00', color: '#fff', borderRadius: 12,
                        padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.9375rem',
                        textDecoration: 'none',
                    }}>
                        <Plus size={16} /> Create Your First Link
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                    {links.map(link => (
                        <LinkCard
                            key={link.id}
                            link={link}
                            copied={copied === link.link_code}
                            onCopy={() => copyLink(link.link_code)}
                            onToggle={() => toggleLink(link.link_code, link.is_active)}
                            onDelete={() => deleteLink(link.link_code)}
                            onPreview={(images, index) => setPreviewImages({ images, index })}
                        />
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {previewImages && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.92)',
                    backdropFilter: 'blur(12px)',
                    zIndex: 1000,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '2rem'
                }} onClick={() => setPreviewImages(null)}>
                    <button style={{
                        position: 'absolute', top: 20, right: 20,
                        background: 'rgba(255,255,255,0.15)', border: 'none',
                        width: 44, height: 44, borderRadius: '50%',
                        cursor: 'pointer', color: '#fff', fontSize: 22, fontWeight: 700
                    }}>&times;</button>
                    <img src={previewImages.images[previewImages.index]} style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 16, objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
                    {previewImages.images.length > 1 && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 20 }} onClick={e => e.stopPropagation()}>
                            {previewImages.images.map((_, i) => (
                                <div key={i} onClick={() => setPreviewImages({ ...previewImages, index: i })} style={{
                                    width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                                    background: i === previewImages.index ? '#FF6B00' : 'rgba(255,255,255,0.3)',
                                    transform: i === previewImages.index ? 'scale(1.3)' : 'scale(1)',
                                    transition: 'all 0.2s'
                                }} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function LinkCard({ link, copied, onCopy, onToggle, onDelete, onPreview }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const gallery = link.images && link.images.length > 0 ? link.images : (link.image_url ? [link.image_url] : []);
    const inactive = !link.is_active;

    const handleScroll = (e) => {
        const index = Math.round(e.target.scrollLeft / e.target.offsetWidth);
        setActiveIndex(index);
    };

    return (
        <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)',
            opacity: inactive ? 0.6 : 1,
            transition: 'opacity 0.2s',
        }}>
            {/* Image */}
            <div style={{ position: 'relative', height: 200, background: 'var(--bg-alt)', overflow: 'hidden' }}>
                {gallery.length > 0 ? (
                    <>
                        <div onScroll={handleScroll} className="no-scrollbar" style={{
                            display: 'flex', overflowX: 'auto',
                            scrollSnapType: 'x mandatory', height: '100%'
                        }}>
                            {gallery.map((img, i) => (
                                <div key={i} style={{ minWidth: '100%', scrollSnapAlign: 'start', cursor: 'pointer' }} onClick={() => onPreview(gallery, i)}>
                                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
                                </div>
                            ))}
                        </div>
                        {gallery.length > 1 && (
                            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
                                {gallery.map((_, i) => (
                                    <div key={i} style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: '#fff', opacity: i === activeIndex ? 1 : 0.4,
                                        transition: 'all 0.2s'
                                    }} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Image size={40} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                    </div>
                )}

                {/* Status badge overlay */}
                <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: inactive ? 'rgba(107,114,128,0.85)' : 'rgba(16,85,50,0.88)',
                    backdropFilter: 'blur(6px)',
                    color: '#fff',
                    fontSize: '0.65rem', fontWeight: 700,
                    letterSpacing: '1px', textTransform: 'uppercase',
                    padding: '0.3rem 0.75rem',
                    borderRadius: 20,
                }}>
                    {inactive ? 'Paused' : 'Active'}
                </div>
            </div>

            {/* Card body */}
            <div style={{ padding: '1.125rem 1.25rem' }}>
                {/* Name + code */}
                <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.125rem', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {link.product_name}
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {link.link_code}
                </p>

                {/* Price + Orders */}
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.125rem' }}>
                    <div>
                        <p style={{ margin: '0 0 0.2rem', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Price</p>
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FF6B00' }}>GHS {(link.price / 100).toFixed(2)}</p>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 0.2rem', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Orders</p>
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>{link.order_count || 0}</p>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    {/* Copy / Inactive button */}
                    <button onClick={inactive ? undefined : onCopy} style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: 12,
                        border: 'none',
                        background: inactive ? 'var(--bg-alt)' : (copied ? '#10B981' : '#FF6B00'),
                        color: inactive ? 'var(--text-muted)' : '#fff',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: inactive ? 'default' : 'pointer',
                        transition: 'background 0.2s',
                    }}>
                        {inactive ? 'Inactive' : copied ? '✓ Copied!' : 'Copy Link'}
                    </button>

                    {/* Edit */}
                    <Link href={`/seller/dashboard/links/new?code=${link.link_code}`} style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: 'var(--bg-alt)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, textDecoration: 'none',
                    }}>
                        <Pencil size={16} color="var(--text-secondary)" />
                    </Link>

                    {/* Pause / Play */}
                    <button onClick={onToggle} style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: inactive ? 'rgba(255,107,0,0.1)' : 'var(--bg-alt)',
                        border: inactive ? '1px solid rgba(255,107,0,0.3)' : '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0,
                    }}>
                        {inactive
                            ? <Play size={16} color="#FF6B00" />
                            : <Pause size={16} color="var(--text-secondary)" />
                        }
                    </button>

                    {/* Delete */}
                    <button onClick={onDelete} style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0,
                    }}>
                        <Trash2 size={16} color="#EF4444" />
                    </button>
                </div>
            </div>
        </div>
    );
}
