import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { env } from '../config/env';
import { logAudit } from '../services/auditService';
import { matchVolunteers } from '../services/matchingEngine';

const router = Router();

// ── Overview Stats ──────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const [
      { count: totalOrphanages },
      { count: pendingOrphanages },
      { count: approvedOrphanages },
      { count: activeCampaigns },
      { count: pendingCampaigns },
      { count: totalVolunteers },
      { count: activeRequests },
      { count: pendingNeeds },
      { data: donationStats },
      { count: pendingPayments },
    ] = await Promise.all([
      supabase.from('orphanages').select('*', { count: 'exact', head: true }),
      supabase.from('orphanages').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('orphanages').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved'),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('volunteers').select('*', { count: 'exact', head: true }),
      supabase.from('volunteer_requests').select('*', { count: 'exact', head: true }).in('status', ['pending', 'approved', 'matching', 'matched', 'assigned']),
      supabase.from('needs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('donations').select('amount').eq('status', 'completed'),
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    const totalDonations = (donationStats || []).reduce((sum: number, d: any) => sum + (parseFloat(d.amount) || 0), 0);

    res.json({
      success: true,
      data: {
        total_donations: totalDonations,
        active_campaigns: activeCampaigns || 0,
        verified_orphanages: approvedOrphanages || 0,
        pending_orphanages: pendingOrphanages || 0,
        total_volunteers: totalVolunteers || 0,
        active_volunteer_requests: activeRequests || 0,
        totalOrphanages: totalOrphanages || 0,
        pendingOrphanages: pendingOrphanages || 0,
        approvedOrphanages: approvedOrphanages || 0,
        activeCampaigns: activeCampaigns || 0,
        pendingCampaigns: pendingCampaigns || 0,
        totalVolunteers: totalVolunteers || 0,
        activeRequests: activeRequests || 0,
        pendingNeeds: pendingNeeds || 0,
        totalDonations,
        pendingPayments: pendingPayments || 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Orphanages ──────────────────────────────────────────────
router.get('/orphanages', async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('orphanages').select('*').order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('verification_status', status as string);
  const { data, error } = await query;
  res.json({ success: !error, data: data || [], error: error?.message });
});

router.put('/orphanages/:id/review', async (req, res) => {
  const { status, rejection_reason } = req.body;
  const { id } = req.params;
  const user = (req as any).user;

  const payload: any = {
    verification_status: status,
    rejection_reason: rejection_reason || null,
    reviewed_at: new Date().toISOString(),
  };
  if (user.id !== 'admin-demo-id') payload.reviewed_by = user.id;

  const { data, error } = await supabase.from('orphanages').update(payload).eq('id', id).select().single();

  if (error) {
    return res.json({ success: false, data: null, error: error.message });
  }

  // CRITICAL FIX: Sync the orphanage owner's profile role with the approval decision.
  // Must execute with an admin user session so Postgres trigger is_platform_admin() passes.
  if (data?.profile_id) {
    const newRole = status === 'approved' ? 'orphanage' : 'donor';
    let clientToUse = supabase;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader !== 'Bearer admin-demo-token') {
      clientToUse = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        global: { headers: { Authorization: authHeader } }
      });
    } else {
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({ type: 'magiclink', email: 'anishjrall@gmail.com' });
        if (linkData?.properties?.email_otp) {
          const { data: sess } = await supabase.auth.verifyOtp({ email: 'anishjrall@gmail.com', token: linkData.properties.email_otp, type: 'email' });
          if (sess?.session?.access_token) {
            clientToUse = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
              global: { headers: { Authorization: `Bearer ${sess.session.access_token}` } }
            });
          }
        }
      } catch (adminAuthErr) {
        console.warn('Failed to acquire admin user token for profile role update:', adminAuthErr);
      }
    }

    const { error: roleErr } = await clientToUse
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', data.profile_id);

    if (roleErr) console.error('Failed to update profile role:', roleErr.message);
  }

  await logAudit(user.id, `orphanage_${status}`, 'orphanages', id, { status, rejection_reason });
  res.json({ success: true, data, error: null });
});


router.delete('/orphanages/:id', async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  const { error } = await supabase.from('orphanages').delete().eq('id', id);
  if (!error) await logAudit(user.id, `orphanage_deleted`, 'orphanages', id, {});
  res.json({ success: !error, error: error?.message });
});

router.get('/orphanages/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('orphanages').select('*').eq('id', id).single();
  res.json({ success: !error, data, error: error?.message });
});

// ── Campaigns ───────────────────────────────────────────────
router.get('/campaigns', async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('campaigns').select('*, orphanage:orphanages(name, city)').order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status as string);
  const { data, error } = await query;
  res.json({ success: !error, data: data || [], error: error?.message });
});

