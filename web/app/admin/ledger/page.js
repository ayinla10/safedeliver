'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';

export default function AdminLedger() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const queryParams = [];
        if (filter) queryParams.push(`type=${filter}`);
        if (search) queryParams.push(`search=${search}`);
        const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';

        adminApi.get(`/admin/ledger${queryString}`).then(data => { 
            setEntries(data); 
            setLoading(false); 
        }).catch(() => setLoading(false));
    }, [filter, search]);

    return (
        <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Escrow Ledger</h1>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className="tab-bar" style={{ margin: 0, overflow: 'visible' }}>
                    <button className={`tab-btn ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>All</button>
                    <button className={`tab-btn ${filter === 'HOLD' ? 'active' : ''}`} onClick={() => setFilter('HOLD')}>Holds</button>
                    <button className={`tab-btn ${filter === 'RELEASE' ? 'active' : ''}`} onClick={() => setFilter('RELEASE')}>Releases</button>
                    <button className={`tab-btn ${filter === 'REFUND' ? 'active' : ''}`} onClick={() => setFilter('REFUND')}>Refunds</button>
                    <button className={`tab-btn ${filter === 'FEE' ? 'active' : ''}`} onClick={() => setFilter('FEE')}>Fees</button>
                </div>
                
                <input 
                    type="text" 
                    placeholder="Search order ref..." 
                    className="form-input" 
                    style={{ flex: 1, minWidth: '200px', margin: 0 }}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Order Ref</th>
                                <th>Amount</th>
                                <th>From / To</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No ledger entries yet</td></tr>
                            ) : entries.map((e, i) => (
                                <tr key={i}>
                                    <td><span className={`status-badge ${e.entry_type === 'HOLD' ? 'PAID' : e.entry_type === 'RELEASE' ? 'DELIVERED' : e.entry_type === 'REFUND' ? 'REFUNDED' : 'REQUESTED'}`}>{e.entry_type}</span></td>
                                    <td><span className="text-mono">{e.order_ref}</span></td>
                                    <td style={{ fontWeight: 600 }}>GHS {(e.amount_ghs / 100).toFixed(2)}</td>
                                    <td className="text-sm">{e.note || e.reference || '—'}</td>
                                    <td className="text-sm">{new Date(e.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
