import { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { listenToSession, listenToCartItems } from '../lib/sessionService';

/**
 * useTableSession — Real-time hook for the active session and its cart items.
 * Uses Firestore onSnapshot listeners.
 *
 * Returns { session, cartItems, loading }
 */
export default function useTableSession() {
  const { sessionId, setSessionStatus } = useSession();
  const [session, setSession] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen to session document
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToSession(sessionId, (sessionData) => {
      setSession(sessionData);
      setSessionStatus(sessionData.status);
      setLoading(false);
    });

    return unsubscribe;
  }, [sessionId, setSessionStatus]);

  // Listen to cart items sub-collection
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = listenToCartItems(sessionId, (items) => {
      setCartItems(items);
    });

    return unsubscribe;
  }, [sessionId]);

  return { session, cartItems, loading };
}
