import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildRdvEmailHtml } from '@/lib/email-rdv';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const FROM_EMAIL = 'PROMOTE-CONNECT <rdv@promote-connect.com>';

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Resend error (${res.status}): ${text}`);
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const { data: rdvs, error } = await (adminSupabase.rpc as any)('get_upcoming_confirmed_rdvs', {
      window_start: now.toISOString(),
      window_end: windowEnd.toISOString(),
    });

    if (error) {
      console.error('RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!rdvs || rdvs.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    let sentCount = 0;
    for (const rdv of rdvs) {
      const hoursBefore = Math.round((new Date(rdv.starts_at).getTime() - now.getTime()) / 3600000);

      try {
        const { data: { user: demandeurUser } } = await adminSupabase.auth.admin.getUserById(rdv.demandeur_id);
        const { data: { user: destinataireUser } } = await adminSupabase.auth.admin.getUserById(rdv.destinataire_id);

        const recipients = [
          { id: rdv.demandeur_id, email: demandeurUser?.email, name: rdv.demandeur_name, other: rdv.destinataire_name },
          { id: rdv.destinataire_id, email: destinataireUser?.email, name: rdv.destinataire_name, other: rdv.demandeur_name },
        ];

        for (const r of recipients) {
          const html = buildRdvEmailHtml({
            demandeurName: rdv.demandeur_name,
            destinataireName: rdv.destinataire_name,
            startsAt: rdv.starts_at,
            endsAt: rdv.ends_at,
            notes: rdv.notes || undefined,
            status: 'confirmed',
          });

          // Notification in-app
          await adminSupabase.from('notifications').insert({
            profile_id: r.id,
            sender_id: r.id,
            type: 'rdv_reminder',
            data: { rdv_id: rdv.rdv_id, starts_at: rdv.starts_at, ends_at: rdv.ends_at, hours_before: hoursBefore } as any,
          });

          if (r.email) {
            await sendEmail(r.email, `Rappel : rendez-vous avec ${r.other} dans ${hoursBefore}h`, html);
          }
        }
        sentCount++;
      } catch (err) {
        console.error('Erreur pour un RDV:', err);
      }
    }

    return NextResponse.json({ sent: sentCount, total: rdvs.length });
  } catch (err) {
    console.error('Erreur cron rdv-reminder:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
