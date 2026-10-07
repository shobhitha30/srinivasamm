import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const frontendEnvPath = path.resolve('.env');
const frontendEnvStr = fs.readFileSync(frontendEnvPath, 'utf-8');
const SUPABASE_URL = frontendEnvStr.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = frontendEnvStr.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  console.log('1. Signing in...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'ananya2@hopehaven.org',
    password: 'Password@123',
  });

  if (authErr) {
    console.error('SignIn Error:', authErr.message);
    return;
  }
  
  console.log('SignIn Success! User ID:', authData.user.id);

  const orphanagePayload = {
    name: 'Hope Haven Children\'s Home 2',
    registration_number: 'REG-2026-HYD-9982',
    email: 'ananya2@hopehaven.org',
    phone: '9876543210',
    city: 'Hyderabad',
    state: '',
    country: 'India',
    children_count: 50,
    description: 'Contact: Ananya. Registered non-profit children home in Hyderabad.',
    verification_status: 'pending',
    profile_id: authData.user.id,
    created_at: new Date().toISOString()
  };

  console.log('2. Attempting to register orphanage as authenticated user...');
  const { data: orphData, error: orphErr } = await supabase.from('orphanages').insert([orphanagePayload]).select();
  
  if (orphErr) {
    console.error('Orphanage Insert Error:', orphErr.message, orphErr);
    return;
  }
  
  console.log('Orphanage Insert Success!', orphData);
}
check();
