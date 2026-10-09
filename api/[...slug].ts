import express from 'express';
import dotenv from 'dotenv';

const app = express();
app.get('/api/health', (req, res) => {
  dotenv.config();
  res.json({ ok: true, step: 'dotenv', hasUrl: !!process.env.SUPABASE_URL });
});

export default app;
