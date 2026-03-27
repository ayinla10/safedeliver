'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';

export default function AdminDisputes() {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(null);
    const [notes, setNotes] = useState('');

    function load() {
        adminApi.get('/admin/disputes').then(data => { setDisputes(data); setLoading(false); }).catch(() => setLoading(false));
    }
    useEffect(load, []);

    async function resolve(id, decision) {
        try {
            await adminApi.patch(`/admin/disputes/${id}/resolve`, { decision, notes });
            setResolving(null); setNotes('');
            load();
        } catch (err) { alert(err.message); }
    }

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    return (
        <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Disputes</h1>
            {disputes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                    <p className="text-sm">No open disputes</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {disputes.map(d => (
                        <div key={d.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                    <span className="text-mono" style={{ fontWeight: 600 }}>{d.order_ref}</span>
                                    <span className={`status-badge DISPUTED`} style={{ marginLeft: '0.75rem' }}>Disputed</span>
                                </div>
                                <span className="text-sm">{new Date(d.updated_at).toLocaleDateString()}</span>
                            </div>
                            <div className="grid-3" style={{ marginBottom: '0.75rem' }}>
                                <div><span className="text-xs">Buyer</span><div style={{ fontWeight: 500 }}>{d.buyer_name}</div></div>
                                <div><span className="text-xs">Seller</span><div style={{ fontWeight: 500 }}>{d.seller_name}</div></div>
                                <div><span className="text-xs">Amount</span><div style={{ fontWeight: 600 }}>GHS {(d.total_amount / 100).toFixed(2)}</div></div>
                            </div>
                            <div style={{ background: 'var(--warning-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }}>
                                <div className="text-xs" style={{ marginBottom: '0.25rem', fontWeight: 600 }}>Dispute Reason</div>
                                <div style={{ fontSize: '0.9375rem' }}>{d.dispute_reason || 'No reason provided'}</div>
                            </div>
                            {resolving === d.id ? (
                                <div>
                                    <textarea className="form-textarea" placeholder="Admin notes..." value={notes} onChange={e => setNotes(e.target.value)} style={{ marginBottom: '0.75rem', minHeight: '80px' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-primary btn-sm" onClick={() => resolve(d.id, 'RELEASE')}>✅ Release to Seller</button>
                                        <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff' }} onClick={() => resolve(d.id, 'REFUND')}>↩ Refund Buyer</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setResolving(null)}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <button className="btn btn-primary btn-sm" onClick={() => setResolving(d.id)}>Resolve Dispute</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
