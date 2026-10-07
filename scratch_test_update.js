import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('server/.env');
const envStr = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envStr.match(/SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_ROLE_KEY = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testUpdate() {
  const id = '79de964f-f65d-4c70-955f-7561ecd64b94';
  const { data, error } = await supabase.from('orphanages').update({
    verification_status: 'approved',
    rejection_reason: null,
    reviewed_by: 'admin-demo-id', // Or whatever user.id was
    reviewed_at: new Date().toISOString(),
  }).eq('id', id).select().single();
  
  console.log('Result:', { data, error });
}
testUpdate();
