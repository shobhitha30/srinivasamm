import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';

// Hardcoded admin credentials (frontend-gated; replace with backend auth for production)
const ADMIN_EMAIL = 'admin@srinivasam.org';
const ADMIN_PASSWORD = 'Admin@2026!';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleFillDemo = () => {
    setEmail(ADMIN_EMAIL);
    setPassword(ADMIN_PASSWORD);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter admin email and password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      if (
        email.trim().toLowerCase() === ADMIN_EMAIL &&
        password === ADMIN_PASSWORD
      ) {
        sessionStorage.setItem('srinivasam_admin', 'true');
        navigate('/admin/dashboard');
      } else {
        setErrorMsg('Invalid admin credentials. Please try again.');
      }
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-brand">
          <div
            className="auth-brand-logo"
            style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}
            aria-hidden="true"
          ><Shield size={32} color="white"/></div>
          <h1 className="auth-title">Admin Portal</h1>
          <p className="auth-subtitle">Secure Access — Srinivasam Operations Staff</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
        >
          ← Back to roles
        </button>


        {errorMsg && (
          <div className="alert alert-error mb-md" role="alert">{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="admin-email" className="form-label">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              className="form-input"
              placeholder="admin@srinivasam.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex'
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            style={{ background: '#0f172a', borderColor: '#0f172a' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying Credentials…' : 'Access Admin Dashboard'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
          <Link to="/login">📍 Back to Donor Sign In</Link>
        </div>
      </div>
    </div>
  );
}
