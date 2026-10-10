import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.post('/', auth, requireRole(['orphanage']), async (req, res) => {
  const user = (req as any).user;
  const { data: orphanage } = await supabase.from('orphanages').select('id').eq('profile_id', user.id).single();
  
  const { data, error } = await supabase.from('needs').insert({
    ...req.body,
    orphanage_id: orphanage?.id || req.body.orphanage_id,
    status: 'pending'
  }).select().single();

  res.json({ success: !error, data, error: error?.message });
});

router.get('/my', auth, requireRole(['orphanage']), async (req, res) => {
  const user = (req as any).user;
  const { data: orphanage } = await supabase.from('orphanages').select('id').eq('profile_id', user.id).single();
  
  const { data, error } = await supabase.from('needs').select('*').eq('orphanage_id', orphanage?.id);
  res.json({ success: !error, data, error });
});

export default router;