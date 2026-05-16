import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');

const envContent = readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n').filter(Boolean);
const envVars = {};
for (const line of envLines) {
  const [key, ...rest] = line.split('=');
  if (key && !key.startsWith('#')) {
    envVars[key.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE env vars in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function generatePassword() {
  return randomBytes(9).toString('base64url').slice(0, 12);
}

const email = process.argv[2];
const fullName = process.argv[3] || 'Super Admin';

if (!email) {
  console.error('Usage: node scripts/create-admin.mjs <email> [full_name]');
  process.exit(1);
}

const password = generatePassword();
console.log(`Creating admin: ${email} (${fullName})`);

const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, role: 'admin' },
});

if (authError) {
  console.error('Error creating auth user:', authError.message);
  process.exit(1);
}

const userId = authData.user.id;

const { error: profileError } = await supabase.from('profiles').upsert({
  id: userId,
  full_name: fullName,
  role: 'admin',
});

if (profileError) {
  await supabase.auth.admin.deleteUser(userId);
  console.error('Error creating profile:', profileError.message);
  process.exit(1);
}

console.log('\nAdmin account created successfully!');
console.log('Email:', email);
console.log('Password:', password);
console.log('User ID:', userId);
