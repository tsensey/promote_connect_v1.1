/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const shouldClean =
  process.argv.includes('--clean') || process.env.CLEAN_DATABASE === 'true';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@promote-connect.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@2026!secure';
const ADMIN_NAME = 'Administrateur PROMOTE';

const CLEAN_TABLES = [
  'audit_logs',
  'notifications',
  'support_messages',
  'messages',
  'rendez_vous',
  'produits',
  'conversations',
  'newsletter_subscriptions',
  'newsletter_editions',
  'support_tickets',
  // 'subscriptions', -- table does not exist
  'exposants',
  'evenements',
  'profiles',
];

async function listAllUsers() {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users || [];
}

async function deleteAllRows(table) {
  const { error } = await supabase.from(table).delete().not('id', 'is', null);
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function cleanupDatabase() {
  console.log('Cleaning public tables...');
  for (const table of CLEAN_TABLES) {
    await deleteAllRows(table);
    console.log(`  cleared: ${table}`);
  }

  console.log('Cleaning auth users...');
  const users = await listAllUsers();
  for (const user of users) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
    console.log(`  deleted auth user: ${user.email || user.id}`);
  }
}

async function createAuthUserDirect(email, password, userMetadata) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Auth API error (${response.status}): ${body.msg || body.message || JSON.stringify(body)}`);
  }
  return body;
}

async function ensureAdmin() {
  const users = await listAllUsers();
  const existingUser = users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) || null;

  let userId;

  if (existingUser) {
    userId = existingUser.id;
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME, role: 'admin' },
    });
    if (error) throw error;
  } else {
    const authUser = await createAuthUserDirect(
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      { full_name: ADMIN_NAME, role: 'admin' }
    );
    userId = authUser.id;
  }

  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: ADMIN_NAME,
    company: 'PROMOTE-CONNECT',
    role: 'admin',
    country: 'Cameroun',
    subscription_tier: 'paid',
    subscription_status: 'active',
    subscription_ends_at: null,
  });
  if (error) throw error;

  return { id: userId, email: ADMIN_EMAIL };
}

async function seed() {
  console.log('========================================');
  console.log('  PROMOTE-CONNECT Seed (Production)');
  console.log('========================================');

  if (shouldClean) {
    await cleanupDatabase();
  }

  console.log('\nCreating admin account...');
  const admin = await ensureAdmin();

  console.log('');
  console.log('Admin credentials:');
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  User ID:  ${admin.id}`);
  console.log('========================================');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
