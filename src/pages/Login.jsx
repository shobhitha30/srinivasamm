import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, HeartHandshake } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { normalizeRole, roleHome, roleLabel } from '../lib/roles';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  );
}

const TABS = [
  { id: 'donor', icon: '🤝', label: "I'm a Donor", subtitle: 'Sign in to your donor account' },
  { id: 'orphanage', icon: '🏛️', label: "I'm an Orphanage", subtitle: 'Orphanage / NGO portal access' },
  { id: 'volunteer', icon: '🌟', label: "I'm a Volunteer", subtitle: 'Volunteer portal access' },
  { id: 'admin', icon: '🛡️', label: 'Admin', subtitle: 'Staff-only secure access' },
];

export function Login() {
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('donor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signInWithPassword, signInWithGoogle, setNotice } = useAuth();
  const navigate = useNavigate();

  const currentTab = TABS.find((t) => t.id === activeTab);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setErrorMsg('');
  };

  const handleRoleSelect = (tabId) => {
    setActiveTab(tabId);
    resetForm();
    if (tabId === 'admin') {
      navigate('/admin/login');
    } else {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email address and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await signInWithPassword(email.trim(), password);
      const role =
        normalizeRole(result?.profile?.role || result?.user?.user_metadata?.role) || 'donor';

      if (role !== activeTab) {
        setNotice({
          type: 'info',
          text: `This email is registered as a ${roleLabel(
            role
          )} account, so we've taken you to your ${roleLabel(role)} portal.`,
        });
      }
      navigate(roleHome(role), { replace: true });
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        setErrorMsg('Incorrect email or password. Please try again.');
      } else if (msg.includes('Email not confirmed')) {
        setErrorMsg('Your email address has not been confirmed yet. Please check your inbox for the confirmation link.');
      } else {
        setErrorMsg(msg || 'Sign in failed. Please check your credentials and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async (role) => {
    try {
      setErrorMsg('');
      await signInWithGoogle(role);
    } catch (err) {
      setErrorMsg(err.message || 'Could not start Google sign-in. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '460px' }}>
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-logo" aria-hidden="true"><HeartHandshake size={32} color="var(--primary-600)"/></div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">{step === 1 ? 'Sign in to your account' : currentTab.subtitle}</p>
        </div>

        {/* Step 1: Role Selector */}
        {step === 1 && (
          <div className="signup-type-selector" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`signup-type-btn${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => handleRoleSelect(tab.id)}
              >
                <span className="signup-type-icon">{tab.icon}</span>
                <span className="signup-type-label">{tab.label}</span>
                <span className="signup-type-desc">{tab.subtitle}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
          <>
            <button
              type="button"
              onClick={() => { setStep(1); setErrorMsg(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              ← Back to roles
            </button>

            {errorMsg && (
              <div className="alert alert-error mb-md" role="alert">{errorMsg}</div>
            )}

            <button type="button" onClick={() => handleGoogle(activeTab)} className="btn-google mb-md">
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="divider mb-md">
              <span>or sign in with email</span>
            </div>

            {/* Shared email/password form */}
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="login-password" className="form-label">Password</label>
              {activeTab === 'donor' && (
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '0.8rem', color: 'var(--primary-600)', fontWeight: 500 }}
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
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
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex'
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : `Sign in${activeTab === 'orphanage' ? ' to Orphanage Portal' : ''}`}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
}
