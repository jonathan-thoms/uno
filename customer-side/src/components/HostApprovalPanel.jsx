import { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import {
  listenToPendingJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from '../lib/sessionService';

/**
 * HostApprovalPanel — Floating toast-style notifications that appear
 * when someone requests to join the host's table session.
 * Only renders for the host.
 */
export default function HostApprovalPanel() {
  const { sessionId, isHost } = useSession();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [processing, setProcessing] = useState(null); // requestId being processed

  useEffect(() => {
    if (!isHost || !sessionId) return;

    const unsubscribe = listenToPendingJoinRequests(sessionId, (requests) => {
      setPendingRequests(requests);
    });

    return unsubscribe;
  }, [isHost, sessionId]);

  async function handleApprove(request) {
    setProcessing(request.id);
    try {
      await approveJoinRequest(sessionId, request.id, request.user_id, request.nickname);
    } catch (err) {
      console.error('Error approving request:', err);
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(request) {
    setProcessing(request.id);
    try {
      await rejectJoinRequest(sessionId, request.id);
    } catch (err) {
      console.error('Error rejecting request:', err);
    } finally {
      setProcessing(null);
    }
  }

  if (!isHost || pendingRequests.length === 0) return null;

  return (
    <div className="host-panel">
      {pendingRequests.map((req) => (
        <div key={req.id} className="join-request-toast">
          <div className="join-request-avatar">
            {req.nickname?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="join-request-info">
            <div className="join-request-name">{req.nickname}</div>
            <div className="join-request-label">wants to join your table</div>
          </div>
          <div className="join-request-actions">
            <button
              className="btn btn--reject"
              onClick={() => handleReject(req)}
              disabled={processing === req.id}
            >
              ✕
            </button>
            <button
              className="btn btn--approve"
              onClick={() => handleApprove(req)}
              disabled={processing === req.id}
            >
              ✓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
