/**
 * MenuItemCard — Stub component for a single menu item.
 * Will be connected to Firestore menu data in Phase 4.
 */
export default function MenuItemCard({ item, onAdd }) {
  return (
    <div style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>{item?.name || 'Item Name'}</strong>
          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
            {item?.description || ''}
          </p>
          <span>${(item?.price || 0).toFixed(2)}</span>
        </div>
        <button onClick={() => onAdd?.(item)} style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}>
          Add
        </button>
      </div>
    </div>
  );
}