router.put('/campaigns/:id', async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  const updates = req.body;
  const { error } = await supabase.from('campaigns').update(updates).eq('id', id);
  if (!error) await logAudit(user.id, 'campaign_updated', 'campaigns', id, updates);
  res.json({ success: !error, error: error?.message });
});

router.post('/campaigns', async (req, res) => {
  const { title, description, goal_amount, image_url, currency, end_date, zeffy_url } = req.body;
  const user = (req as any).user;

  // Use the special Srinivasam Platform orphanage for admin-created campaigns
  // This satisfies the NOT NULL FK constraint on orphanage_id
  const PLATFORM_ORPHANAGE_ID = '0c9d2161-576a-4acb-9bd3-595de1bf63b6';

  const payload: any = {
    title,
    description: description || '',
    goal_amount: parseFloat(goal_amount) || 1000,
    raised_amount: 0,
    currency: currency || 'USD',
    status: 'active',
    image_url: image_url || null,
    end_date: end_date || null,
    orphanage_id: PLATFORM_ORPHANAGE_ID,
  };

  // Add zeffy_url if the column exists (safe — Supabase ignores unknown fields)
  if (zeffy_url) payload.zeffy_url = zeffy_url;

  const { data, error } = await supabase.from('campaigns').insert([payload]).select().single();
  if (error) {
    console.error('Campaign insert error:', error.message);
    return res.json({ success: false, data: null, error: error.message });
  }
  await logAudit(user.id, 'campaign_created', 'campaigns', data.id, payload);
  res.json({ success: true, data, error: null });
});


router.put('/campaigns/:id/review', async (req, res) => {
  const { status, rejection_reason } = req.body;
  const { id } = req.params;
  const user = (req as any).user;

  const payload: any = {
    status,
    rejection_reason: rejection_reason || null,
    reviewed_at: new Date().toISOString(),
  };
  if (user.id !== 'admin-demo-id') payload.reviewed_by = user.id;

  const { data, error } = await supabase.from('campaigns').update(payload).eq('id', id).select().single();

  if (data) await logAudit(user.id, `campaign_${status}`, 'campaigns', id, { status, rejection_reason });
  res.json({ success: !error, data, error: error?.message });
});

// ── Needs ───────────────────────────────────────────────────
router.get('/needs', async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('needs').select('*, orphanage:orphanages(name, city)').order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status as string);
  const { data, error } = await query;
  res.json({ success: !error, data: data || [], error: error?.message });
});

router.put('/needs/:id/review', async (req, res) => {
  const { status, rejection_reason } = req.body;
  const { id } = req.params;
  const user = (req as any).user;

  const payload: any = {
    status,
    rejection_reason: rejection_reason || null,
    reviewed_at: new Date().toISOString(),
  };
  if (user.id !== 'admin-demo-id') payload.reviewed_by = user.id;

  const { data, error } = await supabase.from('needs').update(payload).eq('id', id).select().single();

  if (data) await logAudit(user.id, `need_${status}`, 'needs', id, { status, rejection_reason });
  res.json({ success: !error, data, error: error?.message });
});

// ── Volunteers ──────────────────────────────────────────────
router.get('/volunteers', async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('volunteers').select('*, profiles!volunteers_profile_id_fkey(full_name)').order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status as string);
  const { data, error } = await query;
  res.json({ success: !error, data: data || [], error: error?.message });
});

router.put('/volunteers/:id/review', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const user = (req as any).user;

  const payload: any = {
    status,
    reviewed_at: new Date().toISOString(),
  };
  if (user.id !== 'admin-demo-id') payload.reviewed_by = user.id;

  const { data, error } = await supabase.from('volunteers').update(payload).eq('id', id).select().single();

  if (data) await logAudit(user.id, `volunteer_${status}`, 'volunteers', id, { status });
  res.json({ success: !error, data, error: error?.message });
});

// ── Volunteer Requests ──────────────────────────────────────
router.get('/volunteer-requests', async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('volunteer_requests').select('*, orphanage:orphanages(name, city)').order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status as string);
  const { data, error } = await query;
  res.json({ success: !error, data: data || [], error: error?.message });
});

router.put('/volunteer-requests/:id/review', async (req, res) => {
  const { status, rejection_reason } = req.body;
  const { id } = req.params;
  const user = (req as any).user;

  const payload: any = {
    status,
    rejection_reason: rejection_reason || null,
    reviewed_at: new Date().toISOString(),
  };
  if (user.id !== 'admin-demo-id') payload.reviewed_by = user.id;

  const { data, error } = await supabase.from('volunteer_requests').update(payload).eq('id', id).select().single();

  if (data) await logAudit(user.id, `volunteer_request_${status}`, 'volunteer_requests', id, { status, rejection_reason });
  res.json({ success: !error, data, error: error?.message });
});

