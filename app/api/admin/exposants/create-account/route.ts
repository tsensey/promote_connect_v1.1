import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin';
import { createAccountForExposant } from '@/lib/exposant-account';

export async function POST(request: Request) {
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
