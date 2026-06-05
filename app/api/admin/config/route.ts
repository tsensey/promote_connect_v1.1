import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import type { Json } from '@/types/database.types';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-config-get:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('platform_config')
    .select('*')
    .order('key');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-config-put:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
  }

  let body: { key: string; value: unknown };
  try {
    body = await request.json();
    if (!body.key) throw new Error('missing key');
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('platform_config')
    .update({ value: body.value as Json })
    .eq('key', body.key);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
