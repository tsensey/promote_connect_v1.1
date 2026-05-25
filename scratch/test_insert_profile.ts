import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const profileId = '22222222-2222-2222-2222-222222222222';
  
  console.log(`Inserting profile ${profileId}...`);
  const { error } = await supabase.from('profiles').insert({
    id: profileId,
    full_name: 'Test Profile',
    role: 'visiteur'
  });
  
  if (error) {
    console.error('Error inserting profile:', error);
  } else {
    console.log('Profile inserted successfully.');
    // Delete the test profile
    await supabase.from('profiles').delete().eq('id', profileId);
  }
}

run();
