import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let messageId: string;
  try {
    const body = await request.json() as { messageId: string };
    messageId = body.messageId;
    if (!messageId) throw new Error('missing messageId');
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  // Effectuer la suppression douce (soft delete)
  const { error } = await supabase
    .from('messages')
    .update({
      is_deleted: true,
      content: 'Ce message a été supprimé',
      attachment_url: null,
      attachment_type: null,
      product_attachment: null
    })
    .eq('id', messageId)
    .eq('sender_id', user.id); // RLS assure déjà ça, mais par sécurité

  if (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'delete_failed', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
