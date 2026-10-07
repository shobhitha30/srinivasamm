import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export function RecurringDonations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    async function fetchSubscriptions() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('donations')
          .select(`
            id,
            amount,
            currency,
            status,
            created_at,
            campaign:campaigns (
              title,
              orphanage:orphanages ( name, city, state )
            )
          `)
          .eq('donor_id', user.id)
          .eq('is_recurring', true);

        if (!error && data) {
          const mapped = data.map(d => ({
            id: d.id,
            causeName: d.campaign?.orphanage?.name || d.campaign?.title || 'Verified Children Home',
            location: `${d.campaign?.orphanage?.city || ''}, ${d.campaign?.orphanage?.state || ''}`.trim().replace(/^,/, ''),
            monthlyAmount: d.amount,
            currency: d.currency || 'USD',
            status: d.status === 'completed' ? 'Active' : d.status,
            nextBillingDate: 'Next Month', // Placeholder for actual billing date logic
            startDate: new Date(d.created_at).toLocaleDateString(),
            impactDesc: d.campaign?.title || 'Providing essential support for resident children.'
          }));
          setSubscriptions(mapped);
        }
      } catch (err) {
        console.warn('fetchSubscriptions error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubscriptions();
  }, [user]);

  const handleToggleStatus = (id) => {
    setSubscriptions(
      subscriptions.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'Active' ? 'Paused' : 'Active' }
          : s
      )
    );
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-2xl">
        <div>
          <span className="badge badge-accent mb-xs">Donor Portal</span>
          <h1 className="text-3xl font-extrabold text-heading">Monthly Giving Subscriptions</h1>
          <p className="text-muted text-sm">Manage your active monthly pledges, pause giving, or update amounts anytime.</p>
        </div>
        <Link to="/causes" className="btn btn-primary">
          + Sponsor Another Cause
        </Link>
      </div>

      <div className="stats-row mb-2xl">
        <div className="stat-card">
          <div className="stat-value">$25 / mo</div>
          <div className="stat-label">Monthly Commitment</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">$300 / yr</div>
          <div className="stat-label">Projected Annual Impact</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">1</div>
          <div className="stat-label">Active Orphanages Sponsored</div>
        </div>
      </div>

      <div className="space-y-lg">
        {loading ? (
          <div className="text-center text-muted">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <div className="card p-2xl text-center border">
            <h3 className="text-xl font-bold mb-sm">No Active Subscriptions</h3>
            <p className="text-muted mb-lg">You do not have any active monthly giving subscriptions.</p>
            <Link to="/causes" className="btn btn-primary">Browse Causes to Support</Link>
          </div>
        ) : subscriptions.map((sub) => (
          <div key={sub.id} className="card p-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-lg hover:shadow-md transition">
            <div className="space-y-xs">
              <div className="flex items-center gap-xs">
                <span className={`badge badge-${sub.status === 'Active' ? 'success' : 'warning'}`}>
                  {sub.status}
                </span>
                <span className="text-xs text-muted">📍 {sub.location}</span>
              </div>
              <h3 className="text-xl font-bold text-heading">{sub.causeName}</h3>
              <p className="text-muted text-sm">{sub.impactDesc}</p>
              <div className="text-xs text-muted pt-xs">
                Next billing date: <strong>{sub.nextBillingDate}</strong> • Member since {sub.startDate}
              </div>
            </div>

            <div className="flex flex-col items-end gap-sm min-w-48 w-full md:w-auto">
              <div className="text-2xl font-extrabold text-primary">
                ${sub.monthlyAmount} <span className="text-xs text-muted font-normal">/ month</span>
              </div>
              <div className="flex gap-xs w-full">
                <button
                  type="button"
                  className="btn btn-sm btn-outline flex-1"
                  onClick={() => handleToggleStatus(sub.id)}
                >
                  {sub.status === 'Active' ? 'Pause Giving' : 'Resume Giving'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
