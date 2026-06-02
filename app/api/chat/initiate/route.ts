import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimitResult = await rateLimit(`chat-initiate:${ip}`, 20, 60_000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let targetProfileId: string;
  try {
    const body = await request.json() as Record<string, unknown>;
    targetProfileId = String(body.targetProfileId ?? '').trim();
    if (!targetProfileId) throw new Error('missing targetProfileId');
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  if (targetProfileId === user.id) {
    return NextResponse.json({ error: 'cannot_chat_with_self' }, { status: 400 });
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', targetProfileId)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: 'target_profile_not_found' }, { status: 404 });
  }

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const initiatedByTier = myProfile?.subscription_tier === 'paid' ? 'paid' : 'free_trial';

  const sortedParticipants = [user.id, targetProfileId].sort();
  const participantA = sortedParticipants[0];
  const participantB = sortedParticipants[1];

  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_a', participantA)
    .eq('participant_b', participantB)
    .maybeSingle();

  if (existingConversation) {
    return NextResponse.json({ data: existingConversation, created: false });
  }

  const { data: newConversation, error: insertError } = await supabase
    .from('conversations')
    .insert({
      participant_a: participantA,
      participant_b: participantB,
      initiated_by: user.id,
      initiated_by_tier: initiatedByTier,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data: newConversation, created: true });
}
