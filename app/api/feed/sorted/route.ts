import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { getFeedConfig } from '@/lib/subscription';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'recent'; // 'recent' or 'discover'
  const page = parseInt(searchParams.get('page') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  const myId = session?.session?.user?.id;

  if (!myId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get blocked users to exclude their posts
  const { data: blocks } = await supabase
    .from('blocked_users')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${myId},blocked_id.eq.${myId}`);
    
  const blockedIds = Array.from(new Set((blocks || []).map(b => b.blocker_id === myId ? b.blocked_id : b.blocker_id)));

    let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id, full_name, company, avatar_url, role, subscription_tier, 
        exposants!exposants_profile_id_fkey(id, nom, is_featured)
      )
    `);

  if (blockedIds.length > 0) {
    query = query.not('author_id', 'in', `(${blockedIds.join(',')})`);
  }

  const { data: posts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out posts that don't have an author
  const validPosts = posts.filter((p) => p.author !== null);

  const feedConfig = await getFeedConfig();

  if (mode === 'recent') {
    // Mode "Plus récents" : sponsorisés (PAID + is_featured) en tête (limité par sponsored_top_count), puis chronologique
    const sponsoredPosts: typeof validPosts = [];
    const normalPosts: typeof validPosts = [];

    for (const post of validPosts) {
      const isSponsored = post.author.subscription_tier === 'paid' && post.author.exposants?.[0]?.is_featured;
      if (isSponsored) {
        sponsoredPosts.push(post);
      } else {
        normalPosts.push(post);
      }
    }

    sponsoredPosts.sort((a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    normalPosts.sort((a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    const topSponsored = sponsoredPosts.slice(0, feedConfig.sponsoredTopCount);
    validPosts.length = 0;
    validPosts.push(...topSponsored, ...normalPosts);
  } else if (mode === 'discover') {
    // Mode "Découvrir" : aléatoire pondéré
    const { sponsoredWeightRatio, discoverRefreshIntervalMinutes } = feedConfig;

    // Seed based on refresh interval to maintain pagination stability within that window
    const intervalMs = discoverRefreshIntervalMinutes * 60 * 1000;
    const seed = Math.floor(Date.now() / intervalMs);

    validPosts.sort((a, b) => {
      const isASponsored = a.author.subscription_tier === 'paid' && a.author.exposants?.[0]?.is_featured;
      const isBSponsored = b.author.subscription_tier === 'paid' && b.author.exposants?.[0]?.is_featured;

      const aWeight = isASponsored ? sponsoredWeightRatio : 1;
      const bWeight = isBSponsored ? sponsoredWeightRatio : 1;

      const aRandom = cyrb128(a.id + seed)[0] / 4294967296;
      const bRandom = cyrb128(b.id + seed)[0] / 4294967296;

      const aScore = aRandom * aWeight;
      const bScore = bRandom * bWeight;

      return bScore - aScore;
    });
  }

  // Paginate
  const startIndex = page * limit;
  const paginatedPosts = validPosts.slice(startIndex, startIndex + limit);

  return NextResponse.json({ data: paginatedPosts });
}

// Simple hash function for deterministic randomness based on string
function cyrb128(str: string) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
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
