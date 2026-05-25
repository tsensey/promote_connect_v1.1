import dns from 'dns/promises';

async function run() {
  try {
    const records = await dns.resolve6('db.iuylkwnmiheipwvvqbjn.supabase.co');
    console.log('IPv6 records:', records);
  } catch (err) {
    console.error('IPv6 lookup failed:', err);
  }
}

run();
