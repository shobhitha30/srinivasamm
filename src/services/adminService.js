import apiClient from '../lib/apiClient';

export async function getAdminOverview() {
  const { data } = await apiClient.get('/admin/overview');
  return data.data;
}

export async function getAdminOrphanages(filter) {
  const { data } = await apiClient.get('/admin/orphanages', { params: { status: filter } });
  return data.data;
}

export async function reviewOrphanage(id, status, rejectionReason) {
  const { data } = await apiClient.put(`/admin/orphanages/${id}/review`, { status, rejection_reason: rejectionReason });
  return data.data;
}

export async function deleteAdminOrphanage(id) {
  const { data } = await apiClient.delete(`/admin/orphanages/${id}`);
  return data;
}

export async function getAdminCampaigns(filter) {
  const { data } = await apiClient.get('/admin/campaigns', { params: { status: filter } });
  return data.data;
}

export async function createAdminCampaign(campaignData) {
  const { data } = await apiClient.post('/admin/campaigns', campaignData);
  if (data.success === false) throw new Error(data.error);
  return data.data;
}

export async function reviewCampaign(id, status, rejectionReason) {
  const { data } = await apiClient.put(`/admin/campaigns/${id}/review`, { status, rejection_reason: rejectionReason });
  return data.data;
}

export async function getAdminNeeds(filter) {
  const { data } = await apiClient.get('/admin/needs', { params: { status: filter } });
  return data.data;
}

export async function reviewNeed(id, status, rejectionReason) {
  const { data } = await apiClient.put(`/admin/needs/${id}/review`, { status, rejection_reason: rejectionReason });
  return data.data;
}

export async function getAdminVolunteers(filter) {
  const { data } = await apiClient.get('/admin/volunteers', { params: { status: filter } });
  return data.data;
}

export async function reviewVolunteer(id, status) {
  const { data } = await apiClient.put(`/admin/volunteers/${id}/review`, { status });
  return data.data;
}

export async function getAdminVolunteerRequests(filter) {
  const { data } = await apiClient.get('/admin/volunteer-requests', { params: { status: filter } });
  return data.data;
}

export async function reviewVolunteerRequest(id, status, rejectionReason) {
  const { data } = await apiClient.put(`/admin/volunteer-requests/${id}/review`, { status, rejection_reason: rejectionReason });
  return data.data;
}

export async function triggerMatching(requestId) {
  const { data } = await apiClient.post(`/admin/volunteer-requests/${requestId}/match`);
  return data.data;
}

export async function getAdminDonations() {
  const { data } = await apiClient.get('/admin/donations');
  return data.data;
}

export async function getAdminPayments() {
  const { data } = await apiClient.get('/admin/payments');
  return data.data;
}

export async function getAdmUSDeceipts() {
  const { data } = await apiClient.get('/admin/receipts');
  return data.data;
}

export async function getAdminAudits() {
  const { data } = await apiClient.get('/admin/audits');
  return data.data;
}
export async function getAdminUsers() {
  const { data } = await apiClient.get('/admin/users');
  return data.data;
}

export async function updateAdminUserRole(id, role) {
  const { data } = await apiClient.put(`/admin/users/${id}/role`, { role });
  return data.data;
}

export async function deleteAdminUser(id) {
  const { data } = await apiClient.delete(`/admin/users/${id}`);
  return data.data;
}

export async function updateAdminCampaign(id, updates) {
  const { data } = await apiClient.put(`/admin/campaigns/${id}`, updates);
  return data.data;
}

export async function getAdminOrphanageById(id) {
  const { data } = await apiClient.get(`/admin/orphanages/${id}`);
  return data.data;
}

export async function assignVolunteerToRequest(requestId, volunteerId) {
  const { data } = await apiClient.post(`/admin/volunteer-requests/${requestId}/assign`, { volunteer_id: volunteerId });
  return data;
}
