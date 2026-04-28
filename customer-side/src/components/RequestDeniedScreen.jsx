/**
 * RequestDeniedScreen — Shown when the host rejects a join request.
 */
export default function RequestDeniedScreen({ onRetry }) {
  return (
    <div className="screen-center denied-screen">
      <div className="screen-center__icon">✕</div>
      <h1 className="screen-center__title">Request Denied</h1>
      <p className="screen-center__subtitle">
        The host didn't approve your request to join this table. You can try again or ask them in person.
      </p>
      {onRetry && (
        <button
          className="btn btn--secondary"
          onClick={onRetry}
          style={{ marginTop: 24 }}
          id="retry-join-btn"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
