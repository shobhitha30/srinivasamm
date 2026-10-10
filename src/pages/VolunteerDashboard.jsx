import React, { useState, useEffect } from 'react';
import { getMyVolunteerProfile, getMyAssignments, acceptAssignment, declineAssignment, completeAssignment } from '../services/volunteerService';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export function VolunteerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (user) {
        try {
          const prof = await getMyVolunteerProfile();
          setProfile(prof);
          if (prof) {
            const assign = await getMyAssignments();
            setAssignments(assign || []);
          }
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleAccept = async (id) => {
    try {
      await acceptAssignment(id);
      const assign = await getMyAssignments();
      setAssignments(assign || []);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDecline = async (id) => {
    try {
      await declineAssignment(id);
      const assign = await getMyAssignments();
      setAssignments(assign || []);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeAssignment(id);
      const assign = await getMyAssignments();
      setAssignments(assign || []);
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div className="page-container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;

  if (!profile) {
    return (
      <div className="page-container max-w-3xl" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 className="text-2xl font-bold mb-md">Welcome</h2>
        <p className="text-muted mb-lg">You haven't registered as a volunteer yet.</p>
        <Link to="/volunteer" className="btn btn-primary">Become a Volunteer</Link>
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl" style={{ padding: '2.5rem 1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>Volunteer Dashboard</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Welcome back! Here are your assignments.</p>
        </div>
        <div>
          <span className={`badge badge-${profile.status === 'available' ? 'success' : profile.status === 'busy' ? 'warning' : 'neutral'}`}>
            Status: {profile.status?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-md">Your Assignments</h3>
        {assignments.length === 0 ? (
          <p className="text-muted">No assignments found.</p>
        ) : (
          <div className="space-y-md">
            {assignments.map(a => (
              <div key={a.id} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{a.volunteer_requests?.title}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <strong>Orphanage:</strong> {a.volunteer_requests?.orphanages?.name}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <strong>Date:</strong> {new Date(a.volunteer_requests?.start_time).toLocaleString()}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <strong>Skills:</strong> {a.volunteer_requests?.required_skills?.join(', ')}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                      {a.volunteer_requests?.description}
                    </p>
                  </div>
                  <div>
                    <span className={`badge badge-${a.status === 'pending' ? 'warning' : a.status === 'accepted' ? 'success' : a.status === 'completed' ? 'primary' : 'neutral'}`}>
                      {a.status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {a.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => handleAccept(a.id)}>Accept</button>
                    <button className="btn btn-sm btn-outline" onClick={() => handleDecline(a.id)}>Decline</button>
                  </div>
                )}
                {a.status === 'accepted' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => handleComplete(a.id)}>Mark as Completed</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
