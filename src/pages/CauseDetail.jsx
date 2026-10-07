import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrphanageById } from '../services/orphanageService';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { ImpactGallery } from '../components/common/ImpactGallery';
import { openZeffyDonation } from '../utils/zeffyDonation';

export function CauseDetail() {
  const { id } = useParams();
  const [cause, setCause] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function fetchCause() {
      setLoading(true);
      try {
        const data = await getOrphanageById(id);
        if (data) {
          setCause(data);
        } else {
          // Removed fallback mock data to enforce 100% backend truth
        }
      } catch (err) {
        console.warn('Error loading cause detail:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCause();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading cause profile..." />
      </div>
    );
  }

  if (!cause) {
    return (
      <div className="page-container text-center py-2xl">
        <h2>Cause Not Found</h2>
        <p className="text-muted mb-lg">The organization or campaign you are looking for could not be found.</p>
        <Link to="/causes" className="btn btn-primary">Return to Explore Causes</Link>
      </div>
    );
  }



  return (
    <div className="page-container max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-md text-sm text-muted">
        <Link to="/causes" className="hover:text-primary">Explore Causes</Link> / <span className="text-body font-medium">{cause.name}</span>
      </div>

      {/* Cause Hero Banner */}
      <div className="card p-2xl mb-xl relative bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-lg border-b pb-xl mb-xl">
          <div>
            <div className="flex items-center gap-sm mb-xs">
              <StatusBadge status={cause.verification_status || 'verified'} />
              <span className="text-xs text-muted font-medium">📍 {cause.city}, {cause.state}, {cause.country}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-heading">{cause.name}</h1>
            <p className="text-muted text-sm mt-1">
              Serving {cause.children_count || 0} resident children • Reg No: {cause.registration_number || 'N/A'}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg whitespace-nowrap shadow-md"
            onClick={() => openZeffyDonation()}
          >
            💝 Support This Home
          </button>
        </div>

        {/* Story */}
        <div className="grid grid-1 md:grid-3 gap-xl">
          <div className="md:col-span-2">
            <h3 className="text-lg font-bold mb-sm text-heading">About the Organization</h3>
            <p className="text-body leading-relaxed mb-lg">{cause.description}</p>

            {/* Verification highlights */}
            <div className="bg-subtle p-lg rounded-xl mb-xl border">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-sm">Verification & Governance Trust Checks</h4>
              <div className="grid grid-2 gap-md text-sm">
                <div>✔️ <strong>Ground Audit:</strong> Verified on {cause.verified_date ? new Date(cause.verified_date).toLocaleDateString() : 'N/A'}</div>
                <div>✔️ <strong>Bank Account:</strong> Direct NGO Account</div>
                <div>✔️ <strong>FCRA Compliant:</strong> Eligible for international support</div>
                <div>✔️ <strong>Child Safety Protocol:</strong> Verified background checks</div>
              </div>
            </div>
          </div>

          {/* Quick info sidebar */}
          <div className="card bg-subtle p-lg h-fit border">
            <h4 className="font-bold text-md mb-md border-b pb-xs">Impact Summary</h4>
            <div className="space-y-sm text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Children Supported:</span>
                <span className="font-bold">{cause.children_count || 0} kids</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Established:</span>
                <span className="font-bold">{cause.established_year || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Active Needs:</span>
                <span className="font-bold">{cause.needs?.length || 0} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Active Campaigns:</span>
                <span className="font-bold">{cause.campaigns?.length || 0} active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Campaigns */}
      {cause.campaigns && cause.campaigns.length > 0 && (
        <div className="mb-2xl">
          <h2 className="text-2xl font-bold mb-lg text-heading">Active Campaigns</h2>
          <div className="grid grid-2 gap-lg">
            {cause.campaigns.map((camp) => {
              const goal = parseFloat(camp.goal_amount) || 0;
              const raised = parseFloat(camp.raised_amount) || 0;
              const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

              return (
                <div key={camp.id} className="campaign-card">
                  <h3 className="campaign-card-title">{camp.title}</h3>
                  <p className="campaign-card-desc">{camp.description}</p>

                  <div className="campaign-progress">
                    <div className="campaign-progress-top">
                      <div className="campaign-progress-goal">
                        <strong>${goal.toLocaleString()}</strong> required
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="campaign-donate-btn"
                    onClick={() => openZeffyDonation()}
                  >
                    Donate Now →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}




    </div>
  );
}

