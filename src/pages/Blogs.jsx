import React from 'react';
import websiteData from '../data/websiteData.json';

export function Blogs() {
  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '0.75rem' }}>
          Blogs
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Stay updated with the latest news, insights, and stories from SriNivasam.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        {websiteData.blogs.map((blog, index) => (
          <div key={index} className="campaign-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            {blog.image && (
              <img 
                src={blog.image} 
                alt={blog.title} 
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }} 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-900)', marginTop: '0.5rem' }}>{blog.title}</h3>
            {blog.author && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>By {blog.author}</p>}
            <p style={{ fontSize: '0.95rem', color: 'var(--gray-700)', lineHeight: 1.5 }}>
              {blog.summary}
            </p>
            {blog.link && (
              <a href={blog.link} target="_blank" rel="noopener noreferrer" style={{ marginTop: 'auto', display: 'inline-block', color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
                Read More &rarr;
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
