import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let latency = 0;

  try {
    const supabase = createAdminClient();
    
    // Test simple pour vérifier si la base de données répond
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (!error && data) {
      dbStatus = 'connected';
    } else {
      dbStatus = `error: ${error?.message || 'unknown'}`;
    }
  } catch (error) {
    dbStatus = `failed: ${error instanceof Error ? error.message : 'Unknown exception'}`;
  }

  latency = Date.now() - startTime;

  const isHealthy = dbStatus === 'connected';

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      db: dbStatus,
      latency_ms: latency,
      timestamp: new Date().toISOString(),
    },
    { status: isHealthy ? 200 : 503 }
  );
}
