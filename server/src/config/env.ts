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