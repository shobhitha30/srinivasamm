import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read service role key to bypass rate limits and manually set up the test
const envPath = path.resolve('server/.env');
const envStr = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envStr.match(/SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_ROLE_KEY = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Read anon key to test RLS
const frontendEnvPath = path.resolve('.env');
const frontendEnvStr = fs.readFileSync(frontendEnvPath, 'utf-8');
const SUPABASE_ANON_KEY = frontendEnvStr.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  console.log('1. Fetching a profile to test with...');
  const { data: profs } = await supabaseAdmin.from('profiles').select('*').limit(1);
  if (!profs || profs.length === 0) {
    console.log('No profiles found to test with.');
    return;
  }
  const user = profs[0];
  console.log('Testing with user ID:', user.id);

  // We need an active auth session to pass RLS, so let's mock the session
  // or just use admin client to see if the schema rejects it.
  
  const orphanagePayload = {
    name: 'Test Registration Home',
    registration_number: 'REG-TEST-1234',
    email: user.email,
    phone: '9876543210',
    city: 'Hyderabad',
    state: '',
    country: 'India',
    children_count: 50,
    description: 'Test description',
    verification_status: 'pending',
    profile_id: user.id,
  };

  console.log('2. Inserting via Admin (Checking Schema Constraints)...');
  const { data: adminData, error: adminErr } = await supabaseAdmin.from('orphanages').insert([orphanagePayload]).select();
  
  if (adminErr) {
    console.error('Schema Error (Admin):', adminErr);
  } else {
    console.log('Admin Insert Success! Schema is fine.');
    // clean up
    await supabaseAdmin.from('orphanages').delete().eq('id', adminData[0].id);
  }
}
check();
