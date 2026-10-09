import express from 'express';
import { env } from '../server/src/config/env.js';

const app = express();
app.get('/api/health', (req, res) => {
  res.json({ ok: true, step: 'env', SUPABASE_URL: !!env.SUPABASE_URL });
});

export default app;
