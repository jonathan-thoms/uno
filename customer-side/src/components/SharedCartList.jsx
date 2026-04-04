/**
 * SharedCartList — Stub component for the shared cart items.
 * Will be connected to Firestore cart_items sub-collection in Phase 4.
 */
export default function SharedCartList({ items = [] }) {
  if (items.length === 0) {
    return <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Your cart is empty.</p>;
  }

  return (
    <div>
      {items.map((item, i) => (
        <div key={item.id || i} style={{ padding: '0.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>{item.name}</strong>
            <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '0.5rem' }}>
              by {item.added_by || 'unknown'}
            </span>
          </div>
          <span>x{item.quantity || 1}</span>
        </div>
      ))}
    </div>
  );
}
