import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDonorStats, getDonorRecentDonations } from '../services/donorDashboardService';
import { getActiveCampaigns } from '../services/orphanageService';
import { LoadingState } from '../components/common/LoadingState';
import { openZeffyDonation } from '../utils/zeffyDonation';
import { mapCampaignToCard, CampaignCard } from './ExploreCauses';

/* ── Cause Card (inline, avoids using DEMO data) ── */
function DashboardCauseCard({ cause }) {
  const goal = parseFloat(cause.campaigns?.[0]?.goal_amount) || 0;
  const raised = parseFloat(cause.campaigns?.[0]?.raised_amount) || 0;
  const percent = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;
  const campaign = cause.campaigns?.[0];
  const imageUrl = campaign?.image_url || cause.logo_url || null;
  const location = [cause.city, cause.state, cause.country].filter(Boolean).join(', ');

  return (
    <article className="cause-card">
      {imageUrl && (
        <div className="cause-card-image-wrap">
          <img src={imageUrl} alt={cause.name} className="cause-card-image" loading="lazy" />
          <div className="cause-card-badges">
            {cause.verification_status === 'verified' && (
              <span className="cause-card-badge-verified"> Verified</span>
            )}
          </div>
        </div>
      )}

      <div className="cause-card-body">
        <h3 className="cause-card-title">
          <Link to={`/causes/${cause.id}`}>{cause.name}</Link>
        </h3>
        {location && <p className="cause-card-location">📍 {location}</p>}
        {cause.description && (
          <p className="cause-card-desc">{cause.description}</p>
        )}

        {campaign && goal > 0 && (
          <div className="cause-progress">
            <div className="cause-progress-amounts">
              <span className="cause-progress-raised">
                ${raised.toLocaleString()} <span>raised</span>
              </span>
              <span className="cause-progress-goal-pct">
                <strong>{percent}%</strong> of ${goal.toLocaleString()}
              </span>
            </div>
            <div className="cause-progress-bar">
              <div
                className="cause-progress-fill"
                style={{ width: `${percent}%` }}
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}
      </div>

      <div className="cause-card-footer">
        <Link to={`/causes/${cause.id}`} className="btn btn-outline btn-md">View Details</Link>
        {(
          <button
            className="btn btn-cta btn-md"
            onClick={() => openZeffyDonation()}
          >
            Donate →
          </button>
        )}
      </div>
    </article>
  );
}

/* ── Donation row ── */
function DonationRow({ donation }) {
  const amount = parseFloat(donation.amount) || 0;
  const date = new Date(donation.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const org = donation.campaign?.orphanage?.name ?? 'Srinivasam';
  const campaign = donation.campaign?.title ?? 'General Donation';

  return (
    <div className="donation-row">
      <div className="donation-row-info">
        <div className="donation-row-campaign" style={{ fontWeight: 600 }}>{campaign}</div>
        <div className="donation-row-date">{date}</div>
      </div>
      <div className="donation-row-amount">
        <span className="donation-row-value">${amount.toFixed(2)}</span>
        <span className={`badge badge-${donation.status === 'completed' ? 'success' : 'warning'}`}>{donation.status}</span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ totalDonated: 0, causesSupported: 0, donationCount: 0 });
  const [recentDonations, setRecentDonations] = useState([]);
  const [causes, setCauses] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Friend';

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function loadDashboard() {
      const [statsRes, donationsRes, campaignsRes] = await Promise.allSettled([
        getDonorStats(user.id),
        getDonorRecentDonations(user.id, { limit: 5 }),
        getActiveCampaigns({ limit: 3 }),
      ]);

      if (cancelled) return;
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (donationsRes.status === 'fulfilled') setRecentDonations(donationsRes.value);
      if (campaignsRes.status === 'fulfilled') setCauses(campaignsRes.value.map(mapCampaignToCard));
    }

    loadDashboard().finally(() => {
      if (!cancelled) setLoadingData(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="page-container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

      {/* ── Welcome Banner ── */}
      <section className="welcome-banner mb-xl">
        <div>
          <div className="welcome-eyebrow">Donor Workspace</div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '0.375rem', letterSpacing: '-0.03em' }}>
            Welcome back, {displayName} ??
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Thank you for being part of the Srinivasam community.
          </p>
        </div>
        <div className="welcome-actions">
          <Link to="/causes" className="btn btn-primary btn-md">Explore All Causes</Link>
        </div>
      </section>

      {/* ── Impact Summary Cards ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="metric-card">
          <div className="metric-icon-wrap metric-icon-green">?</div>
          <div>
            <div className="metric-value">
              {stats.totalDonated > 0 ? `$${stats.totalDonated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
            </div>
            <div className="metric-label">Total Donated</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {stats.donationCount === 0 ? 'Make your first donation today' : `${stats.donationCount} donation${stats.donationCount !== 1 ? 's' : ''} made`}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap metric-icon-blue">?</div>
          <div>
            <div className="metric-value">{stats.causesSupported}</div>
            <div className="metric-label">Causes Supported</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Verified orphanages</div>
          </div>
        </div>

        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)', border: '1px solid var(--primary-100)' }}>
          <div className="metric-icon-wrap" style={{ background: 'var(--primary-100)' }}></div>
          <div style={{ flex: 1 }}>
            <div className="metric-value" style={{ fontSize: '1rem' }}>Special Occasions</div>
            <div className="metric-label">Make it meaningful</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Birthdays, anniversaries & more</div>
          </div>
          <Link to="/occasions" className="btn btn-sm btn-primary" style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>
            Plan →
          </Link>
        </div>
      </section>

      {/* ── Two column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>

        {/* Recent Donations */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--gray-900)' }}>Recent Donations</h2>
            <Link to="/donations" className="section-link">View all →</Link>
          </div>

          {loadingData ? (
            <LoadingState message="Loading…" />
          ) : recentDonations.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>?</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                You haven't made any donations yet.
              </p>
              <Link to="/causes" className="btn btn-primary btn-sm">Explore Causes</Link>
            </div>
          ) : (
            <div className="card" style={{ padding: '1rem' }}>
              {recentDonations.map((d) => <DonationRow key={d.id} donation={d} />)}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/causes" className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', transition: 'box-shadow 0.15s' }}>
              <span style={{ fontSize: '1.5rem' }}>?</span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.9rem' }}>Explore Verified Causes</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Discover orphanages across India</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
            </Link>

            <Link to="/occasions" className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', transition: 'box-shadow 0.15s' }}>
              <span style={{ fontSize: '1.5rem' }}></span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.9rem' }}>Set Up Occasion Giving</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Make birthdays & anniversaries meaningful</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
            </Link>

            <Link to="/volunteer" className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', transition: 'box-shadow 0.15s' }}>
              <span style={{ fontSize: '1.5rem' }}>?</span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.9rem' }}>Volunteer</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contribute your skills and time</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
            </Link>

            <Link to="/profile" className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', transition: 'box-shadow 0.15s' }}>
              <span style={{ fontSize: '1.5rem' }}></span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.9rem' }}>Complete Your Profile</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Add your details and preferences</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
            </Link>
          </div>
        </div>
      </div>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
              Active Campaigns
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Transparent programs with direct impact on children's lives.
            </p>
          </div>
          <Link to="/causes" className="section-link">View All →</Link>
        </div>

        {loadingData ? (
          <LoadingState message="Finding causes for you…" />
        ) : causes.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>?</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
              Verified organizations are joining Srinivasam
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Check back soon or register your organization with us.
            </p>
            <Link to="/orphanage/register" className="btn btn-outline btn-md">Register an Orphanage</Link>
          </div>
        ) : (
          <div className="grid-3">
            {causes.map((cause) => (
              <CampaignCard key={cause.id} camp={cause} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
