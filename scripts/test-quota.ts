import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Fetch a user who has 'PAID' or 'paid' tier
  const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  
  const paidProfiles = profiles.filter(p => p.subscription_tier?.toLowerCase() === 'paid');
  console.log(`Found ${paidProfiles.length} paid profiles out of ${profiles.length}`);
  
  if (paidProfiles.length > 0) {
    const p = paidProfiles[0];
    console.log('Sample PAID profile ID:', p.id, 'Role:', p.role, 'Tier:', p.subscription_tier);
    
    // Now simulate checkPostQuota
    const { data: rawProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, subscription_tier, quota_override_posts')
      .eq('id', p.id)
      .single();
      
    console.log('rawProfile from query:', rawProfile, 'error:', profileError);
  } else {
    console.log('No paid profiles found. Here is a free trial profile:', profiles[0]);
  }
}

run();
