import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerOrphanage } from '../services/orphanageService';
import { ensureUserProfile } from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export function OrphanageRegister() {
  const { user, updateProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [formData, setFormData] = useState({
    orgName: '',
    registrationNumber: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: 'India',
    childrenCount: '',
    establishedYear: '',
    description: '',
  });

  // CRITICAL FIX: User must be logged in before submitting.
  // The RLS policy (orphanages_insert_own) requires auth.uid() = profile_id.
  // Unauthenticated submissions will always be blocked by Supabase.
  if (!user) {
    return (
      <div className="page-container max-w-xl text-center" style={{ padding: '5rem 1.5rem' }}>
        <div className="card p-2xl" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          <h1 className="text-2xl font-bold mb-md">Register Your Orphanage</h1>
          <p className="text-muted mb-lg leading-relaxed">
            You need to create an account first. During sign up, choose{' '}
            <strong>"I'm an Orphanage"</strong> to get started. You'll be
            redirected here automatically after signing up.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary">
              Create Orphanage Account →
            </Link>
            <Link to="/login" className="btn btn-outline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user || user;

      if (currentUser) {
        await ensureUserProfile(currentUser, formData.contactName, 'orphanage');
      }

      const result = await registerOrphanage(formData, currentUser?.id);

      // Update the profile role to 'orphanage' now that they have submitted.
      // The admin will then approve the orphanage, which confirms this role.
      if (currentUser?.id) {
        try {
          await updateProfile(currentUser.id, { role: 'orphanage' });
        } catch (roleErr) {
          console.warn('Role sync skipped:', roleErr?.message);
        }
      }

      setSubmittedResult(result);
    } catch (err) {
      console.error('Failed to register orphanage:', err);
      const msg = err?.message || err?.error_description || 'An unexpected error occurred during submission.';
      alert(`Submission note: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };



  if (submittedResult) {
    return (
      <div className="page-container max-w-xl text-center" style={{ padding: '4rem 1rem' }}>
        <div className="card p-2xl" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
          <span className="badge badge-success mb-sm">Application Received</span>
          <h2 className="text-2xl font-bold mb-md text-heading">Verification Process Initiated</h2>
          
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 12, margin: '1.5rem 0', border: '1px solid var(--border)', textAlign: 'left' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Application Tracking Reference</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-600)', margin: '0.25rem 0' }}>{submittedResult.tracking_id || 'SRI-APP-88412'}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-body)' }}>Organization: <strong>{formData.orgName}</strong></div>
          </div>

          <p className="text-muted mb-lg leading-relaxed" style={{ fontSize: '0.95rem' }}>
            Our ground verification team will review your registration credentials (Reg No: <strong>{formData.registrationNumber}</strong>) and contact <strong>{formData.contactName}</strong> within 2-3 business days.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/admin/dashboard" className="btn btn-primary">
              View Application in Admin Control Center &rarr;
            </Link>
            <Link to="/orphanage/dashboard" className="btn btn-outline">
              Partner Portal Demo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl" style={{ padding: '3rem 1.5rem' }}>
      <div className="text-center mb-2xl">
        <h1 className="text-3xl font-bold mb-sm">Register Your Orphanage</h1>
        <p className="text-muted text-lg max-w-xl mx-auto">
          Apply to join Srinivasam's verified non-profit network. Receive direct, 0%-fee donor contributions and material support for your children.
        </p>
      </div>

      <div className="card p-2xl">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="orgName">Organization / Trust Full Legal Name *</label>
            <input
              id="orgName"
              type="text"
              className="form-input"
              required
              placeholder="e.g. Sri Krishna Shanti Children Home"
              value={formData.orgName}
              onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="registrationNumber">Government Registration No / 12A / 80G *</label>
              <input
                id="registrationNumber"
                type="text"
                className="form-input"
                required
                placeholder="e.g. REG/DL/2018/00492"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="childrenCount">Number of Resident Children *</label>
              <input
                id="childrenCount"
                type="number"
                min="1"
                className="form-input"
                required
                placeholder="e.g. 45"
                value={formData.childrenCount}
                onChange={(e) => setFormData({ ...formData, childrenCount: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="contactName">Primary Trustee / Manager Name *</label>
              <input
                id="contactName"
                type="text"
                className="form-input"
                required
                placeholder="e.g. Dr. Rajeshwari Sharma"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Contact Phone Number *</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                required
                placeholder="e.g. +91 98450 12345"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Official Email Address *</label>
              <input
                id="email"
                type="email"
                className="form-input"
                required
                placeholder="trust@childrenhome.org"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="city">City & State *</label>
              <input
                id="city"
                type="text"
                className="form-input"
                required
                placeholder="e.g. Hassan, Karnataka"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">About Your Home & Care Mission</label>
            <textarea
              id="description"
              className="form-input"
              rows="4"
              placeholder="Tell us about the facilities, educational support, age groups of children, and urgent support needed..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          <div className="pt-md border-t" style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <Link to="/" className="btn btn-outline">Cancel</Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting Application...' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




