const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(
    'https://iuylkwnmiheipwvvqbjn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWxrd25taWhlaXB3dnZxYmpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MjIwMCwiZXhwIjoyMDkzNTY4MjAwfQ.08vmncyvTa4GbXggScGlsomy40cFERJaawQvqD7qZww'
  );
  
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (error) throw error;
    console.log('Total profiles:', count);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
