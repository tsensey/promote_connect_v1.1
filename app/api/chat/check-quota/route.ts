/**
 * app/api/chat/check-quota/route.ts
 * Vérification serveur du quota de messagerie AVANT envoi
 * CdC §2 — Messagerie asymétrique : logique initiateur PAID vs free_trial
 *
 * IMPORTANT: Cette route DOIT être appelée côté serveur avant tout envoi de message.
 * Ne jamais vérifier le quota uniquement côté client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { checkMessageQuota } from '@/lib/subscription';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { quotaErrorResponse } from '@/lib/quota-messages';

export async function POST(request: NextRequest) {
  // Rate limiting — max 60 vérifications/minute par IP
  const ip = getClientIp(request);
  const rateLimitResult = await rateLimit(`chat-quota:${ip}`, 60, 60_000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'rate_limit_exceeded' },
      { status: 429 }
    );
  }

  // Authentification
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let conversationId: string;
  try {
    const body = await request.json() as { conversationId?: string };
    conversationId = body.conversationId ?? '';
    if (!conversationId) throw new Error('missing conversationId');
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  // Vérifier que l'utilisateur fait partie de cette conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, participant_a, participant_b, initiated_by, initiated_by_tier')
    .eq('id', conversationId)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: 'conversation_not_found' }, { status: 404 });
  }

  const isParticipant =
    conversation.participant_a === user.id ||
    conversation.participant_b === user.id;

  if (!isParticipant) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Vérification du quota
  const result = await checkMessageQuota(user.id, conversationId);

  if (!result.allowed) {
    const reason = (result.reason as 'daily_quota_exceeded' | 'total_quota_exceeded' | 'account_inactive' | 'account_suspended' | 'account_blocked' | 'profile_not_found') ?? 'daily_quota_exceeded';
    return NextResponse.json(
      {
        allowed: false,
        remaining: result.remaining ?? 0,
        ...quotaErrorResponse(reason),
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    allowed: true,
    remaining: result.remaining,
  });
}
