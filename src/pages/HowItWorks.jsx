import React from 'react';
import { Link } from 'react-router-dom';

export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Discover Verified Causes',
      description: 'Browse orphanages, child care centers, and urgent needs that have gone through strict verification, ground checks, and official documentation.'
    },
    {
      step: '02',
      title: 'Choose How to Give',
      description: 'Select a specific campaign, meet an immediate need (meals, textbooks, healthcare), or set up a recurring monthly donation.'
    },
    {
      step: '03',
      title: '100% Direct & Secure Transfer',
      description: 'Your contribution goes directly toward purchasing verified items or supporting verified organization bank accounts without hidden intermediary fees.'
    },
    {
      step: '04',
      title: 'Track Real Impact',
      description: 'Receive photo/video updates, item receipts, and impact letters directly from the children and caregivers you supported.'
    }
  ];

  return (
    <div className="page-container">
      <div className="text-center max-w-2xl mb-2xl" style={{ margin: '0 auto 3rem' }}>
        <span className="badge badge-accent mb-sm">Transparent Giving</span>
        <h1 className="text-4xl font-extrabold mb-md">How Srinivasam Works</h1>
        <p className="text-lg text-muted">
          We build a direct, transparent bridge between compassionate donors across the globe and verified orphanages in India.
        </p>
      </div>

      <div className="grid-2 mb-xl" style={{ marginBottom: '2.5rem' }}>
        {steps.map((s) => (
          <div key={s.step} className="card p-xl" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div className="text-3xl font-extrabold text-primary" style={{ opacity: 0.4, flexShrink: 0 }}>{s.step}</div>
            <div>
              <h3 className="text-xl font-bold mb-xs">{s.title}</h3>
              <p className="text-muted" style={{ lineHeight: 1.7 }}>{s.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-subtle p-2xl rounded-2xl text-center max-w-3xl" style={{ margin: '0 auto' }}>
        <h2 className="text-2xl font-bold mb-md">Ready to Make a Real Impact?</h2>
        <p className="text-muted mb-lg">
          Join thousands of donors who trust Srinivasam to bring joy, nutrition, and education to children in need.
        </p>
        <div className="flex gap-md" style={{ justifyContent: 'center' }}>
          <Link to="/causes" className="btn btn-primary btn-lg">
            Explore Verified Causes
          </Link>
          <Link to="/signup" className="btn btn-outline btn-lg">
            Create Donor Account
          </Link>
        </div>
      </div>
    </div>
  );
}
