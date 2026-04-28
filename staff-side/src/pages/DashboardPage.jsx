import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { RESTAURANT_ID } from '../constants';
import {
  HiOutlineViewGrid,
  HiOutlineBookOpen,
  HiOutlineQrcode,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineUserGroup,
} from 'react-icons/hi';

export default function DashboardPage() {
  const [tableCount, setTableCount] = useState(0);
  const [menuItemCount, setMenuItemCount] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen to tables count
  useEffect(() => {
    const ref = collection(db, 'restaurants', RESTAURANT_ID, 'tables');
    return onSnapshot(ref, (snap) => {
      setTableCount(snap.size);
      setLoading(false);
    });
  }, []);

  // Listen to menu items count
  useEffect(() => {
    const ref = collection(db, 'restaurants', RESTAURANT_ID, 'menu_items');
    return onSnapshot(ref, (snap) => setMenuItemCount(snap.size));
  }, []);

  // Listen to active sessions (open, ordered, billed)
  useEffect(() => {
    const ref = collection(db, 'restaurants', RESTAURANT_ID, 'sessions');
    const q = query(ref, where('status', 'in', ['open', 'ordered', 'billed']));
    return onSnapshot(q, (snap) => {
      setActiveOrders(snap.size);
      // Get the 5 most recent for the activity feed
      const orders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aTime = a.created_at?.seconds || 0;
          const bTime = b.created_at?.seconds || 0;
          return bTime - aTime;
        })
        .slice(0, 5);
      setRecentOrders(orders);
    });
  }, []);

  // Count today's sessions (all statuses)
  useEffect(() => {
    const ref = collection(db, 'restaurants', RESTAURANT_ID, 'sessions');
    return onSnapshot(ref, (snap) => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
      const todayCount = snap.docs.filter((d) => {
        const ts = d.data().created_at?.seconds || 0;
        return ts >= startOfDay;
      }).length;
      setTodaySessions(todayCount);
    });
  }, []);

  const stats = [
    { icon: HiOutlineQrcode, label: 'Tables', value: tableCount, color: 'var(--accent-blue)' },
    { icon: HiOutlineBookOpen, label: 'Menu Items', value: menuItemCount, color: 'var(--accent-amber)' },
    { icon: HiOutlineClipboardList, label: 'Active Orders', value: activeOrders, color: 'var(--accent-green)' },
    { icon: HiOutlineViewGrid, label: 'Sessions Today', value: todaySessions, color: 'var(--accent-purple)' },
  ];

  const STATUS_LABELS = {
    open: { label: 'Browsing', color: 'var(--accent-green)' },
    ordered: { label: 'Ordered', color: 'var(--accent-red)' },
    billed: { label: 'Billed', color: 'var(--accent-amber)' },
  };

  if (loading) {
    return (
      <div className="page-placeholder-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="loading-screen" style={{ height: '40vh' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back. Here's your restaurant at a glance.</p>
      </div>

      <div className="stats-grid">
        {stats.map(({ icon: Icon, label, value, color }) => (
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

      {/* Recent Activity */}
      {recentOrders.length > 0 ? (
        <div className="dashboard-activity">
          <h2 className="dashboard-section-title">Active Sessions</h2>
          <div className="activity-list">
            {recentOrders.map((order) => {
              const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: 'var(--text-muted)' };
              const guestNames = (order.users || [])
                .map((u) => (typeof u === 'object' ? u.nickname : u))
                .join(', ');
              const time = order.created_at
                ? new Date(order.created_at.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div key={order.id} className="activity-card">
                  <div className="activity-status-dot" style={{ background: statusInfo.color }} />
                  <div className="activity-info">
                    <div className="activity-title">
                      Table Session
                      <span className="activity-status-badge" style={{ color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="activity-meta">
                      {guestNames && (
                        <span className="activity-meta-item">
                          <HiOutlineUserGroup style={{ fontSize: 14 }} />
                          {guestNames}
                        </span>
                      )}
                      {time && (
                        <span className="activity-meta-item">
                          <HiOutlineClock style={{ fontSize: 14 }} />
                          {time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="dashboard-placeholder">
          <div className="placeholder-card">
            <p className="placeholder-text">
              No active sessions right now. Orders will appear here as customers start scanning QR codes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
