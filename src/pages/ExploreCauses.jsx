import React, { useEffect, useState, useMemo } from 'react';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { getActiveCampaigns } from '../services/orphanageService';
import { openZeffyDonation } from '../utils/zeffyDonation';

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

const CATEGORIES = ['All', 'Education', 'Food', 'Healthcare', 'Clothing', 'Shelter', 'Infrastructure', 'Emergency'];

export function mapCampaignToCard(c) {
  // Infer category from title if not set
  const titleLower = c.title?.toLowerCase() || '';
  let category = 'General Support';
  if (titleLower.includes('education') || titleLower.includes('school') || titleLower.includes('book') || titleLower.includes('stationery')) category = 'Education';
  else if (titleLower.includes('food') || titleLower.includes('meal') || titleLower.includes('rice') || titleLower.includes('grocery') || titleLower.includes('nutrition')) category = 'Food';
  else if (titleLower.includes('health') || titleLower.includes('medical') || titleLower.includes('medicine')) category = 'Healthcare';
  else if (titleLower.includes('cloth') || titleLower.includes('uniform') || titleLower.includes('apparel')) category = 'Clothing';
  else if (titleLower.includes('shelter') || titleLower.includes('bed') || titleLower.includes('mattress')) category = 'Shelter';
  else if (titleLower.includes('infrastr') || titleLower.includes('building') || titleLower.includes('construct')) category = 'Infrastructure';
  else if (titleLower.includes('emergency') || titleLower.includes('urgent') || titleLower.includes('disaster')) category = 'Emergency';

  // Parse priority from description
  const match = (c.description || '').match(/<!--PRIORITY:(.*?)-->/);
  const priority = match ? match[1] : 'normal';
  const description = (c.description || '').replace(/<!--PRIORITY:.*?-->/g, '').trim();

  return {
    id: c.id,
    title: c.title,
    description,
    priority,
    category,
    image: c.image_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=75',
    goal: parseFloat(c.goal_amount) || 0,
    raised: parseFloat(c.raised_amount) || 0,
    zeffy_url: c.zeffy_url,
    status: c.status,
    _raw: c,
  };
}

export function CampaignCard({ camp }) {
  const goal = camp.goal || 0;
  const raised = camp.raised || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return (
    <div className="campaign-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {camp.image && (
        <img
          src={camp.image}
          alt={camp.title}
          style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '0.75rem', marginBottom: '0.5rem' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{camp.category}</span>
        {camp.priority && camp.priority !== 'normal' && (
          <span className={`badge badge-${camp.priority === 'urgent' ? 'error' : camp.priority === 'high' ? 'warning' : 'neutral'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
            {camp.priority.toUpperCase()}
          </span>
        )}
      </div>
      <h3 className="campaign-card-title" style={{ fontSize: '1.125rem', fontWeight: 700 }}>{camp.title}</h3>
      <p className="campaign-card-desc" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {camp.description?.slice(0, 120)}{camp.description?.length > 120 ? '...' : ''}
      </p>

      <div className="campaign-progress" style={{ marginTop: 'auto' }}>
        <div className="campaign-progress-top">
          <div className="campaign-progress-goal">
            <strong>${goal.toLocaleString()}</strong> required
          </div>
        </div>
      </div>

      <button
        type="button"
        className="campaign-donate-btn"
        onClick={() => openZeffyDonation(camp.zeffy_url)}
        style={{ marginTop: '0.5rem' }}
      >
        Donate Now →
      </button>
    </div>
  );
}

export function ExploreCauses() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('most-urgent');

  useEffect(() => {
    getActiveCampaigns({ limit: 50 }).then((data) => {
      setCampaigns(data.map(mapCampaignToCard));
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const totalRaised = campaigns.reduce((sum, c) => sum + (c.raised || 0), 0);
    const totalGoal = campaigns.reduce((sum, c) => sum + (c.goal || 0), 0);
    return { totalCampaigns, totalRaised, totalGoal };
  }, [campaigns]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = campaigns.filter((c) => {
      const matchCategory = category === 'All' || c.category?.toLowerCase() === category.toLowerCase();
      const matchSearch = !q || c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });

    if (sortBy === 'most-funded') {
      list = [...list].sort((a, b) => (b.raised || 0) - (a.raised || 0));
    } else if (sortBy === 'most-needed') {
      list = [...list].sort((a, b) => {
        const pctA = (a.raised || 0) / (a.goal || 1);
        const pctB = (b.raised || 0) / (b.goal || 1);
        return pctA - pctB;
      });
    } else if (sortBy === 'most-urgent') {
      const pLevel = { 'urgent': 4, 'high': 3, 'normal': 2, 'low': 1 };
      list = [...list].sort((a, b) => (pLevel[b.priority] || 2) - (pLevel[a.priority] || 2));
    }

    return list;
  }, [campaigns, search, category, sortBy]);

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '0.75rem' }}>
          Support a Cause
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Every campaign below is created and managed by <strong>Srinivasam</strong>. 100% of your donation goes directly toward fulfilling verified needs for children in registered orphanages.
        </p>

        {/* Stats Row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--emerald-600, #059669)' }}>{stats.totalCampaigns}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Active Campaigns</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--emerald-600, #059669)' }}>${stats.totalRaised.toLocaleString()}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Funds Raised</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--emerald-600, #059669)' }}>${stats.totalGoal.toLocaleString()}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Goal</div>
          </div>
        </div>
      </div>

      {/* Platform Flow Banner */}
      <div style={{
        background: 'var(--primary-50)',
        border: '1px solid var(--primary-100)',
        borderRadius: '1rem',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '1.5rem' }}>🔄</span>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontWeight: 700, color: 'var(--primary-700)', marginBottom: '0.25rem' }}>How Your Donation Works</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--primary-600)' }}>
            <strong>You Donate</strong> → <strong>Srinivasam Receives & Manages Funds</strong> → <strong>Verified Orphanage Need Fulfilled</strong>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--primary-700)', fontWeight: 600 }}>100% Direct Impact • Zero Platform Fee</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <SearchIcon />
          <input
            id="cause-search"
            type="search"
            className="form-input"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
            aria-label="Search campaigns"
          />
        </div>
        <select
          id="cause-sort"
          className="form-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ minWidth: '160px' }}
          aria-label="Sort campaigns"
        >
          <option value="most-urgent">Most Urgent</option>
          <option value="most-funded">Most Funded</option>
          <option value="most-needed">Most Needed</option>
        </select>
      </div>

      {/* Category Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`filter-chip${category === cat ? ' active' : ''}`}
            onClick={() => setCategory(cat)}
            aria-pressed={category === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredAndSorted.length}</strong> {filteredAndSorted.length === 1 ? 'campaign' : 'campaigns'}
          {category !== 'All' && ` in "${category}"`}
        </div>
      )}

      {/* Campaign Grid */}
      {loading ? (
        <LoadingState message="Loading campaigns..." />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          title={campaigns.length === 0 ? 'No Active Campaigns Yet' : 'No Campaigns Found'}
          description={
            campaigns.length === 0
              ? 'The Srinivasam admin will create campaigns as orphanages submit their needs. Check back soon!'
              : 'Try adjusting your search terms or selecting a different category.'
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredAndSorted.map((camp) => (
            <CampaignCard key={camp.id} camp={camp} />
          ))}
        </div>
      )}
    </div>
  );
}
