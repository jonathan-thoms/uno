import { useSession } from '../contexts/SessionContext';

/**
 * CartPage — Shared cart view (stub).
 * Reads session from context and displays placeholder.
 */
export default function CartPage() {
  const { sessionId, tableNumber, userId, sessionStatus } = useSession();

  if (!sessionId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>No Active Session</h2>
        <p>Please scan a QR code at your table to view your cart.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f0f0f0', borderRadius: '4px', fontSize: '0.85rem' }}>
        <strong>Table #{tableNumber}</strong> &bull; {userId} &bull; Session: {sessionStatus}
      </div>
      <h2>Shared Cart</h2>
      <p>Cart items will appear here once the real-time hook is implemented (Phase 4).</p>
    </div>
  );
}
