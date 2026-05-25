import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName: string) {
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.error(`Error querying ${tableName}:`, error.message);
  } else {
    console.log(`Table ${tableName} exists.`);
    if (data.length > 0) {
      console.log(`Columns in ${tableName}:`, Object.keys(data[0]));
    }
  }
}

async function run() {
  await checkTable('profiles');
  await checkTable('user_preferences');
  await checkTable('audit_logs');
  await checkTable('exposants');
  await checkTable('produits');
}

run();
