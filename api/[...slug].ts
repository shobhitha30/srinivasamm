import express from 'express';

const app = express();
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ ok: true, mode: 'inline' }));

export default app;
