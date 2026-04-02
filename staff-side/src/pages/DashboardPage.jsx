import { HiOutlineViewGrid, HiOutlineBookOpen, HiOutlineQrcode, HiOutlineClipboardList } from 'react-icons/hi';

const QUICK_STATS = [
  { icon: HiOutlineQrcode, label: 'Tables', value: '—', color: 'var(--accent-blue)' },
  { icon: HiOutlineBookOpen, label: 'Menu Items', value: '—', color: 'var(--accent-amber)' },
  { icon: HiOutlineClipboardList, label: 'Active Orders', value: '—', color: 'var(--accent-green)' },
  { icon: HiOutlineViewGrid, label: 'Sessions Today', value: '—', color: 'var(--accent-purple)' },
];

export default function DashboardPage() {
  return (
    <div className="page-dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back. Here's your restaurant at a glance.</p>
      </div>

      <div className="stats-grid">
        {QUICK_STATS.map(({ icon: Icon, label, value, color }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon-wrap" style={{ '--stat-color': color }}>
              <Icon className="stat-icon" />
            </div>
            <div className="stat-info">
              <span className="stat-value">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-placeholder">
        <div className="placeholder-card">
          <p className="placeholder-text">
            Live data will populate here as you set up Tables, Menu Items, and start receiving Orders.
          </p>
        </div>
      </div>
    </div>
  );
}
