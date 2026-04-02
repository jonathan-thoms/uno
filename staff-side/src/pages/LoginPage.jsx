import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowRight } from 'react-icons/hi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Ambient background effects */}
      <div className="login-bg-orb login-bg-orb--1" />
      <div className="login-bg-orb login-bg-orb--2" />
      <div className="login-bg-orb login-bg-orb--3" />

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span className="login-logo-icon">🍽</span>
          </div>
          <h1 className="login-title">UNO</h1>
          <p className="login-subtitle">Staff & Operations Portal</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error" role="alert">
              <span className="login-error-icon">⚠</span>
              {error}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-email" className="login-label">Email</label>
            <div className="login-input-wrap">
              <HiOutlineMail className="login-input-icon" />
              <input
                id="login-email"
                type="email"
                className="login-input"
                placeholder="admin@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password" className="login-label">Password</label>
            <div className="login-input-wrap">
              <HiOutlineLockClosed className="login-input-icon" />
              <input
                id="login-password"
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? (
              <span className="login-btn-loader" />
            ) : (
              <>
                Sign In
                <HiOutlineArrowRight className="login-btn-icon" />
              </>
            )}
          </button>
        </form>

        <p className="login-footer">
          UNO Restaurant Management &bull; V1.0
        </p>
      </div>
    </div>
  );
}
