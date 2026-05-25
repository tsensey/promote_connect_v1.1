import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const profileId = '550e8400-e29b-41d4-a716-446655440001';
  
  console.log(`Inserting preference for ${profileId}...`);
  const { error } = await supabase.from('user_preferences').insert({ profile_id: profileId });
  
  if (error) {
    console.error('Error inserting preference:', error);
  } else {
    console.log('Preference inserted successfully.');
  }
}

run();
