import React from 'react';
import { Link } from 'react-router-dom';
import { CauseCard } from '../components/common/CauseCard';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ImpactGallery } from '../components/common/ImpactGallery';
import { getActiveCampaigns, getPlatformStats } from '../services/orphanageService';
import { ZEFFY_DONATION_URL } from '../utils/zeffyDonation';

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="2.5 8.5 6.5 12.5 13.5 4.5" />
    </svg>
  );
}

// Step icons as SVGs
function SearchIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function LightbulbIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>;
}
function HeartIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}
function StarIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}

// Trust icons
function ShieldIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function BarChartIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function LockIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function BellIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function CheckCircleIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
function GlobeIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}

function mapCampaignToCard(c) {
  const isPlatformCampaign = !c.orphanage || c.orphanage.name === 'Srinivasam Platform';
  return {
    id: c.id,
    title: c.title,
    location: isPlatformCampaign ? 'Srinivasam Platform' : [c.orphanage.city, c.orphanage.state, c.orphanage.country].filter(Boolean).join(', '),
    category: 'Campaign',
    description: c.description,
    image: c.image_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=75',
    verificationStatus: 'verified',
    goal: parseFloat(c.goal_amount),
    raised: parseFloat(c.raised_amount) || 0,
    zeffy_url: c.zeffy_url,
    _raw: c,
  };
}

const HOW_STEPS = [
  { Icon: SearchIcon, step: '1', title: 'Discover a cause', desc: 'Browse verified orphanages and urgent needs across India.' },
  { Icon: LightbulbIcon, step: '2', title: 'Understand the need', desc: 'See exactly what is needed, why, and how your help makes a difference.' },
  { Icon: HeartIcon, step: '3', title: 'Make a contribution', desc: 'Donate securely in minutes. One-time or recurring — your choice.' },
  { Icon: StarIcon, step: '4', title: 'See your impact', desc: 'Track your giving journey and receive updates from the organizations you support.' },
];

const TRUST_ITEMS = [
  { Icon: ShieldIcon, title: 'Verified organizations only', desc: 'Every orphanage undergoes a thorough verification process before appearing on the platform. We check registration, legitimacy, and accountability.' },
  { Icon: BarChartIcon, title: 'Full transparency', desc: 'See campaign goals, funds raised, and progress updates. Every donation is tracked and reported honestly.' },
  { Icon: LockIcon, title: 'Secure payments', desc: 'Payments are processed securely through Zeffy, a trusted nonprofit fundraising platform. Your financial data is never stored on our servers.' },
  { Icon: BellIcon, title: 'Impact updates', desc: 'When you donate, you get updates from the organization. See how your contribution made a difference.' },
  { Icon: CheckCircleIcon, title: 'No fabricated data', desc: 'We never show fake statistics, testimonials, or impact numbers. If data is unavailable, we say so honestly.' },
  { Icon: GlobeIcon, title: 'India expertise', desc: 'Our team understands the Indian charitable ecosystem and regulatory requirements, ensuring we support legitimate, impactful organizations.' },
];

