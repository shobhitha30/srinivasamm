import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Use placeholders when env is missing so module load never crashes the serverless function.
// Actual DB calls will fail with a clear Supabase error instead of FUNCTION_INVOCATION_FAILED.
const url = env.SUPABASE_URL || 'https://placeholder.supabase.co';
const key = env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
