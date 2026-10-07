import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Grab Anon Key
const frontendEnvPath = path.resolve('.env');
const frontendEnvStr = fs.readFileSync(frontendEnvPath, 'utf-8');
const SUPABASE_URL = frontendEnvStr.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = frontendEnvStr.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Grab Admin Key
const envPath = path.resolve('server/.env');
const envStr = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_SERVICE_ROLE_KEY = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);


async function check() {
  console.log('1. Trying to sign in as Ananya2 (if this fails, it means email is not confirmed or bad password)...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'ananya2@hopehaven.org',
    password: 'Password@123',
  });

  let userId;
  
  if (authErr) {
    console.log('SignIn Failed:', authErr.message);
    console.log('Attempting to create the user directly using Admin to bypass limits...');
    
    // Check if user exists
    const { data: profs } = await supabaseAdmin.from('profiles').select('*').eq('email', 'ananya2@hopehaven.org');
    if (profs && profs.length > 0) {
      userId = profs[0].id;
      console.log('User already exists, but login failed. Maybe password mismatch?');
    } else {
      const { data: newAuth, error: newAuthErr } = await supabaseAdmin.auth.admin.createUser({
        email: 'ananya2@hopehaven.org',
        password: 'Password@123',
        email_confirm: true,
        user_metadata: { full_name: 'Ananya', role: 'orphanage' }
      });
      if (newAuthErr) {
        console.error('Admin Create User Error:', newAuthErr.message);
        return;
      }
      userId = newAuth.user.id;
      console.log('Admin created user successfully.');
      
      // Ensure profile
      await supabaseAdmin.from('profiles').upsert({
        id: userId, full_name: 'Ananya', email: 'ananya2@hopehaven.org', role: 'orphanage'
      });
    }
    
    // Now try logging in again
    const { data: authData2, error: authErr2 } = await supabase.auth.signInWithPassword({
      email: 'ananya2@hopehaven.org',
      password: 'Password@123',
    });
    if (authErr2) {
      console.error('Still cannot login:', authErr2.message);
      return;
    }
    console.log('Successfully logged in after Admin creation.');
  } else {
    userId = authData.user.id;
    console.log('Successfully signed in as user.');
  }

  // ATTEMPT INSERT AS AUTHENTICATED USER
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
    profile_id: userId,
  };

  console.log('2. Inserting orphanage...');
  const { data: orphData, error: orphErr } = await supabase.from('orphanages').insert([orphanagePayload]).select();
  
  if (orphErr) {
    console.error('*** EXACT RLS OR INSERT ERROR ***:', orphErr);
    return;
  }
  
  console.log('Orphanage Insert Success!', orphData);
  // cleanup
  await supabaseAdmin.from('orphanages').delete().eq('id', orphData[0].id);
}
check();
