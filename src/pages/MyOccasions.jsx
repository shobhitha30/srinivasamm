import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserOccasions, createOccasion } from '../services/occasionService';
import { openZeffyDonation } from '../utils/zeffyDonation';

export function MyOccasions() {
  const { user } = useAuth();
  const [occasions, setOccasions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('Birthday');
  const [targetAmount, setTargetAmount] = useState('250');
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);


  useEffect(() => {
    getUserOccasions(user?.id).then((data) => {
      setOccasions(data);
      setLoading(false);
    });
  }, [user?.id]);

  const handleAddOccasion = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const newOccData = {
      title: title.trim(),
      date,
      type,
      targetAmount: parseFloat(targetAmount) || 250,
      message: message.trim() || `Celebrating ${title} by supporting children care.`
    };

    const created = await createOccasion(user?.id, newOccData);
    setOccasions([created, ...occasions]);

    setTitle('');
    setDate('');
    setTargetAmount('250');
    setMessage('');
    setShowAddForm(false);
  };

  const handleShare = (occ) => {
    const url = `${window.location.origin}/causes?occasion=${occ.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(occ.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleOpenDonate = () => {
    openZeffyDonation();
  };

  return (
    <div className="page-container max-w-5xl" style={{ padding: '2.5rem 1.5rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div>
          <span className="badge badge-accent mb-xs" style={{ fontSize: '0.8125rem' }}>
            Meaningful Giving
          </span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--gray-900)', margin: '0.25rem 0' }}>
            Special Occasion Campaigns
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', margin: 0 }}>
            Turn birthdays, anniversaries, and memorial days into direct support for children in need.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? 'Close Form' : ' Create Occasion Campaign'}
        </button>
      </div>

      {/* Form: Create Occasion */}
      {showAddForm && (
        <div className="card p-xl mb-2xl border shadow-md" style={{ background: '#f8fafc', borderColor: 'var(--primary-600)' }}>
          <h3 className="text-xl font-bold mb-md text-heading">Create Occasion Campaign Goal</h3>
          <form onSubmit={handleAddOccasion} className="space-y-md">
            <div className="form-group">
              <label className="form-label" htmlFor="occ-title">Occasion Name *</label>
              <input
                id="occ-title"
                type="text"
                className="form-input"
                placeholder="e.g. Ananya's 25th Birthday or Golden Anniversary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-1 sm:grid-3 gap-md">
              <div className="form-group">
                <label className="form-label" htmlFor="occ-type">Occasion Type</label>
                <select
                  id="occ-type"
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="Birthday">Birthday</option>
                  <option value="Anniversary">Wedding Anniversary</option>
                  <option value="Festival">Festival (Diwali, Christmas, Eid)</option>
                  <option value="Memorial">In Loving Memory Of</option>
                  <option value="Milestone">Personal Milestone</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="occ-date">Event Date *</label>
                <input
                  id="occ-date"
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="occ-target">Target Giving Goal ($ USD)</label>
                <input
                  id="occ-target"
                  type="number"
                  min="50"
                  className="form-input"
                  placeholder="250"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="occ-msg">Personal Note for Family & Friends</label>
              <textarea
                id="occ-msg"
                rows={2}
                className="form-input"
                placeholder="e.g. In lieu of gifts this year, please help sponsor nutritious meals and textbooks..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-md pt-sm">
              <button type="submit" className="btn btn-cta">
                Publish Occasion Goal
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Occasions List */}
      <div className="grid grid-1 md:grid-2 gap-xl">
        {occasions.map((occ) => {
          const goal = occ.targetAmount || occ.target_amount || 250;
          const raised = occ.raisedAmount || occ.raised_amount || 0;
          const pct = Math.min(100, Math.round((raised / goal) * 100));

          return (
            <div key={occ.id} className="card p-xl flex flex-col justify-between border hover:shadow-md transition">
              <div>
                <div className="flex justify-between items-center mb-sm">
                  <span className="badge badge-primary">{occ.type}</span>
                  <span className="text-xs text-muted font-medium"> {occ.date}</span>
                </div>
                <h3 className="text-xl font-bold mb-xs text-heading">{occ.title}</h3>
                <p className="text-muted text-sm mb-lg leading-relaxed">{occ.message}</p>

                {/* Progress */}
                <div className="mb-lg">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>${raised.toLocaleString()} raised</span>
                    <span className="text-muted">${goal.toLocaleString()} goal ({pct}%)</span>
                  </div>
                  <div className="progress-bar" style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--primary-600)', height: '100%' }} />
                  </div>
                </div>
              </div>

              <div className="flex gap-sm pt-sm border-t">
                <button
                  type="button"
                  className="btn btn-outline btn-sm flex-1"
                  onClick={() => handleShare(occ)}
                >
                  {copiedId === occ.id ? ' Link Copied!' : ' Share Link'}
                </button>
                <button
                  type="button"
                  className="btn btn-cta btn-sm flex-1"
                  onClick={() => handleOpenDonate(occ)}
                >
                  💝 Contribute Gift
                </button>
              </div>
            </div>
          );
        })}
        {occasions.length === 0 && !loading && (
          <div className="card p-xl border" style={{ gridColumn: '1 / -1', textAlign: 'center', background: '#f8fafc' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 className="text-xl font-bold mb-xs text-heading">No Occasions Yet</h3>
            <p className="text-muted text-sm mb-lg">
              You haven't created any special occasion campaigns yet. Click the button above to start your first one!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
