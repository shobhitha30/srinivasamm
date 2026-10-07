import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ZeffyCheckoutModal } from './ZeffyCheckoutModal';

const PRESET_AMOUNTS = [25, 50, 100, 250];

export function DonationModal({ cause, campaign, onClose }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showZeffy, setShowZeffy] = useState(false);

  const finalAmount = useCustom ? parseFloat(customAmount) || 0 : amount;
  const targetTitle = cause?.name || cause?.title || campaign?.title || 'Sri Anantha Children Home';

  const handlePresetClick = (preset) => {
    setAmount(preset);
    setUseCustom(false);
    setCustomAmount('');
  };

  const handleCustomFocus = () => {
    setUseCustom(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (finalAmount <= 0) return;
    setShowZeffy(true);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (showZeffy) {
    return (
      <ZeffyCheckoutModal
        isOpen={showZeffy}
        onClose={onClose}
        cause={cause}
        campaign={campaign}
        amount={finalAmount}
        isRecurring={isRecurring}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-panel">
        <div className="modal-header">
          <div>
            <p id="modal-title" className="modal-title">Donate to {targetTitle}</p>
            <p className="modal-subtitle">Your support makes a direct, verified difference.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close"></button>
        </div>

        <div className="modal-body">
          {!user && (
            <div className="alert alert-info mb-md">
              <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link> to track your donations and receive tax receipts.
            </div>
          )}

          {/* Frequency toggle */}
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Giving frequency
          </p>
          <div className="freq-toggle mb-md">
            <button
              type="button"
              className={`freq-btn${!isRecurring ? ' active' : ''}`}
              onClick={() => setIsRecurring(false)}
            >
              One-time
            </button>
            <button
              type="button"
              className={`freq-btn${isRecurring ? ' active' : ''}`}
              onClick={() => setIsRecurring(true)}
            >
              💝 Monthly
            </button>
          </div>

          {isRecurring && (
            <div className="recurring-note mb-md">
              Make giving a meaningful monthly habit — you can pause anytime.
            </div>
          )}

          {/* Amount selection */}
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Select amount (USD)
          </p>
          <div className="amount-grid mb-md">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`amount-chip${!useCustom && amount === preset ? ' selected' : ''}`}
                onClick={() => handlePresetClick(preset)}
                aria-pressed={!useCustom && amount === preset}
              >
                ${preset}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <span style={{
              position: 'absolute', left: '0.875rem', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-secondary)',
              fontWeight: 600, fontSize: '0.95rem', pointerEvents: 'none',
            }}>$</span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Custom amount"
              value={customAmount}
              onFocus={handleCustomFocus}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '1.75rem' }}
              aria-label="Enter custom donation amount"
            />
          </div>

          {/* Impact note */}
          {finalAmount > 0 && (
            <div className="impact-note mb-md">
              Your {isRecurring ? 'monthly' : ''} donation of <strong>${finalAmount.toFixed(2)}</strong> goes
              directly to <strong>{targetTitle}</strong> with 0% platform fees via Zeffy.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              className="btn btn-cta btn-lg btn-block shadow-md"
              disabled={finalAmount <= 0}
            >
              {isRecurring
                ? `Give $${finalAmount.toFixed(2)} / month with Zeffy`
                : `Donate $${finalAmount.toFixed(2)} with Zeffy`}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
             100% Free Payment Processing via Zeffy · 0% Fees
          </p>
        </div>
      </div>
    </div>
  );
}

