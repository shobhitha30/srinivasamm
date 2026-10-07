const fs = require('fs');
const path = require('path');

const baseDir = '/home/anish/Downloads/Srinivasam/server/src';
const dirs = [
  'config',
  'lib',
  'middleware',
  'routes',
  'services',
  'validators'
];

dirs.forEach(dir => fs.mkdirSync(path.join(baseDir, dir), { recursive: true }));

const files = {
  'config/env.ts': `
import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3001,
  SUPABASE_URL: process.env.SUPABASE_URL as string,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET as string,
  RESEND_API_KEY: process.env.RESEND_API_KEY as string,
  ZEFFY_WEBHOOK_SECRET: process.env.ZEFFY_WEBHOOK_SECRET as string,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
`,
  'lib/supabase.ts': `
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
`,
  'middleware/auth.ts': `
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    
    // Validate JWT fallback
    const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET) as any;
    
    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();

    (req as any).user = {
      id: user.user.id,
      email: user.user.email,
      role: profile?.role || 'donor'
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};
`,
  'middleware/requireAdmin.ts': `
import { Request, Response, NextFunction } from 'express';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
  }
  next();
};
`,
  'middleware/requireRole.ts': `
import { Request, Response, NextFunction } from 'express';

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: Insufficient role' });
    }
    next();
  };
};
`,
  'middleware/validate.ts': `
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: error });
    }
  };
};
`,
  'services/auditService.ts': `
import { supabase } from '../lib/supabase';
import { v4 as uuid } from 'uuid';

export const logAudit = async (actor_id: string, action: string, entity_type: string, entity_id: string, details: any = {}) => {
  try {
    await supabase.from('audits').insert({
      id: uuid(),
      actor_id,
      action,
      entity_type,
      entity_id,
      details
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
};
`,
  'services/emailService.ts': `
import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

export const sendReceiptEmail = async (email: string, receiptData: any) => {
  try {
    await resend.emails.send({
      from: 'receipts@srinivasam.org',
      to: email,
      subject: 'Donation Receipt - Srinivasam',
      html: \`<p>Thank you for your donation of \${receiptData.amount} INR.</p><p>Receipt Number: \${receiptData.receipt_number}</p>\`
    });
    return true;
  } catch (error) {
    console.error('Failed to send email', error);
    return false;
  }
};
`,
  'services/matchingEngine.ts': `
export const matchVolunteers = (request: any, volunteers: any[]) => {
  const matches = volunteers.filter(v => v.status === 'available').map(v => {
    let score = 0;
    // Skills match
    const skillOverlap = request.required_skills?.filter((s: string) => v.skills?.includes(s)) || [];
    score += skillOverlap.length * 20;

    // Interest match
    const interestOverlap = request.required_interests?.filter((i: string) => v.interests?.includes(i)) || [];
    score += interestOverlap.length * 10;

    // Location match
    if (v.location?.toLowerCase() === request.location?.toLowerCase()) {
      score += 30;
    }

    return { ...v, match_score: score };
  });

  return matches.sort((a, b) => b.match_score - a.match_score);
};
`,
  'services/paymentService.ts': `
import { supabase } from '../lib/supabase';

export const verifyZeffyWebhook = async (payload: any) => {
  // Placeholder implementation for Zeffy webhook
  return true;
};
`,
  'services/receiptService.ts': `
import { supabase } from '../lib/supabase';
import { v4 as uuid } from 'uuid';

export const generateReceipt = async (donation: any) => {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const receipt_number = \`SRN-RCPT-\${date}-\${randomStr}\`;

  const { data, error } = await supabase.from('receipts').insert({
    id: uuid(),
    donation_id: donation.id,
    receipt_number,
    donor_name: donation.donor_name || 'Anonymous',
    donor_email: donation.donor_email,
    amount: donation.amount,
    currency: donation.currency,
    receipt_url: '',
    email_sent: false
  }).select().single();

  return data;
};
`,
  'validators/campaign.ts': `
import { z } from 'zod';

export const campaignSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  goal_amount: z.number().positive(),
  image_url: z.string().url().optional(),
  start_date: z.string(),
  end_date: z.string()
});
`,
  'validators/donation.ts': `
import { z } from 'zod';

export const donationSchema = z.object({
  campaign_id: z.string().uuid(),
  amount: z.number().positive(),
  donation_type: z.enum(['one_time', 'recurring']),
  is_anonymous: z.boolean().optional()
});
`,
  'validators/orphanage.ts': `
import { z } from 'zod';

export const orphanageSchema = z.object({
  name: z.string().min(1),
  registration_number: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  children_count: z.number().int().nonnegative(),
  description: z.string(),
  logo_url: z.string().url().optional(),
  website: z.string().url().optional()
});
`,
  'validators/volunteer.ts': `
import { z } from 'zod';

export const volunteerSchema = z.object({
  location: z.string(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  availability: z.string()
});
`,
  'routes/admin.ts': `
import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { logAudit } from '../services/auditService';
import { matchVolunteers } from '../services/matchingEngine';

const router = Router();

router.get('/overview', async (req, res) => {
  res.json({ success: true, data: { status: 'OK' } });
});

router.get('/orphanages', async (req, res) => {
  const { data, error } = await supabase.from('orphanages').select('*');
  res.json({ success: !error, data, error });
});

router.put('/orphanages/:id/review', async (req, res) => {
  const { status, rejection_reason } = req.body;
  const { id } = req.params;
  const user = (req as any).user;
  
  const { data, error } = await supabase.from('orphanages').update({
    verification_status: status,
    rejection_reason,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString()
  }).eq('id', id).select().single();
  
  if (data) await logAudit(user.id, 'review_orphanage', 'orphanages', id, { status });
  res.json({ success: !error, data, error });
});

router.get('/campaigns', async (req, res) => {
  const { data, error } = await supabase.from('campaigns').select('*');
  res.json({ success: !error, data, error });
});

router.put('/campaigns/:id/review', async (req, res) => {
  const { status, rejection_reason } = req.body;
  const { id } = req.params;
  const user = (req as any).user;
  
  const { data, error } = await supabase.from('campaigns').update({
    status,
    rejection_reason,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString()
  }).eq('id', id).select().single();
  
  if (data) await logAudit(user.id, 'review_campaign', 'campaigns', id, { status });
  res.json({ success: !error, data, error });
});

router.get('/needs', async (req, res) => {
  const { data, error } = await supabase.from('needs').select('*');
  res.json({ success: !error, data, error });
});

router.put('/needs/:id/review', async (req, res) => {
  const { status, rejection_reason } = req.body;
  const { id } = req.params;
  const user = (req as any).user;
  
  const { data, error } = await supabase.from('needs').update({
    status,
    rejection_reason,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString()
  }).eq('id', id).select().single();
  
  if (data) await logAudit(user.id, 'review_need', 'needs', id, { status });
  res.json({ success: !error, data, error });
});

router.get('/volunteers', async (req, res) => {
  const { data, error } = await supabase.from('volunteers').select('*');
  res.json({ success: !error, data, error });
});

router.put('/volunteers/:id/review', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const user = (req as any).user;
  
  const { data, error } = await supabase.from('volunteers').update({
    status,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString()
  }).eq('id', id).select().single();
  
  if (data) await logAudit(user.id, 'review_volunteer', 'volunteers', id, { status });
  res.json({ success: !error, data, error });
});

router.get('/volunteer-requests', async (req, res) => {
  const { data, error } = await supabase.from('volunteer_requests').select('*');
  res.json({ success: !error, data, error });
});

router.put('/volunteer-requests/:id/review', async (req, res) => {
  const { status, rejection_reason } = req.body;
  const { id } = req.params;
  const user = (req as any).user;
  
  const { data, error } = await supabase.from('volunteer_requests').update({
    status,
    rejection_reason,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString()
  }).eq('id', id).select().single();
  
  if (data) await logAudit(user.id, 'review_volunteer_request', 'volunteer_requests', id, { status });
  res.json({ success: !error, data, error });
});

router.post('/volunteer-requests/:id/match', async (req, res) => {
  const { id } = req.params;
  const { data: request } = await supabase.from('volunteer_requests').select('*').eq('id', id).single();
  if (!request) return res.status(404).json({ success: false, error: 'Request not found' });

  const { data: volunteers } = await supabase.from('volunteers').select('*');
  
  const matches = matchVolunteers(request, volunteers || []);
  res.json({ success: true, data: matches });
});

router.get('/donations', async (req, res) => {
  const { data, error } = await supabase.from('donations').select('*');
  res.json({ success: !error, data, error });
});

router.get('/payments', async (req, res) => {
  const { data, error } = await supabase.from('payments').select('*');
  res.json({ success: !error, data, error });
});

router.get('/receipts', async (req, res) => {
  const { data, error } = await supabase.from('receipts').select('*');
  res.json({ success: !error, data, error });
});

router.get('/audits', async (req, res) => {
  const { data, error } = await supabase.from('audits').select('*');
  res.json({ success: !error, data, error });
});

export default router;
`,
  'routes/campaigns.ts': `
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
`,
  'routes/donations.ts': `
import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { donationSchema } from '../validators/donation';

const router = Router();

router.post('/', validate(donationSchema), async (req, res) => {
  const user = (req as any).user; // optional
  const { data, error } = await supabase.from('donations').insert({
    ...req.body,
    donor_id: user?.id || null,
    status: 'pending'
  }).select().single();

  res.json({ success: !error, data, error });
});

router.post('/webhook', async (req, res) => {
  // zeffy webhook implementation
  res.json({ success: true });
});

router.get('/my', auth, async (req, res) => {
  const user = (req as any).user;
  const { data, error } = await supabase.from('donations').select('*').eq('donor_id', user.id);
  res.json({ success: !error, data, error });
});

export default router;
`,
  'routes/needs.ts': `
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
    orphanage_id: orphanage?.id,
    status: 'pending'
  }).select().single();

  res.json({ success: !error, data, error });
});

router.get('/my', auth, requireRole(['orphanage']), async (req, res) => {
  const user = (req as any).user;
  const { data: orphanage } = await supabase.from('orphanages').select('id').eq('profile_id', user.id).single();
  
  const { data, error } = await supabase.from('needs').select('*').eq('orphanage_id', orphanage?.id);
  res.json({ success: !error, data, error });
});

export default router;
`,
  'routes/orphanages.ts': `
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

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('orphanages').select('*').eq('id', req.params.id).eq('verification_status', 'approved').single();
  res.json({ success: !error, data, error });
});

export default router;
`,
  'routes/receipts.ts': `
import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/my', auth, async (req, res) => {
  const user = (req as any).user;
  const { data: donations } = await supabase.from('donations').select('id').eq('donor_id', user.id);
  const donationIds = donations?.map(d => d.id) || [];
  
  const { data, error } = await supabase.from('receipts').select('*').in('donation_id', donationIds);
  res.json({ success: !error, data, error });
});

router.get('/:id/download', auth, async (req, res) => {
  res.json({ success: true, data: { url: 'mock_url_for_download' } });
});

export default router;
`,
  'routes/volunteers.ts': `
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
`,
  'routes/matching.ts': `
import { Router } from 'express';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { supabase } from '../lib/supabase';

const router = Router();

router.post('/requests', auth, requireRole(['orphanage']), async (req, res) => {
  const user = (req as any).user;
  const { data: orphanage } = await supabase.from('orphanages').select('id').eq('profile_id', user.id).single();
  
  const { data, error } = await supabase.from('volunteer_requests').insert({
    ...req.body,
    orphanage_id: orphanage?.id,
    status: 'pending'
  }).select().single();

  res.json({ success: !error, data, error });
});

router.get('/requests/my', auth, requireRole(['orphanage']), async (req, res) => {
  const user = (req as any).user;
  const { data: orphanage } = await supabase.from('orphanages').select('id').eq('profile_id', user.id).single();
  
  const { data, error } = await supabase.from('volunteer_requests').select('*').eq('orphanage_id', orphanage?.id);
  res.json({ success: !error, data, error });
});

router.get('/assignments/my', auth, requireRole(['volunteer']), async (req, res) => {
  const user = (req as any).user;
  const { data: volunteer } = await supabase.from('volunteers').select('id').eq('profile_id', user.id).single();
  
  const { data, error } = await supabase.from('volunteer_assignments').select('*').eq('volunteer_id', volunteer?.id);
  res.json({ success: !error, data, error });
});

router.put('/assignments/:id/accept', auth, requireRole(['volunteer']), async (req, res) => {
  const { data, error } = await supabase.from('volunteer_assignments').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
  res.json({ success: !error, data, error });
});

router.put('/assignments/:id/decline', auth, requireRole(['volunteer']), async (req, res) => {
  const { data, error } = await supabase.from('volunteer_assignments').update({ status: 'declined' }).eq('id', req.params.id).select().single();
  res.json({ success: !error, data, error });
});

router.put('/assignments/:id/complete', auth, requireRole(['volunteer']), async (req, res) => {
  const { data, error } = await supabase.from('volunteer_assignments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
  res.json({ success: !error, data, error });
});

export default router;
`,
  'index.ts': `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { env } from './config/env';

import adminRoutes from './routes/admin';
import campaignsRoutes from './routes/campaigns';
import donationsRoutes from './routes/donations';
import needsRoutes from './routes/needs';
import orphanagesRoutes from './routes/orphanages';
import receiptsRoutes from './routes/receipts';
import volunteersRoutes from './routes/volunteers';
import matchingRoutes from './routes/matching';
import { auth } from './middleware/auth';
import { requireAdmin } from './middleware/requireAdmin';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/admin', auth, requireAdmin, adminRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/needs', needsRoutes);
app.use('/api/orphanages', orphanagesRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/volunteer', matchingRoutes);

const PORT = env.PORT || 3001;

app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
`
};

for (const [file, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(baseDir, file), content.trim());
}
console.log('All files generated successfully.');
