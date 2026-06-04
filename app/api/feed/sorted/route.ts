import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

interface FeedConfig {
  sponsoredWeightRatio: number;
  discoverRefreshIntervalMinutes: number;
  sponsoredTopCount: number;
}

// Cache feed config in memory (refreshed every 60s)
let configCache: { data: FeedConfig; ts: number } | null = null;
const CONFIG_TTL = 60_000;

async function getFeedConfigCached(supabase: Awaited<ReturnType<typeof createClient>>): Promise<FeedConfig> {
  if (configCache && Date.now() - configCache.ts < CONFIG_TTL) {
    return configCache.data;
  }
  const { data, error } = await supabase
    .from('platform_config')
    .select('key, value')
    .in('key', ['sponsored_weight_ratio', 'discover_mode_refresh_interval_minutes', 'sponsored_top_count']);

  const defaults: FeedConfig = { sponsoredWeightRatio: 3, discoverRefreshIntervalMinutes: 30, sponsoredTopCount: 3 };
  if (error || !data) {
    configCache = { data: defaults, ts: Date.now() };
    return defaults;
  }
  const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
  const result: FeedConfig = {
    sponsoredWeightRatio: Number(map['sponsored_weight_ratio'] ?? defaults.sponsoredWeightRatio),
    discoverRefreshIntervalMinutes: Number(map['discover_mode_refresh_interval_minutes'] ?? defaults.discoverRefreshIntervalMinutes),
    sponsoredTopCount: Number(map['sponsored_top_count'] ?? defaults.sponsoredTopCount),
  };
  configCache = { data: result, ts: Date.now() };
  return result;
}

// Cache shuffled post IDs for discover mode (keyed by seed, TTL = refresh interval)
const discoverCache = new Map<string, { ids: string[]; ts: number }>();

const POST_SELECT = `
  id, author_id, content, type, category, image_url, likes_count, comments_count, shares_count, reposts_count, created_at, repost_of_id,
  author:profiles!posts_author_id_fkey(
    id, full_name, company, avatar_url, role, subscription_tier, 
    exposants!exposants_profile_id_fkey(id, nom, is_featured)
  )
` as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'recent';
  const page = parseInt(searchParams.get('page') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  const myId = session?.session?.user?.id;

  if (!myId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: blocks } = await supabase
    .from('blocked_users')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${myId},blocked_id.eq.${myId}`);

  const blockedIds = Array.from(new Set((blocks || []).map(b => b.blocker_id === myId ? b.blocked_id : b.blocker_id)));

  const feedConfig = await getFeedConfigCached(supabase);
  const baseFilter = blockedIds.length > 0 ? `author_id.not.in.(${blockedIds.join(',')})` : undefined;

  if (mode === 'recent') {
    const sponsoredTop = feedConfig.sponsoredTopCount;
    const normalLimit = limit;
    const sponsoredOffset = Math.max(0, sponsoredTop - page * sponsoredTop);
    const sponsoredSkip = page * sponsoredTop > sponsoredTop ? (page * sponsoredTop - sponsoredTop) : 0;
    const normalOffset = page * limit;

    let sponsored: any[] = [];
    if (sponsoredOffset > 0 && page === 0) {
      const { data: sp } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .not('author_id', 'in', `(${blockedIds.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(sponsoredTop);
      if (sp) sponsored = sp.filter((p: any) =>
        p.author?.subscription_tier === 'paid' && p.author?.exposants?.[0]?.is_featured
      ).slice(0, sponsoredTop);
    }

    let query = supabase
      .from('posts')
      .select(POST_SELECT);

    if (blockedIds.length > 0) {
      query = query.not('author_id', 'in', `(${blockedIds.join(',')})`);
    }

    const offset = page * limit;
    const { data: posts, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normal = (posts || []).filter((p: any) => p.author !== null);
    const combined = [...sponsored, ...normal].slice(0, limit);

    return NextResponse.json({ data: combined });
  }

  // Discover mode
  const intervalMs = feedConfig.discoverRefreshIntervalMinutes * 60 * 1000;
  const seed = Math.floor(Date.now() / intervalMs);
  const cacheKey = `${seed}-${myId}`;

  const cached = discoverCache.get(cacheKey);
  const shuffledIds = (cached && Date.now() - cached.ts < intervalMs)
    ? cached.ids
    : null;

  if (shuffledIds) {
    const offset = page * limit;
    const pageIds = shuffledIds.slice(offset, offset + limit);

    if (pageIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data: posts, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .in('id', pageIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ordered = pageIds
      .map((id) => (posts || []).find((p: any) => p.id === id))
      .filter(Boolean);

    return NextResponse.json({ data: ordered });
  }

  const { data: allPosts, error } = await supabase
    .from('posts')
    .select(`id, author_id, author:profiles!posts_author_id_fkey(subscription_tier, exposants!exposants_profile_id_fkey(is_featured))`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const valid = (allPosts || []).filter((p: any) => p.author !== null);
  const { sponsoredWeightRatio } = feedConfig;

  valid.sort((a: any, b: any) => {
    const aSp = a.author?.subscription_tier === 'paid' && a.author?.exposants?.[0]?.is_featured;
    const bSp = b.author?.subscription_tier === 'paid' && b.author?.exposants?.[0]?.is_featured;
    const aR = cyrb128(a.id + seed)[0] / 4294967296;
    const bR = cyrb128(b.id + seed)[0] / 4294967296;
    return (bR * (bSp ? sponsoredWeightRatio : 1)) - (aR * (aSp ? sponsoredWeightRatio : 1));
  });

  const allIds = valid.map((p: any) => p.id);
  discoverCache.set(cacheKey, { ids: allIds, ts: Date.now() });

  const offset = page * limit;
  const pageIds = allIds.slice(offset, offset + limit);

  if (pageIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const { data: posts, error: fetchError } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .in('id', pageIds);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const ordered = pageIds
    .map((id) => (posts || []).find((p: any) => p.id === id))
    .filter(Boolean);

  return NextResponse.json({ data: ordered });
}

function cyrb128(str: string) {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}
