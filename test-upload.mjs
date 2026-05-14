import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function test() {
  const { data, error } = await supabase.storage.from('feed-images').upload('test.txt', 'hello');
  console.log('Upload Result:', { data, error });
  
  if (error && error.message.includes('bucket not found')) {
      console.log("Bucket doesn't exist! Let's check buckets...");
      const { data: buckets } = await supabase.storage.listBuckets();
      console.log("Buckets:", buckets);
  }
}
test();
