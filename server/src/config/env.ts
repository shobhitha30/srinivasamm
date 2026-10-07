import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3001,
  SUPABASE_URL: process.env.SUPABASE_URL as string,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET as string,
  RESEND_API_KEY: process.env.RESEND_API_KEY as string,
  ZEFFY_WEBHOOK_SECRET: process.env.ZEFFY_WEBHOOK_SECRET as string,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("🚨 CRITICAL ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables!");
  console.error("Please add them to your Vercel Project Settings > Environment Variables.");
}