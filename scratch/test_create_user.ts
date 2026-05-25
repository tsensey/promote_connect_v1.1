import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `test_${Date.now()}@example.com`;
  console.log(`Creating user ${email}...`);
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Test User',
      role: 'visiteur',
      access_level: 'classic'
    }
  });

  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('User created:', data.user.id);
    await supabase.auth.admin.deleteUser(data.user.id);
    console.log('User deleted.');
  }
}

run();
