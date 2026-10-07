import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const payload = {
    title: 'Test',
    description: 'Test',
    goal_amount: 100,
    raised_amount: 0,
    currency: 'USD',
    status: 'active',
    image_url: null,
    end_date: null,
    orphanage_id: null,
    zeffy_url: 'https://zeffy.com/test'
  };

  const { data, error } = await supabase.from('campaigns').insert([payload]).select().single();
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success:', data);
  }
}
test();
