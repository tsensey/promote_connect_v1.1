import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { checkVitrineQuota } from '@/lib/subscription';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { quotaErrorResponse } from '@/lib/quota-messages';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimitResult = await rateLimit(`vitrine-offers-create:${ip}`, 30, 60_000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let name: string;
  let description: string;
  let prixIndicatif: string | null = null;
  let categorie: string | null = null;
  let imageUrl: string | null = null;

  try {
    const body = await request.json() as Record<string, unknown>;
    name = String(body.name ?? '').trim();
    description = String(body.description ?? '').trim();
    if (!name || !description) throw new Error('missing fields');
    if (body.prixIndicatif) prixIndicatif = String(body.prixIndicatif);
    if (body.categorie) categorie = String(body.categorie);
    if (body.imageUrl) imageUrl = String(body.imageUrl);
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  }

  const { data: exposant } = await supabase
    .from('exposants')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!exposant) {
    return NextResponse.json({ error: 'exposant_not_found' }, { status: 404 });
  }

  const quotaResult = await checkVitrineQuota(exposant.id, user.id);
  if (!quotaResult.allowed) {
    return NextResponse.json({
      allowed: false,
      ...quotaErrorResponse('vitrine_quota_exceeded', {
        currentCount: quotaResult.currentCount,
        limit: quotaResult.limit,
      }),
    }, { status: 403 });
  }

  const { data: newOffer, error: insertError } = await supabase
    .from('produits')
    .insert({
      exposant_id: exposant.id,
      nom: name,
      description,
      prix_indicatif: prixIndicatif,
      categorie,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data: newOffer });
}
