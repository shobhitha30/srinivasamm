import React, { useState, useEffect } from 'react';
import { createNeed, updateNeedStatus, deleteNeed, getOrphanageByAdminId, createVolunteerRequest, getMyVolunteerRequests } from '../services/orphanageService';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState';

export function OrphanageDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orphanage, setOrphanage] = useState(null);

  const [activeTab, setActiveTab] = useState('needs');
  const [needs, setNeeds] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [volunteerRequests, setVolunteerRequests] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '', description: '', location: '', required_date: '', start_time: '', end_time: '', required_skills: ''
  });


  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        if (user?.id) {
          const data = await getOrphanageByAdminId(user.id);
          if (cancelled) return;
          if (data) {
            setOrphanage(data);
            setNeeds(data.needs || []);
            setCampaigns(data.campaigns || []);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      getMyVolunteerRequests()
        .then((reqs) => {
          if (!cancelled && reqs && reqs.success) {
            setVolunteerRequests(reqs.data || []);
          }
        })
        .catch(() => {});
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Form states for Needs
  const [showNeedForm, setShowNeedForm] = useState(false);
  const [needTitle, setNeedTitle] = useState('');
  const [needCategory, setNeedCategory] = useState('Food');
  const [needPriority, setNeedPriority] = useState('urgent');
  const [needQuantity, setNeedQuantity] = useState('');
  const [needCost, setNeedCost] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers for Needs
  const handleAddNeed = async (e) => {
    e.preventDefault();
    if (!needTitle.trim() || isSubmitting) return;

    if (!orphanage) return;
    
    setIsSubmitting(true);

    const newNeedData = {
      title: needTitle.trim(),
      category: needCategory,
      priority: needPriority,
      quantity: needQuantity.trim() || '1',
      estimatedCost: needCost ? `$${needCost}` : null,
    };

    try {
      const created = await createNeed(orphanage.id, newNeedData);
      setNeeds([created, ...needs]);
      setNeedTitle('');
      setNeedQuantity('');
      setNeedCost('');
      setShowNeedForm(false);
      alert('Need submitted for admin review');
    } catch (err) {
      alert('Failed to submit need: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleNeedStatus = async (needId) => {
    setNeeds((prev) =>
      prev.map((item) => {
        if (item.id === needId) {
          const nextStatus = item.status === 'fulfilled' ? 'approved' : 'fulfilled';
          updateNeedStatus(needId, nextStatus);
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const handleDeleteNeed = async (needId) => {
    // Optimistically remove from UI immediately
    setNeeds((prev) => prev.filter((item) => item.id !== needId));
    try {
      await deleteNeed(needId);
    } catch (err) {
      alert('Failed to delete need: ' + (err.message || 'Unknown error'));
      // Reload to restore accurate state if delete failed
      const data = await getOrphanageByAdminId(user?.id);
      if (data) setNeeds(data.needs || []);
    }
  };


  const totalRaised = campaigns.reduce((acc, c) => acc + (parseFloat(c.raised_amount) || 0), 0);
  const activeNeedsCount = needs.filter((n) => n.status === 'approved').length;
  const fulfilledNeedsCount = needs.filter((n) => n.status === 'fulfilled').length;

  
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const skills = requestForm.required_skills.split(',').map(s => s.trim()).filter(Boolean);
      await createVolunteerRequest({
        ...requestForm,
        required_skills: skills
      });
      alert('Volunteer request created successfully!');
      setShowRequestForm(false);
      setRequestForm({ title: '', description: '', location: '', required_date: '', start_time: '', end_time: '', required_skills: '' });
      const reqs = await getMyVolunteerRequests();
      if (reqs && reqs.success) {
        setVolunteerRequests(reqs.data || []);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading dashboard..." />
      </div>
    );
  }

  if (!orphanage) {
    return (
      <div className="page-container max-w-3xl" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 className="text-2xl font-bold mb-md">Welcome to your Portal</h2>
        <p className="text-muted mb-lg">You haven't registered your orphanage yet, or your application is pending processing.</p>
        <Link to="/orphanage/register" className="btn btn-primary">Register Your Orphanage Now</Link>
      </div>
    );
  }

  return (
    <div className="page-container max-w-5xl" style={{ padding: '2.5rem 1.5rem' }}>
      
      {/* ── Partner Portal Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div>
          <span className={`badge badge-${orphanage.verification_status === 'approved' ? 'success' : 'warning'} mb-xs`} style={{ fontSize: '0.8125rem' }}>
            {orphanage.verification_status === 'approved' ? ' Verified Non-Profit Partner' : <><Clock size={12} style={{display:'inline', marginBottom:'-2px'}}/> Verification Pending</>}
          </span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--gray-900)', margin: '0.25rem 0' }}>
            {orphanage.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', margin: 0 }}>
            Reg No: <strong>{orphanage.registration_number}</strong> • {orphanage.city}, {orphanage.state} • {orphanage.children_count} Resident Kids
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowNeedForm(!showNeedForm)}
          >
            {showNeedForm ? 'Close Form' : '+ Submit Need to Admin'}
          </button>
        </div>
      </div>

      {/* ── Summary Stats Row ── */}
      <div className="stats-row mb-xl">
        <div className="stat-card">
          <div className="stat-value">${totalRaised.toLocaleString()}</div>
          <div className="stat-label">Total Raised</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{orphanage.children_count}</div>
          <div className="stat-label">Resident Children</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeNeedsCount}</div>
          <div className="stat-label">Active Urgent Needs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{fulfilledNeedsCount}</div>
          <div className="stat-label">Needs Fulfilled</div>
        </div>
      </div>

      {showNeedForm && (
        <div className="card p-xl mb-xl border shadow-md" style={{ background: '#f8fafc', borderColor: 'var(--primary-600)' }}>
          <h3 className="text-xl font-bold mb-md text-heading">Submit Material Need to Admin</h3>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.875rem', background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '0.5rem', padding: '0.75rem', color: '#92400e' }}>
              🔒 <strong>Privacy Note:</strong> Your submitted needs are <strong>only visible to Srinivasam admin</strong>. They will not appear on the public website. The admin will review and create appropriate donation campaigns.
            </p>
          </div>
          <form onSubmit={handleAddNeed} className="space-y-md">
            <div className="form-group">
              <label className="form-label" htmlFor="need-title">Item Title / Requirement *</label>
              <input
                id="need-title"
                type="text"
                className="form-input"
                placeholder="e.g. 50kg Rice Bags or First Aid Medical Kits"
                value={needTitle}
                onChange={(e) => setNeedTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-1 sm:grid-3 gap-md">
              <div className="form-group">
                <label className="form-label" htmlFor="need-cat">Category</label>
                <select
                  id="need-cat"
                  className="form-select"
                  value={needCategory}
                  onChange={(e) => setNeedCategory(e.target.value)}
                >
                  <option value="Food">Food & Grocery</option>
                  <option value="Education">Education & Books</option>
                  <option value="Healthcare">Healthcare & Hygiene</option>
                  <option value="Clothing">Clothing & Apparel</option>
                  <option value="Infrastructure">Shelter & Infrastructure</option>
                  <option value="Emergency">Emergency Relief</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="need-prio">Priority</label>
                <select
                  id="need-prio"
                  className="form-select"
                  value={needPriority}
                  onChange={(e) => setNeedPriority(e.target.value)}
                >
                  <option value="urgent">Urgent Priority</option>
                  <option value="normal">Normal Priority</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="need-qty">Quantity Needed *</label>
                <input
                  id="need-qty"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 10 bags or 30 sets"
                  value={needQuantity}
                  onChange={(e) => setNeedQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="need-cost">Estimated Total Cost ($ USD)</label>
              <input
                id="need-cost"
                type="number"
                min="1"
                className="form-input"
                placeholder="e.g. 150"
                value={needCost}
                onChange={(e) => setNeedCost(e.target.value)}
              />
            </div>

            <div className="flex gap-md pt-sm">
              <button type="submit" className="btn btn-cta" disabled={isSubmitting}>
                {isSubmitting ? 'Publishing...' : 'Publish Requirement'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowNeedForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Needs Table ── */}
      <div className="card p-xl border">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Quantity</th>
                  <th>Est. Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {needs.map((item) => (
                  <tr key={item.id}>
                    <td className="font-semibold">{item.title}</td>
                    <td>{item.category}</td>
                    <td>
                      <span className={`badge badge-${item.priority === 'urgent' ? 'error' : item.priority === 'high' ? 'warning' : 'neutral'}`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </td>
                    <td>{item.quantity_required || item.quantity || '—'}</td>
                    <td>{item.estimated_cost || '—'}</td>
                    <td>
                      <span className={`badge badge-${item.status === 'pending' ? 'warning' : item.status === 'active' || item.status === 'fulfilled' ? 'success' : 'danger'}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


    </div>
  );
}
