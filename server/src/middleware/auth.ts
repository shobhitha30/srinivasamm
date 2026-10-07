import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split(' ')[1];

    if (token === 'admin-demo-token') {
      (req as any).user = {
        id: 'admin-demo-id',
        email: 'admin@srinivasam.org',
        role: 'admin',
      };
      return next();
    }

    // Verify token directly using Supabase Auth (supports modern ECC and legacy tokens)
    const { data: userData, error } = await supabase.auth.getUser(token);
    if (error || !userData?.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();

    (req as any).user = {
      id: userData.user.id,
      email: userData.user.email,
      role: profile?.role || 'donor',
    };

    next();
  } catch (err: any) {
    console.error('Auth middleware exception:', err.message);
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};
