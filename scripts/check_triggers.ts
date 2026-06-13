import { Client } from 'pg';

const connectionString = "postgresql://postgres:8jcJEQ4CivEhQ4lG@db.iuylkwnmiheipwvvqbjn.supabase.co:5432/postgres";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  const res = await client.query(`
    SELECT event_object_table, trigger_name, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'exposants';
  `);
  
  console.log("Triggers on exposants:");
  console.log(res.rows);

  const res2 = await client.query(`
    SELECT event_object_table, trigger_name, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'profiles';
  `);
  
  console.log("Triggers on profiles:");
  console.log(res2.rows);

  await client.end();
}

main().catch(console.error);
