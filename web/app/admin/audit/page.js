'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.get('/admin/audit-logs').then(data => { setLogs(data); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>;

    return (
        <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>System Audit Logs</h1>
            
            <div className="alert" style={{ background: 'rgba(43,125,233,0.05)', border: '1px solid rgba(43,125,233,0.2)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                <div>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Tamper-Evident Security Log</strong>
                    <p className="text-sm">Audit logs provide an immutable record of critical system actions (KYC approvals, manual refunds, dispute resolutions) for regulatory compliance and platform security auditing.</p>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Actor</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Details</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No audit logs found</td></tr>
                            ) : logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="text-sm">{new Date(log.created_at).toLocaleString()}</td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.actor_type}</div>
                                        <div className="text-xs text-mono text-muted" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.actor_id}</div>
                                    </td>
                                    <td><span className="status-badge ACCEPTED">{log.action}</span></td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.entity_type}</div>
                                        <div className="text-xs text-mono text-muted" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.entity_id}</div>
                                    </td>
                                    <td className="text-sm" style={{ maxWidth: 200 }}>
                                        {log.metadata ? JSON.stringify(log.metadata) : '—'}
                                    </td>
                                    <td className="text-mono text-xs text-muted">{log.ip_address || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
