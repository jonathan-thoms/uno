import { useState, useRef } from 'react';
import { useSession } from '../contexts/SessionContext';
import useMenu from '../hooks/useMenu';
import useTableSession from '../hooks/useTableSession';
import MenuItemCard from '../components/MenuItemCard';
import ModifierModal from '../components/ModifierModal';
import HostApprovalPanel from '../components/HostApprovalPanel';
import { addCartItem } from '../lib/sessionService';
import { useNavigate } from 'react-router-dom';

export default function MenuPage() {
  const { sessionId, tableNumber, userId, nickname, sessionStatus } = useSession();
  const { categories, itemsByCategory, loading: menuLoading } = useMenu();
  const { cartItems, loading: sessionLoading } = useTableSession();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // No session guard
  if (!sessionId) {
    return (
      <div className="no-session">
        <div className="no-session__icon">📱</div>
        <h2 className="no-session__title">No Active Session</h2>
        <p className="no-session__text">Please scan a QR code at your table to start ordering.</p>
      </div>
    );
  }

  const isLocked = sessionStatus === 'ordered' || sessionStatus === 'billed' || sessionStatus === 'closed';

  function showToast(message, type = 'success') {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  async function handleAddToCart(item, modifiers) {
    setAddingToCart(true);
    try {
      await addCartItem(sessionId, {
        itemId: item.id,
        itemName: item.name,
        itemPrice: item.price,
        quantity: 1,
        modifiers,
        userId,
        nickname,
      });
      showToast(`${item.name} added to cart`);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error adding to cart:', err);
      showToast('Failed to add item', 'error');
    } finally {
      setAddingToCart(false);
    }
  }

  function handleItemClick(item) {
    if (isLocked) return;
    if (item.modifier_groups && item.modifier_groups.length > 0) {
      setSelectedItem(item);
    } else {
      handleAddToCart(item, []);
    }
  }

  // Determine displayed items
  const displayCategory = activeCategory || categories[0] || null;

  const cartTotal = cartItems.reduce((sum, ci) => {
    const price = ci.item_price || 0;
    const modPrice = (ci.modifiers || []).reduce((ms, m) => ms + (m.price || 0), 0);
    return sum + (price + modPrice) * (ci.quantity || 1);
  }, 0);

  const cartCount = cartItems.reduce((sum, ci) => sum + (ci.quantity || 1), 0);

  if (menuLoading || sessionLoading) {
    return (
      <div className="loading-screen" style={{ minHeight: '100dvh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="app-topbar">
        <span className="topbar-brand">UNO</span>
        <div className="topbar-info">
          <span className="topbar-table-badge">🍽 Table #{tableNumber}</span>
        </div>
      </header>

      {/* Host approval panel */}
      <HostApprovalPanel />

      {/* Locked banner */}
      {isLocked && (
        <div className="session-locked">
          ✓ Order submitted — your food is being prepared!
        </div>
      )}

      <div className="app-content">
        <div className="menu-page">
          {/* Category strip */}
          {categories.length > 0 && (
            <div className="category-strip">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-chip ${(displayCategory === cat) ? 'category-chip--active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Menu items */}
          {categories.length === 0 ? (
            <div className="no-session" style={{ padding: '60px 24px' }}>
              <div className="no-session__icon">📋</div>
              <h2 className="no-session__title">Menu Coming Soon</h2>
              <p className="no-session__text">The restaurant hasn't added menu items yet.</p>
            </div>
          ) : (
            <div className="menu-section">
              <h2 className="menu-section-title">{displayCategory}</h2>
              {(itemsByCategory[displayCategory] || []).map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAdd={() => handleItemClick(item)}
                  disabled={isLocked}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar - cart summary */}
      {cartCount > 0 && !isLocked && (
        <div className="app-bottombar">
          <button
            className="btn btn--primary btn--full btn--lg"
            onClick={() => navigate('/cart')}
            id="view-cart-btn"
          >
            <span>View Cart ({cartCount})</span>
            <span>₹{cartTotal}</span>
          </button>
        </div>
      )}

      {/* Modifier modal */}
      {selectedItem && (
        <ModifierModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onConfirm={(modifiers) => handleAddToCart(selectedItem, modifiers)}
          loading={addingToCart}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
