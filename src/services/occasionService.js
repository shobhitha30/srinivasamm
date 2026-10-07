import { supabase } from '../lib/supabaseClient';

export async function getUserOccasions(userId) {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('special_occasions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error || !data) {
      return [];
    }
    return data;
  } catch (err) {
    console.warn('getUserOccasions error:', err);
    return [];
  }
}

export async function createOccasion(userId, occasionData) {
  try {
    const payload = {
      user_id: userId,
      title: occasionData.title,
      date: occasionData.date,
      type: occasionData.type || 'Birthday',
      target_amount: parseFloat(occasionData.targetAmount) || 250,
      raised_amount: 0,
      message: occasionData.message || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('special_occasions')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('createOccasion error:', error.message);
    }
    return data || { id: `occ-${Date.now()}`, ...payload };
  } catch (err) {
    console.warn('createOccasion error:', err);
    return { id: `occ-${Date.now()}`, ...occasionData, raisedAmount: 0 };
  }
}