export function Home() {
  const [causes, setCauses] = React.useState([]);
  const [loadingCauses, setLoadingCauses] = React.useState(true);
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      const [campaignsRes, statsRes] = await Promise.allSettled([
        getActiveCampaigns({ limit: 3 }),
        getPlatformStats(),
      ]);

      if (cancelled) return;
      if (campaignsRes.status === 'fulfilled') setCauses(campaignsRes.value.map(mapCampaignToCard));
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
    }

    load().finally(() => {
      if (!cancelled) setLoadingCauses(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-tag">
              <CheckIcon /> Verified giving &middot; Real impact
            </div>
            <h1 className="hero-title">
              Join the Tech Movement.<br />
              <span>Support Orphan Care.</span>
            </h1>
            <p className="hero-desc">
              Connect with donors and volunteers, and orphanages and orphans
              to change a child's life at Srinivasam, the Great Home.
            </p>
            <div className="hero-actions">
              <a href={ZEFFY_DONATION_URL} target="_blank" rel="noopener noreferrer" className="btn btn-cta btn-xl">
                Donate Now
              </a>
              <Link to="/volunteer" className="btn btn-outline btn-xl">
                Volunteer
              </Link>
            </div>
            <div className="hero-actions" style={{ marginTop: '0.75rem' }}>
              <Link to="/orphanage/register" className="btn btn-outline btn-md" style={{ fontSize: '0.875rem' }}>
                Register an Orphanage
              </Link>
              <Link to="/causes" className="btn btn-ghost btn-md" style={{ fontSize: '0.875rem' }}>
                Explore Causes
              </Link>
            </div>
            <div className="hero-trust">
              <div className="trust-pill">
                <CheckIcon /> 100% verified organizations
              </div>
              <div className="trust-pill">
                <CheckIcon /> Transparent fund use
              </div>
              <div className="trust-pill">
                <CheckIcon /> Secure payments via Zeffy
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=75"
                alt="Children being supported by Srinivasam donors"
              />
            </div>
            <div className="hero-stat-card bottom-left">
              <ShieldIcon />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)' }}>Trusted Platform</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Verified orphanages only</div>
              </div>
            </div>
            <div className="hero-stat-card top-right">
              <GlobeIcon />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)' }}>Across India &amp; Nepal</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Multiple states covered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="container text-center">
          <div className="badge badge-primary mb-sm" style={{ margin: '0 auto 0.75rem' }}>Simple Process</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            How Srinivasam works
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
            From discovery to impact, giving is simple, transparent, and meaningful.
          </p>

          <div className="how-steps">
            {HOW_STEPS.map(({ Icon, step, title, desc }) => (
              <div key={step} className="how-step">
                <div className="how-step-num" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
                  <Icon />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED CAUSES */}
      <section className="section" style={{ background: 'var(--gray-50)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-hd">
            <div className="section-hd-left">
              <h2>Featured verified causes</h2>
              <p>Support orphanages and programs making a real difference.</p>
            </div>
            <Link to="/causes" className="section-link">View all causes</Link>
          </div>

          {loadingCauses ? (
            <LoadingState message="Finding causes for you..." />
          ) : causes.length === 0 ? (
            <EmptyState
              title="Causes coming soon"
              description="Our team is verifying orphanages and causes. Check back shortly."
              action={<Link to="/signup" className="btn btn-primary btn-md">Get notified</Link>}
            />
          ) : (
            <div className="grid-3">
              {causes.map((cause) => (
                <CauseCard key={cause.id} cause={cause} />
              ))}
            </div>
          )}

          <div className="mt-2xl">
            <ImpactGallery />
          </div>

          {causes.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/causes" className="btn btn-outline btn-lg">Explore all causes</Link>
            </div>
          )}
        </div>
      </section>

      {/* TRUST & TRANSPARENCY */}
      <section className="trust-section">
        <div className="container">
          <div className="text-center mb-lg" style={{ marginBottom: '0' }}>
            <div className="badge badge-verified mb-sm" style={{ margin: '0 auto 0.75rem' }}>Why trust Srinivasam</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
              Your trust is our foundation
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              Everything on Srinivasam is built around one principle: donors deserve to know exactly where their money goes.
            </p>
          </div>

          <div className="trust-grid">
            {TRUST_ITEMS.map(({ Icon, title, desc }) => (
              <div key={title} className="trust-item">
                <div className="trust-item-icon" aria-hidden="true"><Icon /></div>
                <div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM STATS */}
      {stats && (stats.orphanages > 0 || stats.donations > 0) && (
        <section className="impact-section">
          <div className="container text-center">
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
              Growing impact
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
              Real numbers from our platform.
            </p>
            <div className="impact-stats">
              {stats.orphanages > 0 && (
                <div className="impact-stat">
                  <div className="impact-stat-value">{stats.orphanages}</div>
                  <div className="impact-stat-label">Verified Organizations</div>
                </div>
              )}
              {stats.campaigns > 0 && (
                <div className="impact-stat">
                  <div className="impact-stat-value">{stats.campaigns}</div>
                  <div className="impact-stat-label">Active Campaigns</div>
                </div>
              )}
              {stats.donations > 0 && (
                <div className="impact-stat">
                  <div className="impact-stat-value">{stats.donations}</div>
                  <div className="impact-stat-label">Donations Made</div>
                </div>
              )}
              {stats.needsFulfilled > 0 && (
                <div className="impact-stat">
                  <div className="impact-stat-value">{stats.needsFulfilled}</div>
                  <div className="impact-stat-label">Needs Fulfilled</div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* VOLUNTEER CTA */}
      <section className="section" style={{ background: 'var(--gray-50)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center', gap: '4rem' }}>
            <div>
              <div className="badge badge-primary mb-sm">For volunteers</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.03em', margin: '0.75rem 0' }}>
                Contribute your time and skills
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Not every contribution has to be financial. Srinivasam connects skilled volunteers with orphanages
                that need help with education, technology, healthcare, and more.
              </p>
              <Link to="/volunteer" className="btn btn-primary btn-lg">Become a volunteer</Link>
            </div>
            <div>
              <div className="badge badge-cta mb-sm">For organizations</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.03em', margin: '0.75rem 0' }}>
                Register your organization
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Are you running a verified orphanage or community organization in India?
                Join Srinivasam to access global donors and build lasting trust and support.
              </p>
              <Link to="/orphanage/register" className="btn btn-outline btn-lg">Register organization</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA BAND */}
      <section className="cta-band">
        <div className="container">
          <h2>Your next good deed is a few clicks away.</h2>
          <p>Join thousands of donors making a real difference in children's lives across India.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/causes" className="btn btn-cta btn-xl">Explore Causes</Link>
            <Link to="/signup" className="btn btn-outline btn-xl" style={{ borderColor: 'rgba(255,255,255,0.35)', color: 'white' }}>
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
