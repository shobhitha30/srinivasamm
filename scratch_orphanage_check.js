import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envStr = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = envStr.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = envStr.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  console.log('1. Attempting to Sign Up...');
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: 'ananya@hopehaven.org',
    password: 'Password@123',
    options: {
      data: {
        full_name: 'Ananya',
        role: 'orphanage',
      }
    }
  });

  if (authErr) {
    console.error('Signup Error:', authErr.message);
    return;
  }
  
  console.log('Signup Success! User ID:', authData.user?.id);

  // 2. Ensure Profile (the frontend does this next)
  const profileData = {
    id: authData.user.id,
    full_name: 'Ananya',
    email: 'ananya@hopehaven.org',
    role: 'orphanage'
  };
  
  console.log('2. Attempting to ensure profile...');
  const { data: profData, error: profErr } = await supabase.from('profiles').upsert(profileData).select().maybeSingle();
  
  if (profErr) {
    console.error('Profile Upsert Error:', profErr.message);
    return;
  }
  console.log('Profile Upsert Success!');

  // 3. Register Orphanage
  const orphanagePayload = {
    name: 'Hope Haven Children\'s Home',
    registration_number: 'REG-2026-HYD-9981',
    email: 'ananya@hopehaven.org',
    phone: '9876543210',
    city: 'Hyderabad',
    state: '',
    country: 'India',
    children_count: 50,
    description: 'Contact: Ananya. Registered non-profit children home in Hyderabad.',
    verification_status: 'pending',
    profile_id: authData.user.id,
  };

  console.log('3. Attempting to register orphanage...');
  const { data: orphData, error: orphErr } = await supabase.from('orphanages').insert([orphanagePayload]).select();
  
  if (orphErr) {
    console.error('Orphanage Insert Error:', orphErr.message);
    return;
  }
  
  console.log('Orphanage Insert Success!');
}
check();
