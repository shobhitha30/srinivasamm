import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [city, setCity] = useState(profile?.city || '');
  const [state, setState] = useState(profile?.state || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [status, setStatus] = useState('idle'); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    try {
      setStatus('saving');
      await updateProfile(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        country: country.trim() || null,
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Could not update profile. Please try again.');
      setStatus('error');
    }
  };

  const roleLabel = {
    donor: 'Donor',
    orphanage: 'Orphanage Partner / NGO',
    orphanage_admin: 'Orphanage Administrator',
    volunteer: 'Volunteer',
    platform_admin: 'Platform Admin',
  }[profile?.role] ?? profile?.role ?? 'Donor';

  return (
    <div className="page-container" style={{ paddingTop: '2rem', paddingBottom: '3rem', maxWidth: '720px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>Your Account</span>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          Profile Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your personal information and preferences.
        </p>
      </div>

      {/* ── Account info card ── */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{
          width: '64px', height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-500), var(--cta))',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {(profile?.full_name || user?.email || 'D').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--gray-900)' }}>
            {profile?.full_name || 'Your Name'}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            {user?.email}
          </div>
          <span className="badge badge-verified" style={{ marginTop: '0.5rem' }}>{roleLabel}</span>
        </div>
      </div>

      {/* ── Edit form ── */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '1.5rem' }}>
          Personal Information
        </h2>

        {status === 'success' && (
          <div className="alert alert-success mb-md" role="status">
             Profile updated successfully!
          </div>
        )}
        {errorMsg && (
          <div className="alert alert-error mb-md" role="alert">{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="profile-name" className="form-label">Full Name</label>
            <input
              id="profile-name"
              type="text"
              className="form-input"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-email" className="form-label">Email Address</label>
            <input
              id="profile-email"
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.65, cursor: 'not-allowed', background: 'var(--gray-50)' }}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Email cannot be changed here. Contact support if needed.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="profile-phone" className="form-label">Phone Number <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
            <input
              id="profile-phone"
              type="tel"
              className="form-input"
              placeholder="+1 555 000 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="profile-city" className="form-label">City</label>
              <input
                id="profile-city"
                type="text"
                className="form-input"
                placeholder="e.g. New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="profile-state" className="form-label">State / Province</label>
              <input
                id="profile-state"
                type="text"
                className="form-input"
                placeholder="e.g. NY"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profile-country" className="form-label">Country</label>
            <input
              id="profile-country"
              type="text"
              className="form-input"
              placeholder="e.g. United States"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={status === 'saving'}
            style={{ marginTop: '0.5rem' }}
          >
            {status === 'saving' ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* ── Account Actions ── */}
      <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '1rem' }}>
          Account Actions
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href="/forgot-password"
            className="btn btn-outline btn-sm"
          >
            Change Password
          </a>
        </div>
      </div>
    </div>
  );
}
