const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(
    'https://iuylkwnmiheipwvvqbjn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWxrd25taWhlaXB3dnZxYmpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MjIwMCwiZXhwIjoyMDkzNTY4MjAwfQ.08vmncyvTa4GbXggScGlsomy40cFERJaawQvqD7qZww'
  );
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('role, is_active, subscription_tier')
      .limit(100);
      
    if (error) throw error;
    
    const roleCounts = profiles.reduce((acc, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});
    console.log('Role counts:', roleCounts);

    const visiteurCount = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'visiteur');
      
    console.log('Total visiteurs:', visiteurCount.count);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
