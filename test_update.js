const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(
    'https://iuylkwnmiheipwvvqbjn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWxrd25taWhlaXB3dnZxYmpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MjIwMCwiZXhwIjoyMDkzNTY4MjAwfQ.08vmncyvTa4GbXggScGlsomy40cFERJaawQvqD7qZww'
  );
  
  try {
    // 1. Get an exposant
    const { data: exposant, error: err1 } = await supabase.from('exposants').select('*').limit(1).single();
    if (err1) {
      console.error('Failed to fetch exposant:', err1);
      return;
    }
    
    console.log('Got exposant:', exposant.id, 'profile_id:', exposant.profile_id);

    // 2. Try to update exposants
    const { error: err2 } = await supabase.from('exposants').update({ description: 'Test description ' + Date.now() }).eq('id', exposant.id);
    console.log('Update exposants result:', err2 || 'Success');

    // 3. Try to update profiles
    if (exposant.profile_id) {
      const { error: err3 } = await supabase.from('profiles').update({ full_name: 'Test Name ' + Date.now() }).eq('id', exposant.profile_id);
      console.log('Update profiles result:', err3 || 'Success');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
