import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { volunteerSchema } from '../validators/volunteer';

const router = Router();

router.post('/register', auth, validate(volunteerSchema), async (req, res) => {
  const user = (req as any).user;
  const { data, error } = await supabase.from('volunteers').insert({
    ...req.body,
    profile_id: user.id,
    status: 'pending'
  }).select().single();

  res.json({ success: !error, data, error });
});

router.get('/my', auth, async (req, res) => {
  const user = (req as any).user;
  const { data, error } = await supabase.from('volunteers').select('*').eq('profile_id', user.id).single();
  res.json({ success: !error, data, error });
});

router.put('/my', auth, validate(volunteerSchema), async (req, res) => {
  const user = (req as any).user;
  const { data, error } = await supabase.from('volunteers').update(req.body).eq('profile_id', user.id).select().single();
  res.json({ success: !error, data, error });
});

export default router;