import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    try {
      setStatus('loading');
      await resetPassword(email.trim());
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message || 'Could not send reset email. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📧</div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
            We've sent a password reset link to <strong>{email}</strong>.
            Check your inbox and click the link to set a new password.
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Didn't receive the email? Check your spam folder, or{' '}
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
              onClick={() => setStatus('idle')}
            >
              try again
            </button>
            .
          </p>
          <Link to="/login" className="btn btn-outline btn-md btn-block"><ArrowLeft size={16}/> Back to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '420px' }}>
        <div className="auth-brand">
          <div className="auth-brand-logo" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-subtitle">
            Enter the email address you signed up with and we'll send you a reset link.
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-error mb-md" role="alert">{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="reset-email" className="form-label">Email address</label>
            <input
              id="reset-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          Remember your password?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
