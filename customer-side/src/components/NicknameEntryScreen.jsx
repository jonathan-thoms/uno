import { useState } from 'react';

/**
 * NicknameEntryScreen — Prompts user for a display name before
 * joining or hosting a session.
 */
export default function NicknameEntryScreen({ tableNumber, onSubmit, loading }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && !loading) {
      onSubmit(trimmed);
    }
  }

  return (
    <div className="screen-center nickname-screen">
      <div className="screen-center__icon">🍽</div>
      <h1 className="screen-center__title">Welcome to Table #{tableNumber}</h1>
      <p className="screen-center__subtitle">
        Enter your name so everyone at the table knows who's ordering what.
      </p>

      <form className="nickname-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="nickname-input"
          placeholder="Your name (e.g. Rahul)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
          required
          id="nickname-input"
        />
        <button
          type="submit"
          className="btn btn--primary btn--full btn--lg"
          disabled={!name.trim() || loading}
          id="nickname-submit-btn"
        >
          {loading ? (
            <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
          ) : (
            "Let's Go"
          )}
        </button>
      </form>
    </div>
  );
}
