const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(
    'https://iuylkwnmiheipwvvqbjn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWxrd25taWhlaXB3dnZxYmpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MjIwMCwiZXhwIjoyMDkzNTY4MjAwfQ.08vmncyvTa4GbXggScGlsomy40cFERJaawQvqD7qZww'
  );
  
  try {
    const { data: exposant, error: err1 } = await supabase.from('exposants').select('*').limit(1).single();
    if (err1) {
      console.error('Failed to fetch exposant:', err1);
      return;
    }
    
    console.log('Exposants columns:', Object.keys(exposant));

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
