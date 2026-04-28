/**
 * SharedCartList — Renders the real-time list of cart items.
 * Shows item name, who added it, modifiers, quantity, and price.
 */
export default function SharedCartList({ items = [] }) {
  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty__icon">🛒</div>
        <p className="cart-empty__text">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => {
        const modPrice = (item.modifiers || []).reduce((s, m) => s + (m.price || 0), 0);
        const itemPrice = (item.item_price || 0) + modPrice;
        const lineTotal = itemPrice * (item.quantity || 1);

        return (
          <div key={item.id} className="cart-item">
            <div className="cart-item__qty">{item.quantity || 1}</div>
            <div className="cart-item__body">
              <div className="cart-item__name">{item.item_name || item.item_id}</div>
              <div className="cart-item__user">Added by {item.added_by_nickname || 'unknown'}</div>
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="cart-item__mods">
                  {item.modifiers.map((m) => m.label).join(', ')}
                </div>
              )}
            </div>
            <div className="cart-item__price">₹{lineTotal}</div>
          </div>
        );
      })}
    </div>
  );
}
