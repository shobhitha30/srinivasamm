import { Router } from 'express';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { supabase } from '../lib/supabase';

const router = Router();

// ── Volunteer Requests (orphanage creates) ──────────────────
router.post('/volunteer-requests', auth, requireRole(['orphanage']), async (req, res) => {
  try {
    const user = (req as any).user;
    const { data: orphanage } = await supabase.from('orphanages')
      .select('id, verification_status')
      .eq('profile_id', user.id)
      .single();

    if (!orphanage || orphanage.verification_status !== 'approved') {
      return res.status(403).json({ success: false, error: 'Only approved orphanages can create requests' });
    }

    const { title, description, required_skills, required_interests, location, required_date, start_time, end_time } = req.body;

    const { data, error } = await supabase.from('volunteer_requests').insert({
      orphanage_id: orphanage.id,
      title,
      description,
      required_skills: required_skills || [],
      required_interests: required_interests || [],
      location,
      required_date,
      start_time,
      end_time,
      status: 'pending',
    }).select().single();

    res.json({ success: !error, data, error: error?.message });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Orphanage's own requests ────────────────────────────────
router.get('/volunteer-requests/my', auth, requireRole(['orphanage']), async (req, res) => {
  const user = (req as any).user;
  const { data: orphanage } = await supabase.from('orphanages').select('id').eq('profile_id', user.id).single();

  if (!orphanage) {
    return res.json({ success: true, data: [] });
  }

  const { data, error } = await supabase.from('volunteer_requests')
    .select('*, assignments:volunteer_assignments(*, volunteer:volunteers(*, profile:profiles(full_name, email)))')
    .eq('orphanage_id', orphanage.id)
    .order('created_at', { ascending: false });

  res.json({ success: !error, data, error: error?.message });
});

// ── Volunteer's assignments ─────────────────────────────────
router.get('/volunteer-assignments/my', auth, requireRole(['volunteer']), async (req, res) => {
  const user = (req as any).user;
  const { data: volunteer } = await supabase.from('volunteers').select('id').eq('profile_id', user.id).single();

  if (!volunteer) {
    return res.json({ success: true, data: [] });
  }

  const { data, error } = await supabase.from('volunteer_assignments')
    .select('*, request:volunteer_requests(*, orphanage:orphanages(name, city, state))')
    .eq('volunteer_id', volunteer.id)
    .order('created_at', { ascending: false });

  res.json({ success: !error, data, error: error?.message });
});

// ── Accept assignment ───────────────────────────────────────
router.put('/volunteer-assignments/:id/accept', auth, requireRole(['volunteer']), async (req, res) => {
  const user = (req as any).user;
  const { data: volunteer } = await supabase.from('volunteers').select('id').eq('profile_id', user.id).single();

  const { data, error } = await supabase.from('volunteer_assignments')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('volunteer_id', volunteer?.id)
    .select()
    .single();

  if (data) {
    await supabase.from('volunteer_requests')
      .update({ status: 'scheduled' })
      .eq('id', data.request_id);
  }

  res.json({ success: !error, data, error: error?.message });
});

// ── Decline assignment ──────────────────────────────────────
router.put('/volunteer-assignments/:id/decline', auth, requireRole(['volunteer']), async (req, res) => {
  const user = (req as any).user;
  const { data: volunteer } = await supabase.from('volunteers').select('id').eq('profile_id', user.id).single();

  const { data, error } = await supabase.from('volunteer_assignments')
    .update({ status: 'declined' })
    .eq('id', req.params.id)
    .eq('volunteer_id', volunteer?.id)
    .select()
    .single();

  res.json({ success: !error, data, error: error?.message });
});

// ── Complete assignment ─────────────────────────────────────
router.put('/volunteer-assignments/:id/complete', auth, requireRole(['volunteer']), async (req, res) => {
  const user = (req as any).user;
  const { data: volunteer } = await supabase.from('volunteers').select('id').eq('profile_id', user.id).single();

  const { data, error } = await supabase.from('volunteer_assignments')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('volunteer_id', volunteer?.id)
    .select()
    .single();

  if (data) {
    await supabase.from('volunteer_requests')
      .update({ status: 'completed' })
      .eq('id', data.request_id);
  }

  res.json({ success: !error, data, error: error?.message });
});

export default router;
