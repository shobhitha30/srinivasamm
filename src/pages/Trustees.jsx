import React from 'react';
import websiteData from '../data/websiteData.json';

export function Trustees() {
  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '0.75rem' }}>
          Our Trustees
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 2rem' }}>
          Our trustees guide SriNivasam's mission with diverse experience, dedication, and strategic leadership, creating lasting impacts for underprivileged children.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
        {websiteData.trustees.map((trustee, index) => (
          <div key={index} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '250px' }}>
            <div style={{ width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              {trustee.image && (
                <img src={trustee.image} alt={trustee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '0.25rem' }}>{trustee.name}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
              {trustee.role.split(', ').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
            </p>
            {trustee.linkedin && (
              <a href={trustee.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#0077b5', textDecoration: 'none' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
