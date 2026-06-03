import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface NewsletterEdition {
  id: string;
  titre: string;
  contenu: string | null;
  sent_at: string | null;
  recipient_count: number | null;
}

serve(async (_request: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'newsletter@promote-connect.com';
  const fromName = Deno.env.get('RESEND_FROM_NAME') || 'PROMOTE-CONNECT';
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://promote-connect.com';

  if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
    return new Response(JSON.stringify({ error: 'Missing configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch unsent editions (scheduled but not sent)
    const { data: pendingEditions, error: editionsError } = await supabase
      .from('newsletter_editions')
      .select('*')
      .is('sent_at', null)
      .order('created_at', { ascending: true });

    if (editionsError) {
      throw new Error(`Failed to fetch editions: ${editionsError.message}`);
    }

    if (!pendingEditions || pendingEditions.length === 0) {
      return new Response(JSON.stringify({ status: 'ok', message: 'No pending editions' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results: { edition_id: string; status: string; recipient_count: number }[] = [];

    for (const edition of pendingEditions as NewsletterEdition[]) {
      // Fetch active subscribers with frequency matching (all for now)
      const { data: subscribers, error: subError } = await supabase
        .from('newsletter_subscriptions')
        .select('id, email, profile_id, unsubscribe_token, sectors')
        .eq('is_active', true);

      if (subError || !subscribers || subscribers.length === 0) {
        results.push({ edition_id: edition.id, status: 'no_subscribers', recipient_count: 0 });
        continue;
      }

      // Filter out users who opted out via preferences
      const profileIds = subscribers
        .map((s) => s.profile_id)
        .filter(Boolean) as string[];

      let optedOutIds: string[] = [];
      if (profileIds.length > 0) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('profile_id')
          .eq('notify_newsletter', false)
          .in('profile_id', profileIds);
        optedOutIds = (preferences || []).map((p) => p.profile_id);
      }

      const activeRecipients = subscribers.filter(
        (s) => !s.profile_id || !optedOutIds.includes(s.profile_id)
      );

      if (activeRecipients.length === 0) {
        results.push({ edition_id: edition.id, status: 'no_recipients', recipient_count: 0 });
        continue;
      }

      // Send individually for personalized unsubscribe links
      let sentCount = 0;
      const BATCH_SIZE = 50;

      for (let i = 0; i < activeRecipients.length; i += BATCH_SIZE) {
        const batch = activeRecipients.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (sub) => {
          const token = sub.unsubscribe_token || crypto.randomUUID();
          if (!sub.unsubscribe_token) {
            await supabase
              .from('newsletter_subscriptions')
              .update({ unsubscribe_token: token })
              .eq('id', sub.id);
          }

          const unsubscribeUrl = `${appUrl}/api/newsletter/unsubscribe?token=${token}`;
          const paragraphs = (edition.contenu || '')
            .split(/\n{2,}/)
            .map((p: string) => p.trim())
            .filter(Boolean);

          const html = buildEmailHtml({
            titre: edition.titre,
            paragraphs,
            unsubscribeUrl,
            year: new Date().getFullYear(),
          });

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `${fromName} <${fromEmail}>`,
              to: [sub.email],
              subject: edition.titre,
              html,
            }),
          });

          if (!res.ok) {
            console.error(`Failed to send to ${sub.email}: ${await res.text()}`);
          }
        });

        await Promise.allSettled(promises);
        sentCount += batch.length;
      }

      // Mark edition as sent
      await supabase
        .from('newsletter_editions')
        .update({ sent_at: new Date().toISOString(), recipient_count: sentCount })
        .eq('id', edition.id);

      results.push({
        edition_id: edition.id,
        status: 'sent',
        recipient_count: sentCount,
      });
    }

    return new Response(JSON.stringify({ status: 'ok', results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-newsletter error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

function buildEmailHtml({
  titre,
  paragraphs,
  unsubscribeUrl,
  year,
}: {
  titre: string;
  paragraphs: string[];
  unsubscribeUrl: string;
  year: number;
}): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titre}</title></head>
<body style="margin:0;padding:32px 16px;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;color:#172554">
<div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 30px 80px rgba(15,23,42,0.12)">
  <div style="padding:36px;background:#4A072B;color:#ffffff">
    <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;opacity:0.78">PROMOTE-CONNECT</p>
    <h1 style="margin:0;font-size:30px;line-height:1.2;font-weight:700">${titre}</h1>
  </div>
  <div style="padding:32px">
    ${paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.7;color:#475569;font-size:15px">${p}</p>`).join('')}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
    <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b">Vous recevez cette newsletter car vous êtes inscrit à PROMOTE-CONNECT.</p>
  </div>
  <div style="padding:20px 32px;background:#f8fafc;text-align:center">
    <p style="margin:0 0 8px;font-size:12px"><a href="${unsubscribeUrl}" style="color:#4A072B;text-decoration:underline;font-weight:500">Se désinscrire de la newsletter</a></p>
    <p style="margin:4px 0 0;font-size:11px;color:#94a3b8">PROMOTE-CONNECT — Plateforme de networking professionnel</p>
    <p style="margin:4px 0 0;font-size:11px;color:#94a3b8">&copy; ${year} PROMOTE. Tous droits réservés.</p>
  </div>
</div>
</body>
</html>`;
}
