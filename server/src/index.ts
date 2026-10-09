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
import authRoutes from './routes/auth';
import { auth } from './middleware/auth';
import { requireAdmin } from './middleware/requireAdmin';

const app = express();

const corsOrigin = env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN;
app.use(cors({ origin: corsOrigin, credentials: corsOrigin !== '*' }));
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.set('etag', false); // Disable ETag generation to prevent 304 responses

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    env: {
      SUPABASE_URL: !!env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_JWT_SECRET: !!env.SUPABASE_JWT_SECRET,
    },
  })
);

// Prevent caching for API routes
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

app.use('/api/admin', auth, requireAdmin, adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/needs', needsRoutes);
app.use('/api/orphanages', orphanagesRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api', matchingRoutes);

const PORT = env.PORT || 3001;

// Only listen when running as a standalone server (never on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
