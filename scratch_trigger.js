import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env
const envPath = path.resolve('server/.env');
const envStr = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envStr.match(/SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_ROLE_KEY = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('is_admin'); // Just a test
  
  // Actually, we can query pg_proc directly using a raw query if we have postgres access, but we don't.
  // We can query information_schema.routines
  const { data: routines, error: rErr } = await supabase
    .from('information_schema.routines')
    .select('routine_name, routine_definition')
    .eq('routine_schema', 'public')
    .ilike('routine_name', '%user%');

  console.log('Routines:', routines);
}
check();
