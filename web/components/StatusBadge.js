export default function StatusBadge({ status }) {
    const cls = `badge badge-${(status || '').toLowerCase().replace(' ', '_')}`;
    return <span className={cls}>{status}</span>;
}
