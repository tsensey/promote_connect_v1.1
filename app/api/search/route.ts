import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import type { Database } from '@/types/database.types';
import type { SearchEntity, SearchResponse, SearchResult } from '@/types/search';

const VALID_TYPES: SearchEntity[] = ['exposant', 'produit', 'evenement', 'post', 'espace'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const typesParam = searchParams.get('types');
    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const types: SearchEntity[] = typesParam
      ? typesParam.split(',').filter((t): t is SearchEntity => VALID_TYPES.includes(t as SearchEntity))
      : VALID_TYPES;

    if (types.length === 0) {
      return NextResponse.json(
        { error: 'No valid entity types specified' },
        { status: 400 },
      );
    }

    // Rate limiting
    const ip = getClientIp(request);
    const { allowed } = await rateLimit(`search:${ip}`, 60, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 },
      );
    }

    // Verify auth session via request cookies
    const sb = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      },
    );

    const { data: { session }, error: sessionError } = await sb.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const adminClient = createAdminClient();

    if (q.length === 0) {
      return NextResponse.json({
        results: [],
        total: 0,
        facets: { types: Object.fromEntries(VALID_TYPES.map((t) => [t, 0])) as Record<SearchEntity, number> },
      } satisfies SearchResponse);
    }

    // Call the PostgreSQL search function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: results, error: searchError } = await (adminClient.rpc as any)('search_all', {
      search_query: q,
      result_types: types,
      result_limit: limit,
      result_offset: page * limit,
    });

    if (searchError) {
      console.error('[SEARCH] search_all RPC error:', JSON.stringify(searchError));
      return NextResponse.json(
        { error: `Search failed: ${searchError.message || JSON.stringify(searchError)}` },
        { status: 500 },
      );
    }

    // Get counts per type for facets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: counts, error: countError } = await (adminClient.rpc as any)('search_count', {
      search_query: q,
      result_types: types,
    });

    if (countError) {
      console.error('[SEARCH] search_count RPC error:', JSON.stringify(countError));
    }

    const facets: Record<SearchEntity, number> = Object.fromEntries(
      VALID_TYPES.map((t) => [t, 0]),
    ) as Record<SearchEntity, number>;

    if (counts && Array.isArray(counts)) {
      for (const row of counts as Array<{ entity_type: string; count: number }>) {
        if (VALID_TYPES.includes(row.entity_type as SearchEntity)) {
          facets[row.entity_type as SearchEntity] = row.count;
        }
      }
    }

    const total = Object.values(facets).reduce((a, b) => a + b, 0);

    const mapped: SearchResult[] = (results || []).map((r: Record<string, unknown>) => ({
      entity_type: r.entity_type as SearchEntity,
      entity_id: r.entity_id as string,
      title: r.title as string,
      description: r.description as string | null,
      url: r.url as string,
      metadata: r.metadata as Record<string, unknown>,
      rank: r.rank as number,
    }));

    return NextResponse.json({
      results: mapped,
      total,
      facets: { types: facets },
    } satisfies SearchResponse);
  } catch (err) {
    console.error('[SEARCH] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
