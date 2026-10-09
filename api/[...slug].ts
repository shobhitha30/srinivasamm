import express from 'express';
import { env } from '../server/src/config/env';

const app = express();
app.get('/api/health', (req, res) => {
  res.json({ ok: true, step: 'env', hasUrl: !!env.SUPABASE_URL, hasKey: !!env.SUPABASE_SERVICE_ROLE_KEY });
});

export default app;
