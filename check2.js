const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:8jcJEQ4CivEhQ4lG@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
  });
  
  try {
    await client.connect();
    console.log('Connected to Supabase Pooler port 5432');
    
    // Get triggers on exposants
    const res = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE event_object_table IN ('exposants', 'profiles');
    `);
    
    console.log('Triggers:', JSON.stringify(res.rows, null, 2));

  } catch (err) {
    console.error('Connection error', err.message);
  } finally {
    await client.end();
  }
}

run();
