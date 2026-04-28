/**
 * HomePage — Fallback landing page for users who don't arrive via QR scan.
 */
export default function HomePage() {
  return (
    <div className="screen-center" style={{ background: 'linear-gradient(160deg, #faf9f7 0%, #fff4ed 100%)' }}>
      <div className="screen-center__icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
        🍽
      </div>
      <h1 className="screen-center__title" style={{ fontSize: 28 }}>UNO</h1>
      <p className="screen-center__subtitle">
        Scan the QR code on your table to start ordering together with everyone at your table.
      </p>
    </div>
  );
}
