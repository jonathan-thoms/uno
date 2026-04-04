/**
 * ModifierModal — Stub component for item customization.
 * Will be connected to modifier_groups data in Phase 4.
 */
export default function ModifierModal({ item, isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem', width: '90%', maxWidth: '400px' }}>
        <h3>Customize: {item?.name}</h3>
        <p style={{ color: '#666', margin: '0.5rem 0' }}>Modifier options will appear here.</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.5rem', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => onConfirm?.(item, [])} style={{ flex: 1, padding: '0.5rem', cursor: 'pointer', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
