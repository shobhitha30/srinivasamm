import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { orphanageSchema } from '../validators/orphanage';

const router = Router();

router.post('/register', auth, validate(orphanageSchema), async (req, res) => {
  const user = (req as any).user;
  const { data, error } = await supabase.from('orphanages').insert({
    ...req.body,
    profile_id: user.id,
    verification_status: 'pending'
  }).select().single();

  res.json({ success: !error, data, error });
});

router.get('/my', auth, async (req, res) => {
  const user = (req as any).user;
  const { data, error } = await supabase.from('orphanages').select('*').eq('profile_id', user.id).single();
  res.json({ success: !error, data, error });
});

// Public route: Get all approved orphanages.
// PRIVACY: Needs are intentionally excluded — only admin can see orphanage-specific needs.
router.get('/', async (req, res) => {
  const { limit = 50, city } = req.query;
  let query = supabase
    .from('orphanages')
    .select(`
      id, name, city, state, country, children_count, description, logo_url, website, verification_status, created_at,
      campaigns ( id, title, description, goal_amount, raised_amount, currency, status, image_url )
    `)
    .eq('verification_status', 'approved')
    .neq('name', 'Srinivasam Platform')
    .order('created_at', { ascending: false })
    .limit(Number(limit));
    
  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  const { data, error } = await query;
  res.json({ success: !error, data: data || [], error });
});

// Public route: Get single approved orphanage.
// PRIVACY: Needs are intentionally excluded — only admin can see orphanage-specific needs.
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('orphanages')
    .select(`
      *,
      campaigns ( id, title, description, goal_amount, raised_amount, currency, status, image_url, start_date, end_date )
    `)
    .eq('id', req.params.id)
    .eq('verification_status', 'approved')
    .single();

  res.json({ success: !error, data, error });
});

export default router;