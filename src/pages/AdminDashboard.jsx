import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { 
  getAdminOverview, 
  getAdminOrphanages, reviewOrphanage, deleteAdminOrphanage, getAdminOrphanageById,
  getAdminCampaigns, reviewCampaign, createAdminCampaign, updateAdminCampaign, deleteAdminCampaign,
  getAdminNeeds, reviewNeed, deleteAdminNeed,
  getAdminVolunteers, reviewVolunteer, deleteAdminVolunteer,
  getAdminVolunteerRequests, reviewVolunteerRequest, triggerMatching, assignVolunteerToRequest, deleteAdminVolunteerRequest,
  getAdminDonations, getAdminAudits,
  getAdminUsers, updateAdminUserRole, deleteAdminUser
} from '../services/adminService';
import {
  LayoutDashboard, Building2, Megaphone, 
  PackageSearch, Users, CalendarSync,
  BadgeDollarSign, History, AlertCircle, CheckCircle2,
  XCircle, Clock, PauseCircle, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [assignModalData, setAssignModalData] = useState(null);
  const [availableVolunteers, setAvailableVolunteers] = useState([]);
  const navigate = useNavigate();

  const handleSignOut = () => {
    sessionStorage.removeItem('srinivasam_admin');
    navigate('/admin/login');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orphanages', label: 'Orphanages', icon: Building2 },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'needs', label: 'Needs', icon: PackageSearch },
    { id: 'donations', label: 'Donations', icon: BadgeDollarSign },
    { id: 'volunteers', label: 'Volunteers', icon: CheckCircle2 },
    { id: 'volunteer_requests', label: 'Requests', icon: CalendarSync },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'audit', label: 'Audit Log', icon: History }
  ];

  useEffect(() => {
    // Small delay on first load so the backend has time to finish starting up
    const isFirstLoad = activeTab === 'overview';
    const delay = isFirstLoad ? 500 : 0;
    const timer = setTimeout(() => fetchData(), delay);
    return () => clearTimeout(timer);
  }, [activeTab, filter]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      let res;
      const statusFilter = filter === 'all' ? undefined : filter;
      switch (activeTab) {
        case 'overview':
          res = await getAdminOverview();
          break;
        case 'orphanages':
          res = await getAdminOrphanages(statusFilter);
          break;
        case 'campaigns':
          res = await getAdminCampaigns(statusFilter);
          break;
        case 'needs':
          res = await getAdminNeeds(statusFilter);
          break;
        case 'volunteers':
          res = await getAdminVolunteers(statusFilter);
          break;
        case 'volunteer_requests':
          res = await getAdminVolunteerRequests(statusFilter);
          break;
        case 'donations':
          res = await getAdminDonations();
          break;
        case 'audit':
          res = await getAdminAudits();
          break;
        case 'users':
          res = await getAdminUsers();
          break;
        default:
          res = [];
      }
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const map = {
      pending: { color: 'warning', icon: Clock },
      approved: { color: 'success', icon: CheckCircle2 },
      active: { color: 'success', icon: CheckCircle2 },
      rejected: { color: 'danger', icon: XCircle },
      suspended: { color: 'danger', icon: PauseCircle },
      completed: { color: 'success', icon: CheckCircle2 },
      fulfilled: { color: 'success', icon: CheckCircle2 },
      closed: { color: 'neutral', icon: XCircle },
      available: { color: 'success', icon: CheckCircle2 },
      busy: { color: 'warning', icon: Clock },
    };
    const conf = map[status?.toLowerCase()] || { color: 'neutral', icon: AlertCircle };
    const Icon = conf.icon;
    return (
      <span className={`badge badge-${conf.color}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const ActionModal = ({ onConfirm, onClose, title, showReason = false }) => {
    const [reason, setReason] = useState('');
    return (
      <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div className="card" style={{ width: '400px', maxWidth: '90vw' }}>
          <h3>{title}</h3>
          {showReason && (
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Reason</label>
              <textarea className="form-control" value={reason} onChange={e => setReason(e.target.value)} rows={3} required />
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onConfirm(reason)}>Confirm</button>
          </div>
        </div>
      </div>
    );
  };

  const handleImageUpload = (e, setImageUrl) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setImageUrl(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  };

  const CreateCampaignModal = ({ onConfirm, onClose, initialNeed }) => {
    const [title, setTitle] = useState(initialNeed?.title || '');
    const [description, setDescription] = useState(initialNeed?.description || '');
    const [goalAmount, setGoalAmount] = useState(initialNeed?.estimated_cost || '');
    const [imageUrl, setImageUrl] = useState('');
    const [zeffyUrl, setZeffyUrl] = useState('');
    const [priority, setPriority] = useState(initialNeed?.priority || 'normal');
    return (
      <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div className="card" style={{ width: '500px', maxWidth: '90vw' }}>
          <h3>Launch Platform Campaign</h3>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Title *</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Description</label>
            <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Goal Amount ($) *</label>
            <input className="form-input" type="number" min="1" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Priority</label>
            <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Campaign Image (Upload)</label>
            <input className="form-control" type="file" accept="image/*" onChange={e => handleImageUpload(e, setImageUrl)} />
            {imageUrl && <img src={imageUrl} alt="Preview" style={{ marginTop: '0.5rem', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />}
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Zeffy Donation Link (Optional)</label>
            <input className="form-input" type="url" value={zeffyUrl} onChange={e => setZeffyUrl(e.target.value)} placeholder="Leave blank to use default form" />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => {
              const finalDescription = (description || '').trim() + `\n\n<!--PRIORITY:${priority}-->`;
              onConfirm({ title, description: finalDescription, goal_amount: goalAmount, image_url: imageUrl, zeffy_url: zeffyUrl });
            }}>Create Campaign</button>
          </div>
        </div>
      </div>
    );
  };

  const OrphanageDetailsModal = ({ orphanage, onClose }) => {
    if (!orphanage) return null;
    return (
      <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
        <div className="card" style={{ width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Orphanage Details</h3>
            <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div><strong>Name:</strong> {orphanage.name}</div>
            <div><strong>Location:</strong> {orphanage.city}, {orphanage.state}, {orphanage.country}</div>
            <div><strong>Registration Number:</strong> {orphanage.registration_number}</div>
            <div><strong>Children Count:</strong> {orphanage.children_count}</div>
            <div><strong>Status:</strong> <StatusBadge status={orphanage.verification_status} /></div>
            <div><strong>Created At:</strong> {new Date(orphanage.created_at).toLocaleString()}</div>
            <div>
              <strong>Needs Posted:</strong> {orphanage.needs?.length || 0}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [modalState, setModalState] = useState(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedOrphanage, setSelectedOrphanage] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);

  const EditCampaignModal = ({ campaign, onClose, onSave }) => {
    const match = (campaign.description || '').match(/<!--PRIORITY:(.*?)-->/);
    const parsedPriority = match ? match[1] : 'normal';
    const parsedDesc = (campaign.description || '').replace(/<!--PRIORITY:.*?-->/g, '').trim();

    const [title, setTitle] = useState(campaign.title);
    const [description, setDescription] = useState(parsedDesc);
    const [goalAmount, setGoalAmount] = useState(campaign.goal_amount);
    const [zeffyUrl, setZeffyUrl] = useState(campaign.zeffy_url || '');
    const [imageUrl, setImageUrl] = useState(campaign.image_url || '');
    const [priority, setPriority] = useState(parsedPriority);

    return (
      <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
        <div className="card" style={{ width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Edit Campaign</h3>
            <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
          </div>
          <form onSubmit={e => { 
            e.preventDefault(); 
            const finalDescription = description.trim() + `\n\n<!--PRIORITY:${priority}-->`;
            onSave({ title, description: finalDescription, goal_amount: goalAmount, zeffy_url: zeffyUrl, image_url: imageUrl }); 
          }}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Title</label>
              <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Description</label>
              <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} rows={3}></textarea>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Goal Amount ($)</label>
              <input type="number" className="form-control" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Priority</label>
              <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Zeffy Donation Form URL (Optional)</label>
              <input type="url" className="form-control" value={zeffyUrl} onChange={e => setZeffyUrl(e.target.value)} placeholder="Leave blank to use default form" />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Campaign Image (Upload)</label>
              <input type="file" className="form-control" accept="image/*" onChange={e => handleImageUpload(e, setImageUrl)} />
              {imageUrl && <img src={imageUrl} alt="Preview" style={{ marginTop: '0.5rem', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleReview = async (type, id, status, requireReason = false) => {
    if (requireReason) {
      setModalState({ type, id, status, requireReason });
      return;
    }
    executeReview(type, id, status, '');
  };

  const executeReview = async (type, id, status, reason) => {
    // Optimistic UI update for immediate feedback
    setData(prev => Array.isArray(prev) ? prev.map(item => item.id === id ? { ...item, status: status, verification_status: status } : item) : prev);
    setModalState(null);
    try {
      if (type === 'orphanage') await reviewOrphanage(id, status, reason);
      if (type === 'campaign') await reviewCampaign(id, status, reason);
      if (type === 'need') await reviewNeed(id, status, reason);
      if (type === 'volunteer') await reviewVolunteer(id, status);
      if (type === 'volunteer_request') await reviewVolunteerRequest(id, status, reason);
      
      fetchData(false); // Fetch in background to confirm state
    } catch (err) {
      alert(err.message || 'Action failed');
      fetchData(false); // Revert optimistic update on failure
    }
  };

  const handleDeleteItem = async (type, id, name = 'item') => {
    if (!window.confirm(`Are you sure you want to completely delete this ${name}? This action cannot be undone.`)) return;

    // Optimistic delete
    setData(prev => Array.isArray(prev) ? prev.filter(item => item.id !== id) : prev);

    try {
      if (type === 'orphanage') await deleteAdminOrphanage(id);
      if (type === 'campaign') await deleteAdminCampaign(id);
      if (type === 'need') await deleteAdminNeed(id);
      if (type === 'volunteer') await deleteAdminVolunteer(id);
      if (type === 'volunteer_request') await deleteAdminVolunteerRequest(id);
      if (type === 'user') await deleteAdminUser(id);
      fetchData(false);
    } catch (err) {
      alert(err.message || `Failed to delete ${name}`);
      fetchData(false);
    }
  };

  const handleDeleteOrphanage = (id) => handleDeleteItem('orphanage', id, 'orphanage');

  const handleMatch = async (id) => {
    try {
      setLoading(true);
      const vols = await getAdminVolunteers('available');
      setAvailableVolunteers(vols || []);
      setAssignModalData(id);
      setLoading(false);
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  const submitManualAssign = async (volunteerId) => {
    try {
      setLoading(true);
      await assignVolunteerToRequest(assignModalData, volunteerId);
      alert('Volunteer successfully assigned!');
      setAssignModalData(null);
      fetchData();
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (!data) return null;
    const cards = [
      { label: 'Total Donations',          value: `$${Number(data.total_donations || 0).toLocaleString()}`, bg: '#ecfdf5', icon: '' },
      { label: 'Active Campaigns',          value: data.active_campaigns || 0,          bg: '#eff6ff', icon: '' },
      { label: 'Verified Orphanages',       value: data.verified_orphanages || 0,       bg: '#f0fdf4', icon: '?' },
      { label: 'Pending Orphanages',        value: data.pending_orphanages || 0,        bg: '#fffbeb', icon: '?' },
      { label: 'Total Volunteers',          value: data.total_volunteers || 0,          bg: '#fdf4ff', icon: '?' },
      { label: 'Active Vol. Requests',      value: data.active_volunteer_requests || 0, bg: '#fff7ed', icon: '' },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '1rem', marginTop: '0.25rem' }}>
          {cards.map(c => (
            <div key={c.label} style={{ background: c.bg, border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{c.icon}</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.1, letterSpacing: '-0.03em', marginTop: '0.5rem' }}>{c.value}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.3rem' }}>{c.label}</div>
            </div>
          ))}
        </div>
        
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Platform Workflow</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-700)' }}>
            <div style={{ padding: '0.75rem', background: 'var(--primary-50)', borderRadius: '8px', flex: 1 }}>1. Orphanage Registration & Verification</div>
            <span>→</span>
            <div style={{ padding: '0.75rem', background: 'var(--primary-50)', borderRadius: '8px', flex: 1 }}>2. Needs Submitted & Reviewed</div>
            <span>→</span>
            <div style={{ padding: '0.75rem', background: 'var(--primary-50)', borderRadius: '8px', flex: 1 }}>3. Public Campaign Created</div>
            <span>→</span>
            <div style={{ padding: '0.75rem', background: 'var(--primary-50)', borderRadius: '8px', flex: 1 }}>4. Donor Funds Received via Zeffy</div>
            <span>→</span>
            <div style={{ padding: '0.75rem', background: 'var(--primary-50)', borderRadius: '8px', flex: 1 }}>5. Srinivasam Fulfills Need</div>
          </div>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (!data || !Array.isArray(data)) return <p>No data available</p>;
    if (data.length === 0) return <p>No records found.</p>;

    if (activeTab === 'orphanages') {
      return (
        <div className="table-responsive" style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Reg. No.</th>
                <th>Children</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(o => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.city}, {o.state}</td>
                  <td>{o.registration_number}</td>
                  <td>{o.children_count}</td>
                  <td><StatusBadge status={o.verification_status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-xs btn-outline" onClick={() => setSelectedOrphanage(o)}>Details</button>
                      {o.verification_status !== 'approved'  && <button className="btn btn-xs btn-primary" onClick={() => handleReview('orphanage', o.id, 'approved')}>Approve</button>}
                      {o.verification_status !== 'rejected'  && <button className="btn btn-xs btn-danger"  onClick={() => handleReview('orphanage', o.id, 'rejected', true)}>Reject</button>}
                      {o.verification_status === 'approved'  && <button className="btn btn-xs btn-outline" onClick={() => handleReview('orphanage', o.id, 'suspended', true)}>Suspend</button>}
                      <button className="btn btn-xs btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => handleDeleteOrphanage(o.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'campaigns') {
      return (
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Orphanage</th>
                <th>Goal</th>
                <th>Raised</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(c => {
                const goal = c.goal_amount || 1;
                const raised = c.raised_amount || 0;
                const pct = Math.min(100, Math.round((raised / goal) * 100));
                
                return (
                  <tr key={c.id}>
                    <td>{c.title}</td>
                    <td>{c.orphanage?.name || c.orphanages?.name || 'Platform'}</td>
                    <td>${goal}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>${raised}</span>
                        <div style={{ width: '60px', height: '6px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary-600)' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pct}%</span>
                      </div>
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {c.status !== 'approved' && c.status !== 'active' && <button className="btn btn-xs btn-primary" onClick={() => handleReview('campaign', c.id, 'approved')}>Approve</button>}
                        {c.status !== 'rejected' && <button className="btn btn-xs btn-danger" onClick={() => handleReview('campaign', c.id, 'rejected', true)}>Reject</button>}
                        <button className="btn btn-xs btn-outline" onClick={() => setEditingCampaign(c)}>Edit</button>
                        {(c.status === 'approved' || c.status === 'active') && <button className="btn btn-xs btn-outline" onClick={() => handleReview('campaign', c.id, 'closed', true)}>Close</button>}
                        {c.status === 'closed' && <button className="btn btn-xs btn-outline" onClick={() => handleReview('campaign', c.id, 'active')}>Reopen</button>}
                        <button className="btn btn-xs btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => handleDeleteItem('campaign', c.id, 'campaign')}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'needs') {
      return (
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Orphanage</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Target</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(n => (
                <tr key={n.id}>
                  <td>{n.title}</td>
                  <td>{n.orphanage?.name || n.orphanages?.name || 'Platform'}</td>
                  <td>{n.category}</td>
                  <td><span className={`badge badge-${n.priority === 'urgent' ? 'danger' : n.priority === 'high' ? 'warning' : 'neutral'}`}>{n.priority}</span></td>
                  <td>{n.quantity_required ? `${n.quantity_required}` : (n.estimated_cost ? `$${n.estimated_cost}` : '-')}</td>
                  <td><StatusBadge status={n.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {n.status !== 'approved' && n.status !== 'fulfilled' && <button className="btn btn-xs btn-primary" onClick={() => handleReview('need', n.id, 'approved')}>Approve</button>}
                      {n.status !== 'rejected' && n.status !== 'fulfilled' && <button className="btn btn-xs btn-danger" onClick={() => handleReview('need', n.id, 'rejected', true)}>Reject</button>}
                      {n.status === 'approved' && (
                        <button
                          className="btn btn-xs btn-cta"
                          title="Create a public donation campaign based on this need"
                          onClick={() => {
                            setShowCreateCampaign(n);
                          }}
                        >
                          🚀 Create Campaign
                        </button>
                      )}
                      {(n.status === 'approved' || n.status === 'active') && (
                        <button className="btn btn-xs btn-outline" style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)' }} onClick={() => handleReview('need', n.id, 'fulfilled')}>Mark Fulfilled</button>
                      )}
                      <button className="btn btn-xs btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => handleDeleteItem('need', n.id, 'need')}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'volunteers') {
      return (
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Skills</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(v => (
                <tr key={v.id}>
                  <td>{v.profiles?.full_name || 'N/A'}</td>
                  <td>{v.location}</td>
                  <td>{v.skills?.join(', ')}</td>
                  <td><StatusBadge status={v.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {v.status !== 'available' && v.status !== 'busy' && <button className="btn btn-xs btn-primary" onClick={() => handleReview('volunteer', v.id, 'available')}>Approve</button>}
                      {v.status !== 'rejected' && <button className="btn btn-xs btn-danger" onClick={() => handleReview('volunteer', v.id, 'rejected')}>Reject</button>}
                      {(v.status === 'available' || v.status === 'busy') && <button className="btn btn-xs btn-outline" onClick={() => handleReview('volunteer', v.id, 'suspended')}>Suspend</button>}
                      <button className="btn btn-xs btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => handleDeleteItem('volunteer', v.id, 'volunteer')}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'volunteer_requests') {
      return (
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Orphanage</th>
                <th>Skills</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.orphanage?.name || r.orphanages?.name || 'Platform'}</td>
                  <td>{r.required_skills?.join(', ')}</td>
                  <td>{new Date(r.start_time).toLocaleDateString()}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {r.status !== 'approved' && r.status !== 'completed' && <button className="btn btn-xs btn-primary" onClick={() => handleReview('volunteer_request', r.id, 'approved')}>Approve</button>}
                      {r.status !== 'rejected' && r.status !== 'completed' && <button className="btn btn-xs btn-danger" onClick={() => handleReview('volunteer_request', r.id, 'rejected', true)}>Reject</button>}
                      {r.status === 'approved' && <button className="btn btn-xs btn-cta" onClick={() => handleMatch(r.id)}>Assign</button>}
                      <button className="btn btn-xs btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => handleDeleteItem('volunteer_request', r.id, 'volunteer request')}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'donations') {
      return (
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Campaign</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.id}>
                  <td>{d.profiles?.full_name || 'Anonymous'}</td>
                  <td>{d.campaigns?.title || 'General'}</td>
                  <td>${d.amount}</td>
                  <td>{d.is_recurring ? 'Recurring' : 'One-time'}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'audit') {
      return (
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {data.map(a => {
                const actionText = a.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let detailsStr = '';
                try {
                  detailsStr = Object.entries(a.details || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
                } catch(e) {}
                
                return (
                  <tr key={a.id}>
                    <td>{new Date(a.created_at).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{a.profiles?.full_name || a.details?.actor_name || a.actor_id || 'System'}</td>
                    <td><span className="badge badge-accent">{actionText}</span></td>
                    <td style={{ fontSize: '0.85rem' }}><strong style={{textTransform:'capitalize'}}>{a.entity_type}</strong><br/><span style={{color:'var(--text-muted)'}}>{a.entity_id}</span></td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{detailsStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'users') {
      return (
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email || '-'}</td>
                  <td><StatusBadge status={u.role} /></td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select 
                        className="form-select" 
                        style={{ padding: '0.2rem 1rem 0.2rem 0.5rem', height: 'auto', fontSize: '0.8rem' }}
                        value={u.role || 'donor'}
                        onChange={(e) => {
                          updateAdminUserRole(u.id, e.target.value).then(() => fetchData(false)).catch(err => alert(err.message));
                        }}
                      >
                        <option value="donor">Donor</option>
                        <option value="admin">Admin</option>
                        <option value="orphanage">Orphanage</option>
                        <option value="volunteer">Volunteer</option>
                      </select>
                      <button className="btn btn-xs btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => {
                        if(window.confirm('Delete this user?')) {
                          deleteAdminUser(u.id).then(() => fetchData(false)).catch(err => alert(err.message));
                        }
                      }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return null;
  };

  const FilterButtons = () => {
    if (['overview', 'donations', 'audit'].includes(activeTab)) return null;
    let options = ['all', 'pending', 'approved', 'rejected', 'suspended'];
    if (activeTab === 'campaigns') options = ['all', 'pending', 'approved', 'active', 'rejected', 'closed'];
    if (activeTab === 'needs') options = ['all', 'pending', 'active', 'rejected', 'fulfilled', 'closed'];
    if (activeTab === 'volunteers') options = ['all', 'pending', 'available', 'busy', 'unavailable', 'suspended', 'rejected'];

    return (
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {options.map(opt => (
          <button 
            key={opt}
            className={`btn btn-sm ${filter === opt ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(opt)}
            style={{ textTransform: 'capitalize' }}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Header Bar ── */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-xs)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#1e293b,#0f172a)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>?</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)' }}>Srinivasam Admin</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Operations Dashboard</div>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Sidebar ── */}
        <aside style={{ width: 220, background: 'white', borderRight: '1px solid var(--border)', padding: '1.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0, overflowY: 'auto' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.75rem', marginBottom: '0.5rem' }}>Navigation</p>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setFilter('all'); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.6rem 0.75rem', border: 'none', borderRadius: 8, background: isActive ? 'var(--primary-50)' : 'transparent', color: isActive ? 'var(--primary-700)' : 'var(--gray-600)', fontWeight: isActive ? 700 : 500, fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s ease' }}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', margin: 0, letterSpacing: '-0.02em' }}>{tabs.find(t => t.id === activeTab)?.label}</h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                {activeTab === 'overview' ? 'Platform-wide metrics at a glance.' : activeTab === 'audit' ? 'Full audit trail of admin actions.' : `Manage and review ${tabs.find(t => t.id === activeTab)?.label?.toLowerCase()} on the platform.`}
              </p>
            </div>
            {activeTab === 'campaigns' && (
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }} onClick={() => setShowCreateCampaign(true)}>
                + Launch Platform Campaign
              </button>
            )}
          </div>

          <FilterButtons />

          <div className="card" style={{ padding: '1.5rem', minHeight: 300 }}>
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading data…</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>?</div>
                <p style={{ color: 'var(--color-danger)', fontWeight: 600, marginBottom: '0.25rem' }}>Could not connect to the server</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>The backend may still be starting up. Please wait a moment and try again.</p>
                <button className="btn btn-primary btn-sm" onClick={() => fetchData()}>↻ Retry</button>
              </div>
            ) : (
              activeTab === 'overview' ? renderOverview() : renderTable()
            )}
          </div>
        </main>
      </div>

      {modalState && (
        <ActionModal
          title={`Confirm: ${modalState.status} — ${modalState.type}`}
          showReason={modalState.requireReason}
          onConfirm={(reason) => executeReview(modalState.type, modalState.id, modalState.status, reason)}
          onClose={() => setModalState(null)}
        />
      )}

      {showCreateCampaign && (
        <CreateCampaignModal
          initialNeed={typeof showCreateCampaign === 'object' ? showCreateCampaign : null}
          onClose={() => setShowCreateCampaign(false)}
          onConfirm={async (campaignData) => {
            if (!campaignData.title || !campaignData.goal_amount) {
              alert('Title and Goal Amount are required');
              return;
            }
            try {
              await createAdminCampaign(campaignData);
              setShowCreateCampaign(false);
              fetchData(false);
              alert('Platform campaign launched successfully!');
            } catch (err) {
              alert(err.message || 'Failed to create campaign');
            }
          }}
        />
      )}
      
      {selectedOrphanage && (
        <OrphanageDetailsModal orphanage={selectedOrphanage} onClose={() => setSelectedOrphanage(null)} />
      )}
      
      {editingCampaign && (
        <EditCampaignModal
          campaign={editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onSave={async (updates) => {
            try {
              await updateAdminCampaign(editingCampaign.id, updates);
              setEditingCampaign(null);
              fetchData(false);
            } catch (err) {
              alert(err.message || 'Failed to update campaign');
            }
          }}
        />
      )}
      {assignModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', background: 'var(--bg)', color: 'var(--text)' }}>
            <h3 style={{ marginTop: 0 }}>Assign Volunteer</h3>
            {availableVolunteers.length === 0 ? (
              <p>No available volunteers found. Please approve some volunteers first.</p>
            ) : (
              <table className="table" style={{ width: '100%', marginTop: '1rem' }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Skills</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableVolunteers.map(v => (
                    <tr key={v.id}>
                      <td>{v.profiles?.full_name || 'N/A'}</td>
                      <td>{v.location}</td>
                      <td>{v.skills?.join(', ')}</td>
                      <td>
                        <button className="btn btn-xs btn-primary" onClick={() => submitManualAssign(v.id)}>Assign</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button className="btn btn-outline" onClick={() => setAssignModalData(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
