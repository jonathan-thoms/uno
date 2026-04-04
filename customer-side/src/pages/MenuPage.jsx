import { useSession } from '../contexts/SessionContext';

/**
 * MenuPage — Placeholder for the menu browsing experience.
 * Displays session info to confirm context is working.
 */
export default function MenuPage() {
  const { sessionId, tableId, tableNumber, userId, sessionStatus } = useSession();

  if (!sessionId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>No Active Session</h2>
        <p>Please scan a QR code at your table to start ordering.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f0f0f0', borderRadius: '4px', fontSize: '0.85rem' }}>
        <strong>Table #{tableNumber}</strong> &bull; {userId} &bull; Session: {sessionStatus}
      </div>
      <h2>Menu</h2>
      <p>Menu items will appear here once connected to Firestore menu data.</p>
    </div>
  );
}
