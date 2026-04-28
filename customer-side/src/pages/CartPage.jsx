import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import useTableSession from '../hooks/useTableSession';
import SharedCartList from '../components/SharedCartList';
import HostApprovalPanel from '../components/HostApprovalPanel';
import { submitOrder } from '../lib/sessionService';

export default function CartPage() {
  const { sessionId, tableNumber, sessionStatus } = useSession();
  const { cartItems, loading } = useTableSession();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // No session guard
  if (!sessionId) {
    return (
      <div className="no-session">
        <div className="no-session__icon">📱</div>
        <h2 className="no-session__title">No Active Session</h2>
        <p className="no-session__text">Please scan a QR code at your table to view your cart.</p>
      </div>
    );
  }

  const isLocked = sessionStatus === 'ordered' || sessionStatus === 'billed' || sessionStatus === 'closed';

  // Calculate totals
  const subtotal = cartItems.reduce((sum, ci) => {
    const modPrice = (ci.modifiers || []).reduce((ms, m) => ms + (m.price || 0), 0);
    return sum + ((ci.item_price || 0) + modPrice) * (ci.quantity || 1);
  }, 0);

  async function handleCheckout() {
    if (submitting || isLocked || cartItems.length === 0) return;
    if (!window.confirm('Submit your order? The cart will be locked for everyone.')) return;

    setSubmitting(true);
    try {
      await submitOrder(sessionId);
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
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
        <button className="btn--ghost" onClick={() => navigate('/menu')} style={{ fontSize: 16, fontWeight: 600 }}>
          ← Menu
        </button>
        <div className="topbar-info">
          <span className="topbar-table-badge">🍽 Table #{tableNumber}</span>
        </div>
      </header>

      <HostApprovalPanel />

      {isLocked && (
        <div className="session-locked">
          ✓ Order submitted — your food is being prepared!
        </div>
      )}

      <div className="app-content">
        <div className="cart-page">
          <h1 className="cart-page__title">Your Cart</h1>
          <p className="cart-page__subtitle">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} from Table #{tableNumber}
          </p>

          <SharedCartList items={cartItems} />

          {cartItems.length > 0 && (
            <div className="cart-summary">
              <div className="cart-summary__row">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="cart-summary__row cart-summary__row--total">
                <span>Total</span>
                <span>₹{subtotal}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout button */}
      {cartItems.length > 0 && !isLocked && (
        <div className="app-bottombar">
          <button
            className="btn btn--primary btn--full btn--lg"
            onClick={handleCheckout}
            disabled={submitting}
            id="checkout-btn"
          >
            {submitting ? (
              <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            ) : (
              <>Submit Order — ₹{subtotal}</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
