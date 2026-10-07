import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('server/.env');
const envStr = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envStr.match(/SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_ROLE_KEY = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabaseAdmin.from('profiles').select('*').eq('email', 'test-org@srinivasam.org');
  console.log('Profile for test-org:', data);
  
  // Try to bypass the trigger if it blocks role updates
  // Actually, wait, if the trigger blocks role updates, we can just disable the trigger or tell the user.
}
check();
