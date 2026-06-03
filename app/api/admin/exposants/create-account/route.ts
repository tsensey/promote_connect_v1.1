import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin';
import { createAccountForExposant } from '@/lib/exposant-account';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`admin:create-account:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
  }

  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  let body: { exposant_id?: string; email1?: string | null; email2?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.exposant_id) {
    return NextResponse.json({ error: 'exposant_id requis' }, { status: 400 });
  }

  const result = await createAccountForExposant(
    body.exposant_id,
    body.email1 || null,
    body.email2 || null
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...result });
}
