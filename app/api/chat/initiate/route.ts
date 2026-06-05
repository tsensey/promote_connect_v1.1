import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { checkMessageQuota } from '@/lib/subscription';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { quotaErrorResponse } from '@/lib/quota-messages';

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

  // Vérifier le quota avant de créer une nouvelle conversation
  if (initiatedByTier !== 'paid') {
    const { data: profileQuota } = await supabase
      .from('profiles')
      .select('daily_exchange_count, quota_override_messages')
      .eq('id', user.id)
      .single();

    const { data: configData } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', 'daily_message_limit')
      .single();

    const dailyLimit = (profileQuota as unknown as Record<string, unknown>)?.quota_override_messages as number
      ?? Number((configData as unknown as Record<string, unknown>)?.value ?? 10);
    const currentCount = (profileQuota as unknown as Record<string, unknown>)?.daily_exchange_count as number ?? 0;

    if (currentCount >= dailyLimit) {
      return NextResponse.json(
        quotaErrorResponse('initiate_conversation_exceeded'),
        { status: 403 }
      );
    }
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
