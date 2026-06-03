import postgres from 'postgres';
import crypto from 'crypto';

const sql = postgres('postgres://postgres:8jcJEQ4CivEhQ4lG@db.iuylkwnmiheipwvvqbjn.supabase.co:5432/postgres', { ssl: 'require' });

async function run() {
  try {
    const email = `test_${Date.now()}@example.com`;
    const userId = crypto.randomUUID();
    console.log(`Inserting user ${userId}...`);
    
    await sql`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', ${userId}, 'authenticated', 'authenticated', ${email}, 'password', now(), '{"provider":"email","providers":["email"]}',         '{"full_name": "Test", "role": "visiteur", "subscription_tier": "free_trial"}', now(), now(), '', '', '', ''
      )
    `;
    console.log('Success');
    await sql`DELETE FROM auth.users WHERE id = ${userId}`;
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}
run();
