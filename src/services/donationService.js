import { supabase } from '../lib/supabaseClient';
import apiClient from '../lib/apiClient';

/**
 * Fetch all donations for the current authenticated user.
 * Ordered by most recent first.
 */
export async function getUserDonations(userId, { limit = 50 } = {}) {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('donations')
      .select(`
        id,
        amount,
        currency,
        status,
        created_at,
        campaign:campaigns (
          id,
          title,
          orphanage:orphanages (
            id,
            name,
            city,
            state
          )
        )
      `)
      .eq('donor_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('donationService.getUserDonations error:', error.message);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.warn('donationService unexpected error:', err);
    return [];
  }
}

/**
 * Get aggregate donation stats for a user.
 * Returns { totalAmount, totalCount, causesSupported }
 */
export async function getUserDonationStats(userId) {
  if (!userId) return { totalAmount: 0, totalCount: 0, causesSupported: 0 };

  try {
    const { data, error } = await supabase
      .from('donations')
      .select('amount, campaign_id')
      .eq('donor_id', userId)
      .eq('status', 'completed');

    if (error) {
      console.warn('donationService.getUserDonationStats error:', error.message);
      return { totalAmount: 0, totalCount: 0, causesSupported: 0 };
    }

    const rows = data ?? [];
    const totalAmount = rows.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    const uniqueCampaigns = new Set(rows.map((d) => d.campaign_id).filter(Boolean));

    return {
      totalAmount,
      totalCount: rows.length,
      causesSupported: uniqueCampaigns.size,
    };
  } catch (err) {
    console.warn('donationService.getUserDonationStats unexpected error:', err);
    return { totalAmount: 0, totalCount: 0, causesSupported: 0 };
  }
}
/**
 * Log a new successful donation transaction.
 */
export async function recordDonation(donationData) {
  const payload = {
    campaign_id: donationData.campaignId || null,
    amount: parseFloat(donationData.amount) || 0,
    currency: donationData.currency || 'USD',
    is_recurring: donationData.isRecurring || false,
  };

  const { data } = await apiClient.post('/donations', payload);
  return data.data;
}

