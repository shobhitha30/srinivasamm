const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('server/.env', 'utf8');
const url = env.match(/SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const s = createClient(url, key);

(async () => {
  const { error } = await s.rpc('exec_sql', { sql: `create policy "needs_select_public" on public.needs for select to public using (status = 'approved');` });
  if (error) {
    if (error.message.includes('Could not find the function')) {
      console.log('exec_sql function does not exist.');
    } else {
      console.error(error);
    }
  } else {
    console.log('Policy created');
  }
})();
