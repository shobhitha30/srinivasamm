import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('server/.env');
const envStr = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envStr.match(/SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_ROLE_KEY = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('Checking recent profiles...');
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log(data);
}
check();
