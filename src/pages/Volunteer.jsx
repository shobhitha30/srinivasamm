import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerVolunteer } from '../services/volunteerService';
import { useAuth } from '../context/AuthContext';

export function Volunteer() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    location: '',
    availability: '2-4 hours / week',
    skills: '',
    interests: '',
  });

  if (!user) {
    return (
      <div className="page-container max-w-xl text-center" style={{ padding: '5rem 1.5rem' }}>
        <div className="card p-2xl" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🙌</div>
          <h1 className="text-2xl font-bold mb-md">Become a Volunteer</h1>
          <p className="text-muted mb-lg" style={{ lineHeight: 1.7 }}>
            You must be logged in to register as a volunteer. Create a free account or sign in to continue.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary btn-md">Login to Continue</Link>
            <Link to="/signup" className="btn btn-outline btn-md">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      const interestsArray = formData.interests.split(',').map(s => s.trim()).filter(Boolean);
      
      const result = await registerVolunteer({
        ...formData,
        skills: skillsArray,
        interests: interestsArray
      });

      // CRITICAL: Update the user's profile role to 'volunteer' so the
      // VolunteerLayout guard allows access to /volunteer/dashboard.
      await updateProfile(user.id, { role: 'volunteer' });

      setSubmittedResult(result);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="page-container max-w-xl text-center" style={{ padding: '4rem 1rem' }}>
        <div className="card p-2xl" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🌟</div>
          <span className="badge badge-accent mb-sm">Registration Successful</span>
          <h2 className="text-2xl font-bold mb-md text-heading">Welcome to the Srinivasam Network</h2>
          
          <p className="text-muted mb-lg leading-relaxed" style={{ fontSize: '0.95rem' }}>
            Thank you for stepping forward! Your application is now pending admin review.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/volunteer/dashboard" className="btn btn-primary">
              Open Volunteer Workspace →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl" style={{ padding: '3rem 1.5rem' }}>
      <div className="page-header text-center mb-xl">
        <span className="badge badge-accent mb-sm">Community Action</span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--gray-900)' }}>Volunteer with Srinivasam</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 580, margin: '0.5rem auto 0' }}>
          Join our global network of volunteers making non-profit giving transparent and impactful.
        </p>
      </div>

      <div className="card p-2xl" style={{ border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        {error && <div className="alert alert-error mb-md">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-lg">
          
          <div className="form-group">
            <label className="form-label" htmlFor="location">Current Location (City, Country) *</label>
            <input
              id="location"
              type="text"
              className="form-input"
              placeholder="e.g. San Jose, USA or Hyderabad, India"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="availability">Weekly Availability</label>
            <select
              id="availability"
              className="form-select"
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
            >
              <option value="1-2 hours / week">1-2 hours / week</option>
              <option value="2-4 hours / week">2-4 hours / week</option>
              <option value="5+ hours / week">5+ hours / week</option>
              <option value="Weekend Visits Only">Weekend Visits Only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="skills">Relevant Skills (comma separated) *</label>
            <input
              id="skills"
              type="text"
              className="form-input"
              placeholder="e.g. Software Engineering, Accounting, Photography"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="interests">Interests (comma separated) *</label>
            <input
              id="interests"
              type="text"
              className="form-input"
              placeholder="e.g. Teaching, Mentoring, Ground Audits"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              required
            />
          </div>

          <div className="pt-md">
            <button
              type="submit"
              className="btn btn-cta btn-lg btn-block shadow-md"
              disabled={submitting}
            >
              {submitting ? 'Registering...' : 'Complete Volunteer Registration →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