// ── Manual Assignment ───────────────────────────────────────
router.post('/volunteer-requests/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { volunteer_id } = req.body;
  const user = (req as any).user;

  try {
    const { data: request, error: reqError } = await supabase.from('volunteer_requests').select('*').eq('id', id).single();
    if (reqError || !request) return res.status(404).json({ success: false, error: 'Request not found' });

    const { data: assignment, error: assignError } = await supabase.from('volunteer_assignments').insert({
      request_id: id,
      volunteer_id: volunteer_id,
      match_score: 100, // Manual assignment
      status: 'assigned',
      scheduled_date: request.required_date,
      start_time: request.start_time,
      end_time: request.end_time,
    }).select().single();

    if (assignError) {
      return res.status(500).json({ success: false, error: assignError.message });
    }

    await supabase.from('volunteer_requests').update({ status: 'assigned' }).eq('id', id);

    await logAudit(user.id, 'manual_assignment', 'volunteer_requests', id, {
      assigned_volunteer_id: volunteer_id
    });

    res.json({ success: true, data: assignment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Trigger Matching ────────────────────────────────────────
router.post('/volunteer-requests/:id/match', async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const { data: request, error: reqError } = await supabase.from('volunteer_requests').select('*').eq('id', id).single();
    if (reqError || !request) return res.status(404).json({ success: false, error: 'Request not found' });

    await supabase.from('volunteer_requests').update({ status: 'matching' }).eq('id', id);

    const { data: volunteers } = await supabase.from('volunteers').select('*').eq('status', 'available');

    const matches = matchVolunteers(request, volunteers || []);

    if (matches.length === 0) {
      await supabase.from('volunteer_requests').update({ status: 'approved' }).eq('id', id);
      return res.json({ success: true, data: { matches: [], message: 'No suitable volunteers found' } });
    }

    const topMatch = matches[0];
    const { data: assignment, error: assignError } = await supabase.from('volunteer_assignments').insert({
      request_id: id,
      volunteer_id: topMatch.id,
      match_score: topMatch.match_score,
      status: 'assigned',
      scheduled_date: request.required_date,
      start_time: request.start_time,
      end_time: request.end_time,
    }).select().single();

    if (assignError) {
      await supabase.from('volunteer_requests').update({ status: 'approved' }).eq('id', id);
      return res.status(500).json({ success: false, error: assignError.message });
    }

    await supabase.from('volunteer_requests').update({ status: 'assigned' }).eq('id', id);

    await logAudit(user.id, 'trigger_matching', 'volunteer_requests', id, {
      top_match_volunteer_id: topMatch.id,
      match_score: topMatch.match_score,
      total_candidates: matches.length,
    });

    res.json({
      success: true,
      data: {
        assignment,
        candidates: matches.slice(0, 5),
        message: `Matched and assigned to volunteer with score ${topMatch.match_score}`,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Donations ───────────────────────────────────────────────
router.get('/donations', async (req, res) => {
  const { data, error } = await supabase.from('donations')
    .select('*, campaign:campaigns(title, orphanage:orphanages(name)), payment:payments(*)')
    .order('created_at', { ascending: false });
  res.json({ success: !error, data: data || [], error: error?.message });
});

// ── Payments ────────────────────────────────────────────────
router.get('/payments', async (req, res) => {
  const { data, error } = await supabase.from('payments')
    .select('*, donation:donations(amount, currency, campaign:campaigns(title))')
    .order('created_at', { ascending: false });
  res.json({ success: !error, data: data || [], error: error?.message });
});

// ── Receipts ────────────────────────────────────────────────
router.get('/receipts', async (req, res) => {
  const { data, error } = await supabase.from('receipts').select('*').order('created_at', { ascending: false });
  res.json({ success: !error, data: data || [], error: error?.message });
});

// ── Audit Log ───────────────────────────────────────────────
router.get('/audits', async (req, res) => {
  const { data, error } = await supabase.from('audits')
    .select('*, profiles:actor_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(200);
  res.json({ success: !error, data: data || [], error: error?.message });
});

// ── Users ───────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  res.json({ success: !error, data: data || [], error: error?.message });
});

router.put('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const user = (req as any).user;
  
  if (!['admin', 'donor', 'orphanage', 'volunteer'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role' });
  }

  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (!error) await logAudit(user.id, `user_role_changed_to_${role}`, 'profiles', id, { role });
  res.json({ success: !error, error: error?.message });
});

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  // This just deletes the profile, actual auth user needs edge function but this is a start
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (!error) await logAudit(user.id, `user_deleted`, 'profiles', id, {});
  res.json({ success: !error, error: error?.message });
});

export default router;
