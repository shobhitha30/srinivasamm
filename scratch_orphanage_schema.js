import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('server/.env');
const envStr = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envStr.match(/SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_ROLE_KEY = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabaseAdmin.from('orphanages').select('*').limit(1);
  console.log('Columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data to infer columns');
  
  // Try to insert a row using service_role but exactly matching the payload
  // and see if there is an error
}
check();
