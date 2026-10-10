import { supabase } from '../lib/supabaseClient';
import apiClient from '../lib/apiClient';

/**
 * Fetch all verified orphanages for public listing.
 */
export async function getVerifiedOrphanages({ limit = 50, city = null } = {}) {
  try {
    const params = new URLSearchParams({ limit });
    if (city) params.append('city', city);
    
    const { data } = await apiClient.get(`/orphanages?${params.toString()}`);
    if (data && data.success) {
      return data.data || [];
    }
    return [];
  } catch (err) {
    console.warn('orphanageService unexpected error:', err);
    return [];
  }
}

/**
 * Fetch a single orphanage by ID with its campaigns and needs.
 */
export async function getOrphanageById(id) {
  if (!id) return null;

  try {
    const { data } = await apiClient.get(`/orphanages/${id}`);
    if (data && data.success) {
      return data.data;
    }
    return null;
  } catch (err) {
    console.warn('orphanageService unexpected error:', err);
    return null;
  }
}

/**
 * Fetch a single orphanage by profile ID or admin ID.
 */
export async function getOrphanageByAdminId(profileId) {
  if (!profileId) return null;
  try {
    const { data, error } = await supabase
      .from('orphanages')
      .select(`
        *,
        campaigns (*),
        needs (*)
      `)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) {
      console.warn('orphanageService.getOrphanageByAdminId error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('orphanageService unexpected error:', err);
    return null;
  }
}

/**
 * Fetch urgent needs across all verified orphanages.
 */
export async function getUrgentNeeds({ limit = 6 } = {}) {
  try {
    const { data, error } = await supabase
      .from('needs')
      .select(`
        id,
        title,
        category,
        priority,
        status,
        description,
        orphanage:orphanages (
          id,
          name,
          city,
          state,
          country,
          verification_status
        )
      `)
      .eq('priority', 'urgent')
      .eq('status', 'active')
      .limit(limit);

    if (error) {
      console.warn('orphanageService.getUrgentNeeds error:', error.message);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.warn('orphanageService unexpected error:', err);
    return [];
  }
}

/**
 * Fetch active/approved platform campaigns for public display.
 * Campaigns are created by Srinivasam admin and visible to all donors.
 */
export async function getActiveCampaigns({ limit = 50 } = {}) {
  try {
    const { data } = await apiClient.get(`/campaigns?limit=${limit}`);
    if (data && data.success) {
      return data.data || [];
    }
    return [];
  } catch (err) {
    console.warn('orphanageService.getActiveCampaigns error:', err);
    return [];
  }
}

/**
 * Fetch platform-wide aggregate counts.
 */
export async function getPlatformStats() {
  try {
    const [orphanagesRes, campaignsRes, donationsRes, needsRes] = await Promise.allSettled([
      supabase.from('orphanages').select('id', { count: 'exact', head: true }).eq('verification_status', 'approved'),
      supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('donations').select('id', { count: 'exact', head: true }),
      supabase.from('needs').select('id', { count: 'exact', head: true }).eq('status', 'fulfilled'),
    ]);

    return {
      orphanages: orphanagesRes.status === 'fulfilled' ? (orphanagesRes.value.count ?? 0) : 0,
      campaigns: campaignsRes.status === 'fulfilled' ? (campaignsRes.value.count ?? 0) : 0,
      donations: donationsRes.status === 'fulfilled' ? (donationsRes.value.count ?? 0) : 0,
      needsFulfilled: needsRes.status === 'fulfilled' ? (needsRes.value.count ?? 0) : 0,
    };
  } catch (err) {
    console.warn('getPlatformStats error:', err);
    return null;
  }
}

/**
 * Register a new orphanage application for verification.
 */
export async function registerOrphanage(formData, profileId) {
  const trackingId = `SRI-APP-${Math.floor(10000 + Math.random() * 90000)}`;

  // profile_id is required — the RLS policy (orphanages_insert_own) checks auth.uid() = profile_id.
  // NOTE: admin_id was renamed to profile_id in the schema migration; do NOT send admin_id.
  const payload = {
    name: formData.orgName,
    registration_number: formData.registrationNumber,
    email: formData.email,
    phone: formData.phone,
    city: formData.city,
    state: formData.state || '',
    country: formData.country || 'India',
    children_count: parseInt(formData.childrenCount, 10) || 0,
    description: `Contact: ${formData.contactName}. ${formData.description || `Registered non-profit children home in ${formData.city}.`}`,
    verification_status: 'pending',
    profile_id: profileId || null,
    created_at: new Date().toISOString(),
  };


  const { data, error } = await supabase
    .from('orphanages')
    .insert([payload])
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    ...data,
    tracking_id: trackingId
  };
}

/**
 * Create a new material need for an orphanage.
 */
export async function createNeed(orphanageId, needData) {
  try {
    const payload = {
      orphanage_id: orphanageId,
      title: needData.title,
      category: needData.category,
      priority: needData.priority || 'normal',
      quantity_required: needData.quantity,
      estimated_cost: needData.estimatedCost ? parseFloat(needData.estimatedCost.replace(/[^0-9.]/g, '')) || null : null,
      status: 'pending',
    };

    try {
      const { data } = await apiClient.post('/needs', payload);
      if (data && data.success && data.data) {
        return data.data;
      }
    } catch (apiErr) {
      console.warn('createNeed API failed, falling back to direct Supabase insert:', apiErr?.message);
    }

    const { data, error } = await supabase
      .from('needs')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('createNeed insert error:', error.message);
      throw error;
    }

    return data;
  } catch (err) {
    console.warn('createNeed error:', err);
    throw err;
  }
}

/**
 * Update need status (e.g. active ↔ fulfilled).
 */
export async function updateNeedStatus(needId, status) {
  try {
    const { data, error } = await supabase
      .from('needs')
      .update({ status })
      .eq('id', needId)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('updateNeedStatus error:', error.message);
      throw error;
    }
    return data;
  } catch (err) {
    console.warn('updateNeedStatus error:', err);
    throw err;
  }
}

/**
 * Create a new campaign for an orphanage.
 */
export async function createCampaign(orphanageId, campaignData) {
  try {
    const payload = {
      orphanage_id: orphanageId,
      title: campaignData.title,
      description: campaignData.description,
      goal_amount: parseFloat(campaignData.goalAmount) || 1000,
      raised_amount: 0,
      currency: campaignData.currency || 'USD',
      status: 'pending',
      image_url: campaignData.imageUrl || null,
      end_date: campaignData.endDate || null,
      created_at: new Date().toISOString(),
    };

    try {
      const { data } = await apiClient.post('/campaigns', payload);
      if (data && data.success && data.data) {
        return data.data;
      }
    } catch (apiErr) {
      console.warn('createCampaign API failed, falling back to direct Supabase insert:', apiErr?.message);
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('createCampaign error:', error.message);
      throw error;
    }

    return data;
  } catch (err) {
    console.warn('createCampaign error:', err);
    throw err;
  }
}

/**
 * Delete a need.
 */
export async function deleteNeed(needId) {
  try {
    const { error } = await supabase
      .from('needs')
      .delete()
      .eq('id', needId);
    if (error) {
      console.warn('deleteNeed error:', error.message);
      throw error;
    }
  } catch (err) {
    console.warn('deleteNeed error:', err);
    throw err;
  }
}

export async function createVolunteerRequest(requestData) {
  const { data } = await apiClient.post('/volunteer-requests', requestData);
  return data;
}

export async function getMyVolunteerRequests() {
  const { data } = await apiClient.get('/volunteer-requests/my');
  return data;
}
