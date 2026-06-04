import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { checkMessageQuota } from '@/lib/subscription';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import type { Json } from '@/types/database.types';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimitResult = await rateLimit(`chat-send:${ip}`, 30, 60_000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: {
    conversationId: string;
    content: string;
    replyToId?: string | null;
    productAttachment?: Record<string, unknown> | null;
    attachmentUrl?: string | null;
    attachmentType?: 'image' | 'document' | 'product' | null;
  };
  try {
    body = await request.json();
    if (!body.conversationId || !body.content?.trim()) {
      throw new Error('missing required fields');
    }
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, participant_a, participant_b')
    .eq('id', body.conversationId)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: 'conversation_not_found' }, { status: 404 });
  }

  const isParticipant =
    conversation.participant_a === user.id ||
    conversation.participant_b === user.id;

  if (!isParticipant) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const quotaResult = await checkMessageQuota(user.id, body.conversationId);
  if (!quotaResult.allowed) {
    return NextResponse.json(
      {
        error: 'quota_exceeded',
        reason: quotaResult.reason,
        showConversionModal: quotaResult.reason === 'daily_quota_exceeded',
      },
      { status: 403 }
    );
  }

  const { data: message, error: insertError } = await supabase
    .from('messages')
    .insert({
      conversation_id: body.conversationId,
      sender_id: user.id,
      content: body.content.trim(),
      reply_to_id: body.replyToId ?? null,
      product_attachment: (body.productAttachment as Json | null) ?? null,
      attachment_url: body.attachmentUrl ?? null,
      attachment_type: body.attachmentType ?? null,
      is_read: false,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Message insert error:', insertError);
    return NextResponse.json({ error: 'insert_failed', details: 'Failed to save message' }, { status: 500 });
  }

  if (!message) {
    return NextResponse.json({ error: 'insert_failed', details: 'No message returned' }, { status: 500 });
  }

  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', body.conversationId);

  return NextResponse.json({ data: message });
}
