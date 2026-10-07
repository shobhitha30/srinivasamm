import React from 'react';
import { Link } from 'react-router-dom';
import { openZeffyDonation } from '../../utils/zeffyDonation';

function LocationIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--primary-600)' }}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

/**
 * CauseCard — reusable card for orphanages / campaigns / needs.
 */
export function CauseCard({ cause, onDonate }) {
  const {
    title,
    location,
    category,
    description,
    image,
    verificationStatus,
    goal,
    raised,
  } = cause;

  const percent = goal && raised ? Math.min(Math.round((raised / goal) * 100), 100) : null;

  return (
    <article className="cause-card">
      {/* Hero Image */}
      <div className="cause-card-image-wrap">
        {image ? (
          <img
            src={image}
            alt={`${title} — ${category}`}
            className="cause-card-image"
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #dbeafe 0%, #fde8d0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            <HomeIcon />
          </div>
        )}

        {/* Badges overlaid on image */}
        <div className="cause-card-badges">
          {category && (
            <span className="cause-card-badge-category">{category}</span>
          )}
          {verificationStatus === 'verified' && (
            <span className="cause-card-badge-verified">Verified</span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="cause-card-body">
        <h3 className="cause-card-title">
          <Link to={`/causes/${cause.id || 'demo-1'}`}>
            {title}
          </Link>
        </h3>

        {location && (
          <p className="cause-card-location">
            <LocationIcon /> {location}
          </p>
        )}

        {description && (
          <p className="cause-card-desc">{description}</p>
        )}

        {/* Progress */}
        {percent !== null && (
          <div className="cause-progress">
            <div className="cause-progress-amounts">
              <span className="cause-progress-raised">
                ${raised?.toLocaleString()}
                <span>raised</span>
              </span>
              <span className="cause-progress-goal-pct">
                <strong>{percent}%</strong> of ${goal?.toLocaleString()}
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

      {/* Footer */}
      <div className="cause-card-footer">
        <Link
          to={`/causes/${cause.id || 'demo-1'}`}
          className="btn btn-outline btn-md"
        >
          View Details
        </Link>
        <button
          className="btn btn-cta btn-md"
          onClick={() => openZeffyDonation(cause.zeffy_url)}
          aria-label={`Donate to ${title}`}
        >
          Donate Now
        </button>
      </div>
    </article>
  );
}
