import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error: fetchError } = await supabase.from('profiles').select('id, access_level').limit(1);
  if (fetchError || !users || users.length === 0) {
    console.error('Error fetching users or no users found', fetchError);
    return;
  }
  
  const userId = users[0].id;
  const oldAccessLevel = users[0].access_level;
  
  console.log(`Updating profile ${userId}...`);
  const { error } = await supabase.from('profiles').update({ company: 'Test Company' }).eq('id', userId);
  
  if (error) {
    console.error('Error updating profile:', error);
  } else {
    console.log('Profile updated successfully.');
  }
}

run();
