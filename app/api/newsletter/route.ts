import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend/client';
import { createAdminClient } from '@/lib/supabase/admin';

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), userId: null };
  }

  const token = authHeader.split('Bearer ')[1];
  const supabase = createAdminClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }), userId: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }), userId: null };
  }

  return { error: null, userId: user.id };
}

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  try {
    const body = await request.json();
    const titre = String(body?.titre || '').trim();
    const contenu = String(body?.contenu || '').trim();
    const sectors = Array.isArray(body?.sectors)
      ? body.sectors.filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
      : [];
    const sendNow = body?.sendNow !== false;

    if (!titre || !contenu) {
      return NextResponse.json({ error: 'Le titre et le contenu sont requis.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    let subscriptionsQuery = supabase
      .from('newsletter_subscriptions')
      .select('email, sectors')
      .eq('is_active', true);

    if (sectors.length > 0) {
      subscriptionsQuery = subscriptionsQuery.overlaps('sectors', sectors);
    }

    const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery;
    if (subscriptionsError) {
      return NextResponse.json({ error: subscriptionsError.message }, { status: 500 });
    }

    const recipientEmails = Array.from(
      new Set((subscriptions || []).map((subscription) => subscription.email).filter(Boolean))
    );

    const sentAt = sendNow ? new Date().toISOString() : null;
    const { data: edition, error: editionError } = await supabase
      .from('newsletter_editions')
      .insert({
        titre,
        contenu,
        sent_at: sentAt,
        recipient_count: recipientEmails.length,
      })
      .select()
      .single();

    if (editionError) {
      return NextResponse.json({ error: editionError.message }, { status: 500 });
    }

    let deliveredCount = 0;

    if (sendNow && recipientEmails.length > 0 && process.env.RESEND_API_KEY) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'newsletter@promote-connect.com';
      const fromName = process.env.RESEND_FROM_NAME || 'PROMOTE-CONNECT';

      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [fromEmail],
        bcc: recipientEmails,
        subject: titre,
        html: buildNewsletterHtml({ titre, contenu }),
      });

      deliveredCount = recipientEmails.length;
    }

    return NextResponse.json({
      success: true,
      edition,
      queued: !sendNow || !process.env.RESEND_API_KEY,
      delivered_count: deliveredCount,
      recipient_count: recipientEmails.length,
    });
  } catch (error) {
    console.error('Newsletter send error:', error);
    return NextResponse.json({ error: 'Impossible de traiter la newsletter.' }, { status: 500 });
  }
}

function buildNewsletterHtml({ titre, contenu }: { titre: string; contenu: string }) {
  const paragraphs = contenu
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px;line-height:1.7;color:#475569">${paragraph}</p>`)
    .join('');

  return `
    <div style="margin:0;background:#f6f8fb;padding:32px 16px;font-family:Arial,sans-serif;color:#172554">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 30px 80px rgba(15,23,42,0.12)">
        <div style="padding:36px;background:linear-gradient(135deg,#912450 0%,#cf8d2f 100%);color:#ffffff">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;opacity:0.78">
            PROMOTE-CONNECT
          </p>
          <h1 style="margin:0;font-size:30px;line-height:1.2">${titre}</h1>
        </div>

        <div style="padding:32px">
          ${paragraphs}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
          <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b">
            Vous recevez cette newsletter car vous etes inscrit a PROMOTE-CONNECT.
          </p>
        </div>
      </div>
    </div>
  `;
}
