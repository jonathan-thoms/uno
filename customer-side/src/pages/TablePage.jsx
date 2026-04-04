import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import {
  getTableDoc,
  createNewSession,
  addUserToSession,
  getSessionDoc,
} from '../lib/sessionService';

/**
 * TablePage — Core Phase 3 entry point.
 * URL: /table/:tableId
 *
 * 1. Reads tableId from URL params
 * 2. Queries Firestore for the table document
 * 3. If no active session → creates one (transaction-safe)
 * 4. If active session → joins it (adds user to session's users array)
 * 5. Stores session data in React Context
 * 6. Redirects to menu view
 */
export default function TablePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { userId, setSessionData, sessionId: ctxSessionId } = useSession();

  const [status, setStatus] = useState('loading'); // loading | error | ready
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      try {
        setStatus('loading');

        // Step 1: Get the table document
        const table = await getTableDoc(tableId);
        if (cancelled) return;

        if (!table) {
          setStatus('error');
          setErrorMsg('Table not found. Please scan a valid QR code.');
          return;
        }

        let activeSessionId = table.current_session_id;

        if (!activeSessionId) {
          // Step 2a: No active session — create one
          activeSessionId = await createNewSession(tableId, userId);
          if (cancelled) return;
        } else {
          // Step 2b: Active session exists — join it
          await addUserToSession(activeSessionId, userId);
          if (cancelled) return;
        }

        // Step 3: Fetch session to get its status
        const session = await getSessionDoc(activeSessionId);
        if (cancelled) return;

        // Step 4: Store everything in context
        setSessionData({
          sessionId: activeSessionId,
          tableId: tableId,
          tableNumber: table.table_number,
          status: session?.status || 'open',
        });

        setStatus('ready');

        // Step 5: Redirect to menu
        navigate('/menu', { replace: true });
      } catch (err) {
        if (cancelled) return;
        console.error('Session init error:', err);

        if (err.message === 'TABLE_NOT_FOUND') {
          setErrorMsg('Table not found. Please scan a valid QR code.');
        } else {
          setErrorMsg('Something went wrong. Please try again.');
        }
        setStatus('error');
      }
    }

    initSession();

    return () => {
      cancelled = true;
    };
  }, [tableId, userId, setSessionData, navigate]);

  if (status === 'loading') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Setting up your table session...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Oops!</h2>
        <p>{errorMsg}</p>
      </div>
    );
  }

  // Brief redirect state — user should be navigated to /menu
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Redirecting to menu...</p>
    </div>
  );
}
