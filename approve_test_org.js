import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('server/.env');
const envStr = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envStr.match(/SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_ROLE_KEY = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function forceApprove() {
  console.log('Finding pending orphanage for test-org...');
  
  // Update the orphanage verification status
  const { data: orphData, error: orphErr } = await supabaseAdmin
    .from('orphanages')
    .update({ verification_status: 'approved' })
    .eq('email', 'test-org@srinivasam.org')
    .select();

  if (orphErr) {
    console.error('Failed to approve orphanage:', orphErr.message);
  } else {
    console.log('Successfully approved orphanage:', orphData);
  }
}
forceApprove();
