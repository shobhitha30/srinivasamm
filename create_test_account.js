import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read service role key to bypass rate limits
const envPath = path.resolve('server/.env');
const envStr = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envStr.match(/SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_ROLE_KEY = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createTestAccount() {
  const email = 'test-org@srinivasam.org';
  const password = 'Password@123';
  const fullName = 'Test Organization';

  console.log(`Creating user: ${email}...`);
  
  // 1. Create Auth User
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'orphanage' }
  });

  if (authErr) {
    if (authErr.message.includes('already exists')) {
      console.log('User already exists. Attempting to fetch their ID...');
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === email);
      if (existingUser) {
        await ensureProfile(existingUser.id, email, fullName);
      }
    } else {
      console.error('Error creating user:', authErr.message);
    }
    return;
  }

  const userId = authData.user.id;
  console.log('User created successfully:', userId);

  // 2. Ensure Profile exists
  await ensureProfile(userId, email, fullName);
}

async function ensureProfile(userId, email, fullName) {
  const profileData = {
    id: userId,
    email: email,
    full_name: fullName,
    role: 'orphanage',
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin.from('profiles').upsert(profileData);
  if (error) {
    console.error('Error creating profile:', error.message);
  } else {
    console.log('Profile created successfully for:', email);
  }
}

createTestAccount();
