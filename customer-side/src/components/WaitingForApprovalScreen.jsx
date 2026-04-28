/**
 * WaitingForApprovalScreen — Shown to joiners while their
 * join request is pending host approval.
 */
export default function WaitingForApprovalScreen({ nickname }) {
  return (
    <div className="screen-center waiting-screen">
      <div className="screen-center__icon">⏳</div>
      <h1 className="screen-center__title">Hang tight, {nickname}!</h1>
      <p className="screen-center__subtitle">
        Your request to join has been sent. Waiting for the host to approve you.
      </p>
      <div className="waiting-spinner" />
    </div>
  );
}
