const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(
    'https://iuylkwnmiheipwvvqbjn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWxrd25taWhlaXB3dnZxYmpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MjIwMCwiZXhwIjoyMDkzNTY4MjAwfQ.08vmncyvTa4GbXggScGlsomy40cFERJaawQvqD7qZww'
  );
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, role');
      
    if (error) throw error;
    
    console.log(profiles.slice(0, 10));

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
