import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { render } from '@react-email/components';
import { resend } from '@/lib/resend/client';
import { createAdminClient } from '@/lib/supabase/admin';
import NewsletterEmail from '@/emails/NewsletterEmail';

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), adminId: null };
  }

  const token = authHeader.split('Bearer ')[1];
  const supabase = createAdminClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }), adminId: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }), adminId: null };
  }

  return { error: null, adminId: user.id };
}

function generateToken(): string {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    let query = supabase
      .from('newsletter_subscriptions')
      .select('id, email, profile_id, unsubscribe_token, sectors, frequency')
      .eq('is_active', true);

    if (sectors.length > 0) {
      query = query.overlaps('sectors', sectors);
    }

    const { data: subscriptions, error: subscriptionsError } = await query;
    if (subscriptionsError) {
      return NextResponse.json({ error: subscriptionsError.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'Aucun abonné actif trouvé.' }, { status: 404 });
    }

    // Ensure all subscribers have tokens and fetch profile names for personalization
    const profileIds = subscriptions
      .map((s) => s.profile_id)
      .filter(Boolean) as string[];

    const { data: profiles } = profileIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', profileIds)
      : { data: [] };

    const profileMap = new Map<string, string | undefined>(
      (profiles || []).map((p) => [p.id, p.full_name ?? undefined])
    );

    // Check user_preferences: exclude those who opted out of newsletter
    const { data: preferences } = profileIds.length > 0
      ? await supabase
          .from('user_preferences')
          .select('profile_id')
          .eq('notify_newsletter', false)
          .in('profile_id', profileIds)
      : { data: [] };

    const optedOutIds = new Set((preferences || []).map((p) => p.profile_id));

    const recipients = subscriptions.filter(
      (s) => !s.profile_id || !optedOutIds.has(s.profile_id)
    );

    const sentAt = sendNow ? new Date().toISOString() : null;
    const { data: edition, error: editionError } = await supabase
      .from('newsletter_editions')
      .insert({
        titre,
        contenu,
        sent_at: sentAt,
        recipient_count: recipients.length,
      })
      .select()
      .single();

    if (editionError) {
      return NextResponse.json({ error: editionError.message }, { status: 500 });
    }

    let deliveredCount = 0;

    if (sendNow && recipients.length > 0 && process.env.RESEND_API_KEY) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'newsletter@promote-connect.com';
      const fromName = process.env.RESEND_FROM_NAME || 'PROMOTE-CONNECT';

      // Send individually for personalization (unsubscribe URL + name)
      const BATCH_SIZE = 50;
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        const sendPromises = batch.map(async (sub) => {
          const token = sub.unsubscribe_token || generateToken();
          if (!sub.unsubscribe_token) {
            await supabase
              .from('newsletter_subscriptions')
              .update({ unsubscribe_token: token })
              .eq('id', sub.id);
          }

          const unsubscribeUrl = `${appUrl}/api/newsletter/unsubscribe?token=${token}`;
          const recipientName = sub.profile_id ? profileMap.get(sub.profile_id) : undefined;

          const emailHtml = await render(
            NewsletterEmail({
              titre,
              contenu,
              recipientName,
              unsubscribeUrl,
            })
          );

          return resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [sub.email],
            subject: titre,
            html: emailHtml,
          });
        });

        await Promise.allSettled(sendPromises);
        deliveredCount += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      edition,
      queued: !sendNow || !process.env.RESEND_API_KEY,
      delivered_count: deliveredCount,
      recipient_count: recipients.length,
    });
  } catch (error) {
    console.error('Newsletter send error:', error);
    return NextResponse.json({ error: 'Impossible de traiter la newsletter.' }, { status: 500 });
  }
}
