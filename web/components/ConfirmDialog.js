'use client';
import { useEffect } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

/**
 * ConfirmDialog — inline styled confirmation overlay.
 *
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *
 *   // trigger:
 *   setConfirm({
 *     title: 'Cancel order?',
 *     message: 'This cannot be undone.',
 *     variant: 'danger',           // 'danger' | 'warning' | 'info'
 *     confirmLabel: 'Yes, Cancel', // optional, default 'Confirm'
 *     onConfirm: () => { ... },
 *   });
 *
 *   // in JSX:
 *   {confirm && <ConfirmDialog {...confirm} onClose={() => setConfirm(null)} />}
 */
export default function ConfirmDialog({ title, message, variant = 'danger', confirmLabel = 'Confirm', onConfirm, onClose }) {
    // Close on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const colors = {
        danger:  { accent: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  icon: <AlertTriangle size={22} color="#EF4444" /> },
        warning: { accent: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: <AlertTriangle size={22} color="#F59E0B" /> },
        info:    { accent: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: <Info size={22} color="#3B82F6" /> },
    };
    const c = colors[variant] || colors.danger;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                    zIndex: 9998, backdropFilter: 'blur(2px)',
                }}
            />
            {/* Dialog */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 9999,
                background: 'var(--card-bg)',
                border: `1px solid ${c.border}`,
                borderRadius: 18,
                padding: '1.75rem',
                width: '90%', maxWidth: 400,
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                animation: 'dialog-in 0.15s ease',
            }}>
                {/* Icon + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {c.icon}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
                </div>

                {message && (
                    <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {message}
                    </p>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '0.625rem', borderRadius: 10,
                            background: 'var(--bg-alt)', border: '1px solid var(--border)',
                            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                            color: 'var(--text)',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        style={{
                            flex: 1, padding: '0.625rem', borderRadius: 10,
                            background: c.accent, border: 'none',
                            fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                            color: '#fff',
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes dialog-in {
                    from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `}</style>
        </>
    );
}
