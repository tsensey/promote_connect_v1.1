import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { checkPostQuota } from '@/lib/subscription';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimitResult = await rateLimit(`posts-create:${ip}`, 30, 60_000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let content: string;
  let type = 'general';
  let category: string | null = null;
  let imageUrls: string[] | null = null;
  let repostOfId: string | null = null;

  try {
    const body = await request.json() as Record<string, unknown>;
    content = String(body.content ?? '').trim();
    if (!content) throw new Error('missing content');
    if (body.type) type = String(body.type);
    if (body.category) category = String(body.category);
    if (body.imageUrls) imageUrls = body.imageUrls as string[];
    if (body.repostOfId) repostOfId = String(body.repostOfId);
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const quotaResult = await checkPostQuota(user.id);
  if (!quotaResult.allowed) {
    return NextResponse.json({
      allowed: false,
      reason: 'post_quota_exceeded',
      currentCount: quotaResult.currentCount,
      limit: quotaResult.limit,
    }, { status: 200 });
  }

  const { data: newPost, error: insertError } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content,
      type,
      category,
      image_url: imageUrls?.length ? imageUrls.join(',') : null,
      repost_of_id: repostOfId,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data: newPost });
}
