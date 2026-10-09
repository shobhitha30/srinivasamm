import { Router } from 'express';
import { createClient, User } from '@supabase/supabase-js';
import { env } from '../config/env';

const router = Router();
const url = env.SUPABASE_URL || 'https://placeholder.supabase.co';
const key = env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';
const supabaseAdmin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

function normalizeRole(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (value === 'orphanage' || value === 'orphanage_admin') return 'orphanage';
  if (value === 'volunteer') return 'volunteer';
  if (value === 'donor') return 'donor';
  return null;
}

router.post('/fix-role', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split(' ')[1];

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }

    const userId = userData.user.id;
    const email = userData.user.email ?? null;
    const fullName =
      userData.user.user_metadata?.full_name ||
      userData.user.user_metadata?.name ||
      email?.split('@')[0] ||
      'User';

    const { data: current, error: readError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('id', userId)
      .maybeSingle();

    if (readError) {
      return res.status(500).json({ success: false, error: readError.message });
    }

    const requested =
      normalizeRole(req.body?.role) ??
      normalizeRole(userData.user.user_metadata?.role) ??
      'donor';

    const role = current && current.role !== 'donor' ? current.role : requested;

    if (!current) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: userId,
            email,
            full_name: fullName,
            role,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .maybeSingle();

      if (insertError) {
        return res.status(500).json({ success: false, error: insertError.message });
      }
      return res.json({ success: true, role, profile: inserted });
    }

    const needsUpdate = current.role !== role || (!!fullName && current.full_name !== fullName);

    if (!needsUpdate) {
      return res.json({ success: true, role: current.role, profile: current });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        role,
        full_name: fullName || current.full_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message });
    }

    res.json({ success: true, role, profile: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auto-confirm an address so users can sign in immediately.
// Confirmation only gates the email-verification step — signing in still
// requires the account password. Returns 200 even when no account matches,
// so this endpoint can't be used to probe which emails are registered.
router.post('/confirm', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    let userId: string | null = null;
    let page = 1;
    while (!userId && page <= 10) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      const match = data.users.find((u: User) => (u.email ?? '').toLowerCase() === email);
      if (match) userId = match.id;
      if (data.users.length < 200) break;
      page += 1;
    }

    if (userId) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
      if (updateError) {
        return res.status(500).json({ success: false, error: updateError.message });
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
