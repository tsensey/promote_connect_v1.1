import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `expo_${Date.now()}@example.com`;
  
  console.log(`Creating exposant ${email}...`);
  
  // Create user
  const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true,
      user_metadata: {
        full_name: 'Test Exposant',
        role: 'exposant',
        company: 'Test Company'
      }
  });

  if (authCreateError) {
    console.error('Error creating user:', authCreateError);
    return;
  }
  
  const userId = authData.user.id;
  console.log('User created:', userId);
  
  // Upsert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: 'Test Exposant',
      company: 'Test Company',
      role: 'exposant',
    });
    
  if (profileError) {
    console.error('Error upserting profile:', profileError);
    await supabase.auth.admin.deleteUser(userId);
    return;
  }
  console.log('Profile upserted.');
  
  // Insert exposant
  const exposantData = {
    nom: 'Test Company',
    profile_id: userId,
  };
  
  const { error: expError } = await supabase.from('exposants').insert(exposantData);
  if (expError) {
    console.error('Error inserting exposant:', expError);
  } else {
    console.log('Exposant inserted.');
  }

  await supabase.auth.admin.deleteUser(userId);
  console.log('User deleted.');
}

run();
