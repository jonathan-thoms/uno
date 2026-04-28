import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import {
  getTableDoc,
  getSessionDoc,
  createHostSession,
  submitJoinRequest,
  listenToJoinRequest,
} from '../lib/sessionService';
import NicknameEntryScreen from '../components/NicknameEntryScreen';
import WaitingForApprovalScreen from '../components/WaitingForApprovalScreen';
import RequestDeniedScreen from '../components/RequestDeniedScreen';

/**
 * TablePage — Core entry point from QR scan.
 * URL: /table/:tableId
 *
 * Flow:
 * 1. Fetch table document from Firestore
 * 2. Show NicknameEntryScreen
 * 3. If no active session → user becomes Host (creates session)
 * 4. If active session → user submits join request → waits for approval
 * 5. On approval → redirect to /menu
 */

// States: loading | nickname | creating | waiting | denied | error
export default function TablePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { userId, setNickname, setSessionData, nickname } = useSession();

  const [phase, setPhase] = useState('loading');
  const [tableData, setTableData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch table document on mount
  useEffect(() => {
    let cancelled = false;

    async function loadTable() {
      try {
        const table = await getTableDoc(tableId);
        if (cancelled) return;

        if (!table) {
          setErrorMsg('Table not found. Please scan a valid QR code.');
          setPhase('error');
          return;
        }

        setTableData(table);
        setPhase('nickname');
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading table:', err);
        setErrorMsg('Something went wrong. Please try again.');
        setPhase('error');
      }
    }

    loadTable();
    return () => { cancelled = true; };
  }, [tableId]);

  // Handle nickname submission
  const handleNicknameSubmit = useCallback(async (enteredNickname) => {
    setNickname(enteredNickname);
    setPhase('creating');

    try {
      // Re-fetch table to get latest session state
      const table = await getTableDoc(tableId);
      if (!table) {
        setErrorMsg('Table not found.');
        setPhase('error');
        return;
      }

      if (!table.current_session_id) {
        // ── HOST FLOW ──
        const { sessionId, alreadyExisted } = await createHostSession(
          tableId,
          userId,
          enteredNickname
        );

        if (alreadyExisted) {
          // Race condition: someone else created the session first, become a joiner
          await handleJoinFlow(sessionId, enteredNickname);
          return;
        }

        // Fetch session to get full data
        const session = await getSessionDoc(sessionId);

        setSessionData({
          sessionId,
          tableId,
          tableNumber: table.table_number,
          status: session?.status || 'open',
          isHost: true,
          hostId: userId,
        });

        navigate('/menu', { replace: true });
      } else {
        // ── JOINER FLOW ──
        await handleJoinFlow(table.current_session_id, enteredNickname);
      }
    } catch (err) {
      console.error('Session creation error:', err);
      setErrorMsg('Failed to set up session. Please try again.');
      setPhase('error');
    }
  }, [tableId, userId, setNickname, setSessionData, navigate]);

  // Joiner flow: submit request + listen for approval
  async function handleJoinFlow(sessionId, enteredNickname) {
    setPhase('waiting');

    try {
      const requestId = await submitJoinRequest(sessionId, userId, enteredNickname);

      // Listen for status changes on our join request
      const unsubscribe = listenToJoinRequest(sessionId, requestId, async (request) => {
        if (request.status === 'approved') {
          unsubscribe();

          const table = await getTableDoc(tableId);
          const session = await getSessionDoc(sessionId);

          setSessionData({
            sessionId,
            tableId,
            tableNumber: table?.table_number,
            status: session?.status || 'open',
            isHost: false,
            hostId: session?.host_id || null,
          });

          navigate('/menu', { replace: true });
        } else if (request.status === 'rejected') {
          unsubscribe();
          setPhase('denied');
        }
      });
    } catch (err) {
      console.error('Join request error:', err);
      setErrorMsg('Failed to send join request. Please try again.');
      setPhase('error');
    }
  }

  // Retry after denial
  function handleRetry() {
    setPhase('nickname');
  }

  // ── Render ──

  if (phase === 'loading' || phase === 'creating') {
    return (
      <div className="screen-center">
        <div className="spinner" />
        <p className="screen-center__subtitle" style={{ marginTop: 20 }}>
          {phase === 'loading' ? 'Finding your table...' : 'Setting up your session...'}
        </p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="screen-center">
        <div className="screen-center__icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>!</div>
        <h1 className="screen-center__title">Oops!</h1>
        <p className="screen-center__subtitle">{errorMsg}</p>
      </div>
    );
  }

  if (phase === 'nickname') {
    return (
      <NicknameEntryScreen
        tableNumber={tableData?.table_number}
        onSubmit={handleNicknameSubmit}
        loading={false}
      />
    );
  }

  if (phase === 'waiting') {
    return <WaitingForApprovalScreen nickname={nickname} />;
  }

  if (phase === 'denied') {
    return <RequestDeniedScreen onRetry={handleRetry} />;
  }

  return null;
}
