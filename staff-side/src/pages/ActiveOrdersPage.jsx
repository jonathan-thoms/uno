import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { RESTAURANT_ID } from '../constants';
import {
  HiOutlineClipboardList,
  HiOutlineX,
  HiOutlineCash,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineUserGroup,
} from 'react-icons/hi';

// Status config: color, label, and sort priority
const STATUS_CONFIG = {
  empty:   { color: 'var(--pos-grey)',   label: 'Empty',      cssClass: 'pos-status--empty',   priority: 4 },
  open:    { color: 'var(--pos-green)',  label: 'Open',       cssClass: 'pos-status--open',    priority: 1 },
  ordered: { color: 'var(--pos-red)',    label: 'Ordered',    cssClass: 'pos-status--ordered', priority: 0 },
  billed:  { color: 'var(--pos-yellow)', label: 'Billed',     cssClass: 'pos-status--billed',  priority: 2 },
};

export default function ActiveOrdersPage() {
  const [tables, setTables] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [menuItemsMap, setMenuItemsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // ─── Listen to all tables ───
  useEffect(() => {
    const tablesRef = collection(db, 'restaurants', RESTAURANT_ID, 'tables');
    const unsubscribe = onSnapshot(tablesRef, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTables(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ─── Listen to active sessions (status != "closed") ───
  useEffect(() => {
    const sessionsRef = collection(db, 'restaurants', RESTAURANT_ID, 'sessions');
    const q = query(sessionsRef, where('status', 'in', ['open', 'ordered', 'billed']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSessions(data);
    });
    return unsubscribe;
  }, []);

  // ─── Load menu items map for resolving item names ───
  useEffect(() => {
    const menuRef = collection(db, 'restaurants', RESTAURANT_ID, 'menu_items');
    const unsubscribe = onSnapshot(menuRef, (snapshot) => {
      const map = {};
      snapshot.docs.forEach((d) => {
        map[d.id] = d.data();
      });
      setMenuItemsMap(map);
    });
    return unsubscribe;
  }, []);

  // ─── Derive table status from sessions ───
  function getTableStatus(table) {
    if (!table.current_session_id) return 'empty';
    const session = sessions.find((s) => s.id === table.current_session_id);
    if (!session) return 'empty';
    return session.status || 'open';
  }

  function getTableSession(table) {
    if (!table.current_session_id) return null;
    return sessions.find((s) => s.id === table.current_session_id) || null;
  }

  // ─── Load cart items when a table is selected ───
  async function handleSelectTable(table) {
    const session = getTableSession(table);
    if (!session) {
      setSelectedTable({ ...table, session: null });
      setCartItems([]);
      return;
    }

    setSelectedTable({ ...table, session });
    setCartLoading(true);
    try {
      const cartRef = collection(
        db, 'restaurants', RESTAURANT_ID, 'sessions', session.id, 'cart_items'
      );
      const cartSnap = await getDocs(cartRef);
      const items = cartSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCartItems(items);
    } catch (err) {
      console.error('Error loading cart:', err);
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  }

  // Also set up a real-time listener for cart items when a table is selected
  useEffect(() => {
    if (!selectedTable?.session?.id) return;

    const cartRef = collection(
      db, 'restaurants', RESTAURANT_ID, 'sessions', selectedTable.session.id, 'cart_items'
    );
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCartItems(items);
      setCartLoading(false);
    });
    return unsubscribe;
  }, [selectedTable?.session?.id]);

  // ─── Checkout: close session + reset table (batched write) ───
  async function handleCheckout() {
    if (!selectedTable?.session) return;
    if (!window.confirm('Mark this table as paid and close the session?')) return;

    setCheckoutLoading(true);
    try {
      const batch = writeBatch(db);

      // 1. Update session status to "closed"
      const sessionRef = doc(
        db, 'restaurants', RESTAURANT_ID, 'sessions', selectedTable.session.id
      );
      batch.update(sessionRef, { status: 'closed' });

      // 2. Reset table's current_session_id to null
      const tableRef = doc(
        db, 'restaurants', RESTAURANT_ID, 'tables', selectedTable.id
      );
      batch.update(tableRef, { current_session_id: null });

      await batch.commit();

      setSelectedTable(null);
      setCartItems([]);
    } catch (err) {
      console.error('Error during checkout:', err);
      alert('Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  // ─── Sort tables: active first, then by table number ───
  const sortedTables = [...tables].sort((a, b) => {
    const statusA = getTableStatus(a);
    const statusB = getTableStatus(b);
    const prioA = STATUS_CONFIG[statusA]?.priority ?? 5;
    const prioB = STATUS_CONFIG[statusB]?.priority ?? 5;
    if (prioA !== prioB) return prioA - prioB;
    return (a.table_number || 0) - (b.table_number || 0);
  });

  // ─── Calculate order total ───
  function calcTotal() {
    return cartItems.reduce((sum, ci) => {
      const menuItem = menuItemsMap[ci.item_id];
      const itemPrice = menuItem?.price || 0;
      return sum + itemPrice * (ci.quantity || 1);
    }, 0);
  }

  // ─── Stats ───
  const activeSessions = sessions.length;
  const orderedCount = sessions.filter((s) => s.status === 'ordered').length;
  const billedCount = sessions.filter((s) => s.status === 'billed').length;

  if (loading) {
    return (
      <div className="page-placeholder-container">
        <div className="page-header">
          <h1 className="page-title">Active Orders</h1>
        </div>
        <div className="loading-screen" style={{ height: '40vh' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="pos-page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Active Orders</h1>
          <p className="page-subtitle">
            {activeSessions} active session{activeSessions !== 1 ? 's' : ''} &bull;
            {orderedCount} ordered &bull; {billedCount} billed
          </p>
        </div>
      </div>

      {/* ── Status Legend ── */}
      <div className="pos-legend">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="pos-legend-item">
            <div className={`pos-legend-dot ${cfg.cssClass}`} />
            <span>{cfg.label}</span>
          </div>
        ))}
      </div>

      <div className="pos-layout">
        {/* ── Tables Grid ── */}
        <div className="pos-grid-area">
          {tables.length === 0 ? (
            <div className="placeholder-empty-state" style={{ padding: '60px 24px' }}>
              <div className="empty-state-icon-wrap">
                <HiOutlineClipboardList className="empty-state-icon" />
              </div>
              <h2 className="empty-state-title">No Tables Configured</h2>
              <p className="empty-state-desc">
                Go to Table Management to add tables first.
              </p>
            </div>
          ) : (
            <div className="pos-grid">
              {sortedTables.map((table) => {
                const status = getTableStatus(table);
                const cfg = STATUS_CONFIG[status];
                const session = getTableSession(table);
                const isSelected = selectedTable?.id === table.id;

                return (
                  <button
                    key={table.id}
                    className={`pos-table-tile ${cfg.cssClass} ${isSelected ? 'pos-table-tile--selected' : ''}`}
                    onClick={() => handleSelectTable(table)}
                    id={`pos-table-${table.id}`}
                  >
                    <span className="pos-table-number">#{table.table_number}</span>
                    <span className="pos-table-status-badge">{cfg.label}</span>
                    {session && (
                      <div className="pos-table-meta">
                        <HiOutlineUserGroup />
                        <span>{session.users?.length || 0}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Order Detail Panel ── */}
        {selectedTable && (
          <div className="pos-detail-panel">
            <div className="pos-detail-header">
              <div>
                <h2 className="pos-detail-title">Table #{selectedTable.table_number}</h2>
                <span className={`pos-detail-status ${STATUS_CONFIG[getTableStatus(selectedTable)]?.cssClass}`}>
                  {STATUS_CONFIG[getTableStatus(selectedTable)]?.label}
                </span>
              </div>
              <button
                className="modal-close"
                onClick={() => { setSelectedTable(null); setCartItems([]); }}
                aria-label="Close panel"
              >
                <HiOutlineX />
              </button>
            </div>

            {!selectedTable.session ? (
              <div className="pos-detail-empty">
                <p>This table has no active session.</p>
              </div>
            ) : (
              <>
                {/* Session info */}
                <div className="pos-session-info">
                  <div className="pos-session-meta">
                    <HiOutlineClock />
                    <span>
                      {selectedTable.session.created_at
                        ? new Date(selectedTable.session.created_at.seconds * 1000).toLocaleTimeString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="pos-session-meta">
                    <HiOutlineUserGroup />
                    <span>{selectedTable.session.users?.length || 0} guest{(selectedTable.session.users?.length || 0) !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Cart Items */}
                <div className="pos-cart-section">
                  <h3 className="pos-cart-title">Order Items</h3>
                  {cartLoading ? (
                    <div className="loading-screen" style={{ height: '80px' }}>
                      <div className="loading-spinner" style={{ width: 24, height: 24 }} />
                    </div>
                  ) : cartItems.length === 0 ? (
                    <p className="pos-cart-empty">No items in cart yet.</p>
                  ) : (
                    <div className="pos-cart-list">
                      {cartItems.map((ci) => {
                        const menuItem = menuItemsMap[ci.item_id];
                        return (
                          <div key={ci.id} className="pos-cart-item">
                            <div className="pos-cart-item-info">
                              <span className="pos-cart-item-qty">{ci.quantity}x</span>
                              <div>
                                <span className="pos-cart-item-name">
                                  {menuItem?.name || ci.item_id}
                                </span>
                                {ci.modifiers && ci.modifiers.length > 0 && (
                                  <span className="pos-cart-item-mods">
                                    {ci.modifiers.map((m) => m.label || m).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="pos-cart-item-price">
                              ₹{(menuItem?.price || 0) * (ci.quantity || 1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Total & Checkout */}
                {cartItems.length > 0 && (
                  <div className="pos-total-section">
                    <div className="pos-total-row">
                      <span className="pos-total-label">Total</span>
                      <span className="pos-total-amount">₹{calcTotal()}</span>
                    </div>
                  </div>
                )}

                <div className="pos-detail-actions">
                  <button
                    className="btn btn--primary pos-checkout-btn"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    id="mark-paid-btn"
                  >
                    {checkoutLoading ? (
                      <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    ) : (
                      <>
                        <HiOutlineCash />
                        Mark as Paid
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
