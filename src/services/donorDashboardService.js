import { supabase } from '../lib/supabaseClient';

/**
 * Get donor-specific stats (total donated, causes supported, donation count).
 * Returns zeroed stats on any error so the dashboard always renders cleanly.
 */
export async function getDonorStats(userId) {
  if (!userId) return { totalDonated: 0, causesSupported: 0, donationCount: 0 };

  try {
    const { data, error } = await supabase
      .from('donations')
      .select('amount, campaign_id, status')
      .eq('donor_id', userId)
      .eq('status', 'completed');

    if (error) {
      console.warn('getDonorStats error:', error.message);
      return { totalDonated: 0, causesSupported: 0, donationCount: 0 };
    }

    const donations = data ?? [];
    const totalDonated = donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    const uniqueCampaigns = new Set(donations.map((d) => d.campaign_id).filter(Boolean));

    return {
      totalDonated,
      causesSupported: uniqueCampaigns.size,
      donationCount: donations.length,
    };
  } catch (err) {
    console.warn('getDonorStats unexpected error:', err);
    return { totalDonated: 0, causesSupported: 0, donationCount: 0 };
  }
}

/**
 * Fetch the most recent donations for a donor.
 */
export async function getDonorRecentDonations(userId, { limit = 5 } = {}) {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('donations')
      .select(`
        id,
        amount,
        currency,
        status,
        is_recurring,
        created_at,
        campaign:campaigns (
          id,
          title,
          orphanage:orphanages ( id, name, city, state )
        )
      `)
      .eq('donor_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('getDonorRecentDonations error:', error.message);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.warn('getDonorRecentDonations unexpected error:', err);
    return [];
  }
}
