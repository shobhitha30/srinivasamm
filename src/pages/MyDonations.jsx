import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserDonations, getUserDonationStats } from '../services/donationService';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { generateTaxReceipt } from '../utils/receiptGenerator';

export function MyDonations() {
  const { user, profile } = useAuth();
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ totalAmount: 0, totalCount: 0, causesSupported: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [userDonations, userStats] = await Promise.all([
          getUserDonations(user.id),
          getUserDonationStats(user.id)
        ]);
        setDonations(userDonations);
        setStats(userStats);
      } catch (err) {
        console.warn('Failed to load user donations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id]);

  const handleDownloadReceipt = (item) => {
    generateTaxReceipt({
      donationId: item.id,
      donorName: profile?.full_name || user?.email?.split('@')[0] || 'Valued Donor',
      email: user?.email,
      causeName: item.campaign?.title || item.campaign?.orphanage?.name || 'Sri Anantha Children Home — General Support',
      amount: item.amount,
      currency: item.currency || 'USD',
      date: item.created_at
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading your giving history..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Giving Journey</h1>
        <p>Track your contributions, see your total impact, and download tax receipts.</p>
      </div>

      {/* Summary stats */}
      <div className="stats-row mb-xl">
        <div className="stat-card">
          <div className="stat-value">${stats.totalAmount.toLocaleString()}</div>
          <div className="stat-label">Total Donated</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalCount}</div>
          <div className="stat-label">Donations Made</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.causesSupported}</div>
          <div className="stat-label">Causes Supported</div>
        </div>
      </div>

      {donations.length === 0 ? (
        <div className="space-y-xl">
          <EmptyState
            icon=""
            title="Start Your Giving Journey Today"
            message="You haven't made any donations yet. Browse our verified causes and make a direct difference."
            actionText="Explore Causes"
            actionLink="/causes"
          />

          {/* Sample Receipt Demo Button */}
          <div className="card bg-subtle p-lg text-center border max-w-md mx-auto">
            <h4 className="font-bold text-sm mb-xs">Preview Tax Receipt Generator</h4>
            <p className="text-xs text-muted mb-md">Test generating a 501(c)(3) & 80G compliant printable tax receipt.</p>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => handleDownloadReceipt({ id: 'demo-receipt-101', amount: 100, created_at: new Date().toISOString() })}
            >
               Download Sample Receipt ($100)
            </button>
          </div>
        </div>
      ) : (
        <div className="table-responsive shadow-sm rounded-lg border">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Cause / Campaign</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Tax Receipt</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td>{item.campaign?.title || 'General Support'}</td>
                  <td className="font-semibold text-primary">
                    ${item.amount} {item.currency || 'USD'}
                  </td>
                  <td>
                    <span className={`badge badge-${item.status === 'completed' ? 'success' : 'warning'}`}>
                      {item.status || 'Completed'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleDownloadReceipt(item)}
                    >
                       Receipt PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


