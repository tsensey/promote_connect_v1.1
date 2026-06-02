import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimitResult = await rateLimit(`vitrine-list:${ip}`, 60, 60_000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const category = searchParams.get('category') || '';
  const typeFilter = searchParams.get('type') || 'all';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;

  const { data: produits, error } = await supabase
    .from('produits')
    .select('*, exposants!inner(id, nom, secteur, pays, pavillon, logo_url, is_featured, profiles!inner(subscription_tier))')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const filtered = (produits || []).filter((p: any) => {
    if (search && !p.nom?.toLowerCase().includes(search) && !p.description?.toLowerCase().includes(search) && !p.exposants?.nom?.toLowerCase().includes(search)) {
      return false;
    }
    if (category && p.categorie !== category) return false;
    if (typeFilter !== 'all' && (p.type ?? 'produit') !== typeFilter) return false;
    return true;
  });

  filtered.sort((a: any, b: any) => {
    const aTier = a.exposants?.profiles?.subscription_tier;
    const bTier = b.exposants?.profiles?.subscription_tier;
    const aPaid = aTier === 'paid';
    const bPaid = bTier === 'paid';
    const aFeatured = a.exposants?.is_featured;
    const bFeatured = b.exposants?.is_featured;

    const aScore = (aPaid && aFeatured ? 3 : 0) + (aPaid && !aFeatured ? 2 : 0) + (!aPaid ? 1 : 0);
    const bScore = (bPaid && bFeatured ? 3 : 0) + (bPaid && !bFeatured ? 2 : 0) + (!bPaid ? 1 : 0);

    if (aScore !== bScore) return bScore - aScore;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    data: paginated,
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
  });
}
