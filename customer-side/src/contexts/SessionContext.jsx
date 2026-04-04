import { createContext, useContext, useState, useCallback } from 'react';

const SessionContext = createContext(null);

/**
 * Generate a random guest ID like "Guest-482".
 * Persisted in sessionStorage so the same browser tab keeps its identity.
 */
function generateGuestId() {
  const stored = sessionStorage.getItem('uno_guest_id');
  if (stored) return stored;

  const suffix = Math.floor(100 + Math.random() * 900); // 3-digit number
  const id = `Guest-${suffix}`;
  sessionStorage.setItem('uno_guest_id', id);
  return id;
}

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [tableId, setTableId] = useState(null);
  const [tableNumber, setTableNumber] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [userId] = useState(() => generateGuestId());

  const setSessionData = useCallback(({ sessionId, tableId, tableNumber, status }) => {
    if (sessionId !== undefined) setSessionId(sessionId);
    if (tableId !== undefined) setTableId(tableId);
    if (tableNumber !== undefined) setTableNumber(tableNumber);
    if (status !== undefined) setSessionStatus(status);
  }, []);

  const clearSession = useCallback(() => {
    setSessionId(null);
    setTableId(null);
    setTableNumber(null);
    setSessionStatus(null);
  }, []);

  const value = {
    sessionId,
    tableId,
    tableNumber,
    sessionStatus,
    userId,
    setSessionData,
    clearSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
