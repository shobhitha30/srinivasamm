import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { generateTaxReceipt } from '../../utils/receiptGenerator';
import { recordDonation } from '../../services/donationService';

export function ZeffyCheckoutModal({ isOpen, onClose, cause, campaign, amount, isRecurring }) {
  const { user, profile } = useAuth();
  const [cardName, setCardName] = useState(profile?.full_name || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [tipOption, setTipOption] = useState('10');
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amount) || 50;
  const tipAmount = tipOption === 'custom' ? 0 : Math.round((numericAmount * parseFloat(tipOption)) / 100);
  const totalCharge = numericAmount + tipAmount;

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrorMsg(null);

    try {
      // Simulate network response for Zeffy gateway processing
      await new Promise((r) => setTimeout(r, 1200));

      const donationRecord = {
        donorId: user?.id || null,
        campaignId: campaign?.id || null,
        amount: numericAmount,
        currency: 'USD',
        isRecurring: isRecurring || false,
      };

      await recordDonation(donationRecord);
      setCompleted(true);
    } catch (err) {
      setErrorMsg(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadReceipt = () => {
    generateTaxReceipt({
      donationId: `ZEFFY-${Date.now()}`,
      donorName: cardName || profile?.full_name || 'Generous Donor',
      email: user?.email,
      causeName: cause?.name || campaign?.title || 'Sri Anantha Children Home',
      amount: numericAmount,
      currency: 'USD',
      date: new Date().toISOString()
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="modal-content max-w-lg bg-white rounded-2xl p-xl shadow-2xl border">
        {/* Header */}
        <div className="modal-header border-b pb-md mb-md flex justify-between items-center">
          <div className="flex items-center gap-xs">
            <span className="text-xl"></span>
            <div>
              <h3 className="font-bold text-lg text-heading">Zeffy 100% Free Checkout</h3>
              <p className="text-xs text-muted">0% Platform Fee • 0% Processing Fee</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close"></button>
        </div>

        {completed ? (
          <div className="text-center py-lg space-y-md">
            <div className="text-5xl"></div>
            <h2 className="text-2xl font-extrabold text-heading">Donation Submitted!</h2>
            <p className="text-muted text-sm leading-relaxed">
              Your contribution of <strong>${numericAmount} USD</strong> has been submitted. It will be marked as completed once the payment clears. 100% of your donation goes directly to <strong>{cause?.name || 'the orphanage'}</strong>.
            </p>

            <div className="bg-subtle p-md rounded-xl border text-left text-xs space-y-1">
              <div><strong>Transaction ID:</strong> ZEF-{Date.now().toString().slice(-8)}</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong>Status:</strong> Pending</div>
            </div>

            <div className="flex gap-md pt-sm">
              <button type="button" className="btn btn-outline flex-1" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProcessPayment} className="space-y-md">
            {errorMsg && <div className="alert alert-error text-xs mb-sm">{errorMsg}</div>}

            {/* Impact Banner */}
            <div className="bg-subtle p-md rounded-xl border flex justify-between items-center">
              <div>
                <span className="text-xs text-muted uppercase font-semibold">Supporting</span>
                <h4 className="font-bold text-sm text-heading">{cause?.name || campaign?.title || 'Sri Anantha Children Home'}</h4>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted uppercase font-semibold">Amount</span>
                <div className="text-lg font-extrabold text-primary">${numericAmount} USD</div>
              </div>
            </div>

            {/* Zero Fee Guarantee pill */}
            <div className="p-xs bg-emerald-50 border border-emerald-200 rounded-lg text-center text-xs text-emerald-800 font-medium">
               Zeffy covers all credit card processing fees so 100% of your ${numericAmount} reaches the kids.
            </div>

            {/* Payment Details */}
            <div className="space-y-sm">
              <div className="form-group">
                <label className="form-label text-xs" htmlFor="z-name">Cardholder Name</label>
                <input
                  id="z-name"
                  type="text"
                  className="form-input text-sm"
                  placeholder="Full Name as shown on card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label text-xs" htmlFor="z-card">Card Number</label>
                <input
                  id="z-card"
                  type="text"
                  className="form-input text-sm"
                  placeholder="4532 •••• •••• 8892"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-2 gap-sm">
                <div className="form-group">
                  <label className="form-label text-xs" htmlFor="z-exp">Expires (MM/YY)</label>
                  <input
                    id="z-exp"
                    type="text"
                    className="form-input text-sm"
                    placeholder="08/28"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs" htmlFor="z-cvc">Security Code (CVC)</label>
                  <input
                    id="z-cvc"
                    type="password"
                    className="form-input text-sm"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Optional Zeffy tip */}
              <div className="pt-xs">
                <label className="form-label text-xs">Optional Zeffy Tip (Keeps Zeffy 100% Free)</label>
                <div className="flex gap-xs">
                  {['0', '5', '10', '15'].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      className={`btn btn-xs flex-1 ${tipOption === pct ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setTipOption(pct)}
                    >
                      {pct === '0' ? 'No tip' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-sm">
              <button
                type="submit"
                className="btn btn-cta btn-lg btn-block shadow-md"
                disabled={processing}
              >
                {processing ? 'Processing Securely…' : `Complete $${totalCharge} USD Donation`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
