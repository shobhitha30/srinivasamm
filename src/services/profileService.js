import { supabase } from '../lib/supabaseClient';
import { normalizeRole } from '../lib/roles';

/**
 * Ensure a profile row exists for the user.
 * The role passed in wins; it is never silently downgraded by this function.
 * Throws when the row cannot be written so callers can surface the failure.
 */
export async function ensureUserProfile(user, fullNameInput = null, roleInput = null) {
  if (!user) return null;

  const fullName =
    fullNameInput ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User';

  const role = normalizeRole(roleInput || user.user_metadata?.role) || 'donor';

  const profileData = {
    id: user.id,
    full_name: fullName,
    email: user.email,
    role,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' })
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Could not save your profile.');
  }

  return data || profileData;
}

/**
 * Fetch profile data for the active authenticated user
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching user profile:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Error fetching profile:', err);
    return null;
  }
}
