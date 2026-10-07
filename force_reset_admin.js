import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('server/.env');
const envStr = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envStr.match(/SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_ROLE_KEY = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function forceResetPassword() {
  const email = 'anishjrall@gmail.com';
  const newPassword = 'Admin@123';

  console.log(`Finding user ${email}...`);
  const { data: users, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listErr) {
    console.error('Error listing users:', listErr.message);
    return;
  }

  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.log(`User ${email} not found.`);
    return;
  }

  console.log(`Forcing password reset for ${user.id}...`);
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (error) {
    console.error('Failed to update password:', error.message);
  } else {
    console.log(`SUCCESS! Password for ${email} has been forcefully changed to: ${newPassword}`);
  }
}
forceResetPassword();
