const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.iuylkwnmiheipwvvqbjn:8jcJEQ4CivEhQ4lG@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'
  });
  
  try {
    await client.connect();
    console.log('Connected to Supabase Pooler');
    
    // Get triggers on exposants
    const res = await client.query(`
      SELECT event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE event_object_table IN ('exposants', 'profiles')
      ORDER BY event_object_table, event_manipulation;
    `);
    
    console.log('Triggers:', JSON.stringify(res.rows, null, 2));

    // Also get the trigger functions
    const res2 = await client.query(`
      SELECT routine_name, routine_definition
      FROM information_schema.routines
      WHERE routine_name IN ('check_sensitive_fields_update', 'check_access_level_update')
      AND specific_schema = 'public';
    `);

    console.log('Functions:', JSON.stringify(res2.rows, null, 2));

  } catch (err) {
    console.error('Connection error', err.stack);
  } finally {
    await client.end();
  }
}

run();
