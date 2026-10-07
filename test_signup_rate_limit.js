import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const frontendEnvPath = path.resolve('.env');
const frontendEnvStr = fs.readFileSync(frontendEnvPath, 'utf-8');
const SUPABASE_URL = frontendEnvStr.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = frontendEnvStr.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const randomEmail = `test-org-${Math.floor(Math.random() * 100000)}@test.com`;
  console.log(`Trying to sign up with ${randomEmail}...`);
  const { data, error } = await supabase.auth.signUp({
    email: randomEmail,
    password: 'Password@123',
    options: { data: { full_name: 'Test Org', role: 'orphanage' } }
  });
  
  if (error) {
    console.error('Failed!', error.message);
  } else {
    console.log('Success! Email signup is NOT blocked for new emails.');
  }
}
test();
