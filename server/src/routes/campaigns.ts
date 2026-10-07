import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { campaignSchema } from '../validators/campaign';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('campaigns').select('*').in('status', ['approved', 'active']);
  res.json({ success: !error, data, error });
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('campaigns').select('*').eq('id', req.params.id).in('status', ['approved', 'active']).single();
  res.json({ success: !error, data, error });
});

router.post('/', auth, requireRole(['orphanage']), validate(campaignSchema), async (req, res) => {
  const user = (req as any).user;
  
  const { data: orphanage } = await supabase.from('orphanages').select('id').eq('profile_id', user.id).single();
  if (!orphanage) return res.status(404).json({ success: false, error: 'Orphanage not found' });

  const { data, error } = await supabase.from('campaigns').insert({
    ...req.body,
    orphanage_id: orphanage.id,
    status: 'pending'
  }).select().single();

  res.json({ success: !error, data, error });
});

export default router;