import { useState } from 'react';
import { loginAdmin, verifyMfaLogin } from './adminStore.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import './Admin.css';

function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    const { success, needsMfa, factorId, error: loginError } = await loginAdmin(username, password);
    setSubmitting(false);
    if (success) {
      setError('');
      onSuccess();
    } else if (needsMfa) {
      setError('');
      setMfaFactorId(factorId);
    } else {
      setError(loginError === 'Invalid login credentials' || !loginError ? 'Incorrect username or password.' : loginError);
    }
  };

  const handleMfaSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    const { error: verifyError } = await verifyMfaLogin(mfaFactorId, mfaCode);
    setSubmitting(false);
    if (verifyError) {
      setError('Incorrect authentication code.');
      setMfaCode('');
    } else {
      onSuccess();
    }
  };

  if (mfaFactorId) {
    return (
      <div className="admin-login-page">
        <a href="#home" className="admin-back">
          ← Back to site
        </a>
        <form className="admin-login-card" onSubmit={handleMfaSubmit}>
          <h1>Two-Factor Authentication</h1>
          <p className="admin-login-subtitle">Enter the 6-digit code from your authenticator app.</p>

          <div className="admin-field">
            <label htmlFor="mfaCode">Authentication code</label>
            <input
              type="text"
              id="mfaCode"
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
            />
          </div>

          {error && <p className="admin-login-error">{error}</p>}

          <button type="submit" className="admin-login-submit" disabled={submitting || mfaCode.length !== 6}>
            {submitting ? 'Verifying…' : 'Verify'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <a href="#home" className="admin-back">
        ← Back to site
      </a>
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        <p className="admin-login-subtitle">Sign in to manage appointments and availability.</p>

        <div className="admin-field">
          <label htmlFor="adminUsername">{isSupabaseConfigured ? 'Email' : 'Username'}</label>
          <input
            type={isSupabaseConfigured ? 'email' : 'text'}
            id="adminUsername"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={isSupabaseConfigured ? 'harsh@pancholidental.com' : 'Harsh Pancholi'}
            autoComplete="username"
            required
          />
        </div>

        <div className="admin-field">
          <label htmlFor="adminPassword">Password</label>
          <input
            type="password"
            id="adminPassword"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••••••••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="admin-login-error">{error}</p>}

        <button type="submit" className="admin-login-submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
