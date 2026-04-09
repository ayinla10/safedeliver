'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function LinksPage() {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);

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
                        <div key={link.id} className="card" style={{ 
                            position: 'relative', 
                            overflow: 'hidden',
                            border: '1px solid rgba(0,0,0,0.05)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            padding: '1rem',
                            borderRadius: '16px'
                        }}>
                            {link.image_url && (
                                <div style={{ 
                                    margin: '-1rem -1rem 1rem -1rem', 
                                    height: 160, 
                                    overflow: 'hidden', 
                                    background: 'var(--bg-alt)',
                                    position: 'relative'
                                }}>
                                    <img src={link.image_url} alt={link.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
                                    
                                    {/* Multi-image indicator */}
                                    {link.images && link.images.length > 1 && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            background: 'rgba(0,0,0,0.6)',
                                            backdropFilter: 'blur(4px)',
                                            color: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <span>📷</span> {link.images.length}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ minWidth: 0 }}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '0.125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 700 }}>{link.product_name}</h3>
                                    <span className="text-mono text-xs" style={{ opacity: 0.5, letterSpacing: '0.5px' }}>{link.link_code}</span>
                                </div>
                                <span className={`status-badge ${link.is_active ? 'RELEASED' : 'PENDING'}`} style={{ 
                                    fontSize: '0.65rem', 
                                    padding: '2px 8px',
                                    borderRadius: '6px'
                                }}>{link.is_active ? 'Active' : 'Paused'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                                <div><span className="text-xs">Price</span><div style={{ fontWeight: 600 }}>GHS {(link.price / 100).toFixed(2)}</div></div>
                                <div><span className="text-xs">Orders</span><div style={{ fontWeight: 600 }}>{link.order_count || 0}</div></div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-primary btn-sm" onClick={() => copyLink(link.link_code)}>Copy</button>
                                <Link href={`/seller/dashboard/links/new?code=${link.link_code}`} className="btn btn-secondary btn-sm" style={{ border: '1px solid var(--border-color)', color: 'var(--text-color)', background: 'transparent' }}>Edit</Link>
                                <button className="btn btn-ghost btn-sm" onClick={() => toggleLink(link.link_code, link.is_active)}>{link.is_active ? 'Pause' : 'Enable'}</button>
                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteLink(link.link_code)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
