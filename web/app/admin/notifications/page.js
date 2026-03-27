'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const queryParams = [];
        if (filter) queryParams.push(`type=${filter}`);
        if (search) queryParams.push(`search=${search}`);
        const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';

        adminApi.get(`/admin/notifications${queryString}`).then(data => { 
            setNotifications(data); 
            setLoading(false); 
        }).catch(() => setLoading(false));
    }, [filter, search]);

    return (
        <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Communication Logs</h1>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className="tab-bar" style={{ margin: 0, overflow: 'visible' }}>
                    <button className={`tab-btn ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>All</button>
                    <button className={`tab-btn ${filter === 'TRANSACTIONS' ? 'active' : ''}`} onClick={() => setFilter('TRANSACTIONS')}>Transactions</button>
                    <button className={`tab-btn ${filter === 'SYSTEM' ? 'active' : ''}`} onClick={() => setFilter('SYSTEM')}>System</button>
                </div>
                
                <input 
                    type="text" 
                    placeholder="Search phone or order ref..." 
                    className="form-input" 
                    style={{ flex: 1, minWidth: '250px', margin: 0 }}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>
            ) : notifications.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                    <p className="text-sm">No notifications found</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {notifications.map((n, i) => (
                        <div key={i} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
                                    {n.channel === 'WHATSAPP' ? '💬' : '📱'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{n.message}</div>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <span className="text-xs text-muted">To: <span className="text-mono">{n.phone}</span></span>
                                        {n.order_ref && <span className="text-xs text-muted">Order: <span className="text-mono" style={{color: 'var(--brand)'}}>{n.order_ref}</span></span>}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                <div className="text-xs" style={{ marginBottom: '0.25rem' }}>{new Date(n.sent_at).toLocaleDateString()}</div>
                                <div className="text-xs text-muted">{new Date(n.sent_at).toLocaleTimeString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
