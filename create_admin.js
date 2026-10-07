import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('server/.env');
const envStr = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envStr.match(/SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_ROLE_KEY = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createAdmin() {
  const email = 'admin-test@srinivasam.org';
  const password = 'Admin@123';
  const fullName = 'Platform Administrator';

  console.log(`Creating admin: ${email}...`);
  
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'admin' }
  });

  let userId;
  if (authErr) {
    if (authErr.message.includes('already exists')) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      userId = users.users.find(u => u.email === email)?.id;
      // Also update their password to make sure it's Admin@123
      await supabaseAdmin.auth.admin.updateUserById(userId, { password: 'Admin@123' });
    } else {
      console.error('Error:', authErr.message);
      return;
    }
  } else {
    userId = authData.user.id;
  }

  // Force role to admin using raw DB upsert
  const profileData = {
    id: userId,
    email: email,
    full_name: fullName,
    role: 'admin',
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin.from('profiles').upsert(profileData);
  if (error) {
    // If trigger blocks it, we might need a workaround, but wait, the default might be donor.
    // If it's donor, we can manually change it via SQL, or just tell the user to change the role of anishjrall@gmail.com in the dashboard!
    console.error('Profile error:', error.message);
  } else {
    console.log('Admin created successfully.');
  }
}
createAdmin();
