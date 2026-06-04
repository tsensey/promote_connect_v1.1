import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildRdvEmailHtml } from '@/lib/email-rdv';

async function getUserEmail(adminSupabase: ReturnType<typeof createAdminClient>, userId: string): Promise<string | null> {
  try {
    const { data: { user } } = await adminSupabase.auth.admin.getUserById(userId);
    return user?.email ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rdv_id, actor_id } = body;

    if (!rdv_id || !actor_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: rdv, error: rdvError } = await adminSupabase
      .from('rendez_vous')
      .select('*, demandeur:profiles!rendez_vous_demandeur_id_fkey(full_name), destinataire:profiles!rendez_vous_destinataire_id_fkey(full_name)')
      .eq('id', rdv_id)
      .single();

    if (rdvError || !rdv) {
      return NextResponse.json({ error: 'Rendez-vous introuvable' }, { status: 404 });
    }

    if (rdv.status !== 'confirmed' && rdv.status !== 'cancelled') {
      return NextResponse.json({ error: 'Aucun changement de statut à notifier' }, { status: 400 });
    }

    const isConfirmed = rdv.status === 'confirmed';
    const demandeurName = rdv.demandeur?.full_name ?? 'Un participant';
    const destinataireName = rdv.destinataire?.full_name ?? 'Un participant';
    const actionLabel = isConfirmed ? 'a confirmé' : 'a annulé';

    const emailHtml = buildRdvEmailHtml({
      demandeurName,
      destinataireName,
      startsAt: rdv.starts_at,
      endsAt: rdv.ends_at,
      notes: rdv.notes ?? undefined,
      status: rdv.status,
    });

    const resendApiKey = process.env.RESEND_API_KEY || '';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const participantIds = [rdv.demandeur_id, rdv.destinataire_id].filter(Boolean) as string[];
    const sent: Record<string, boolean> = {};

    if (resendApiKey) {
      for (const pid of participantIds) {
        const email = await getUserEmail(adminSupabase, pid);
        if (!email) {
          console.warn(`Aucun email pour ${pid}`);
          continue;
        }

        const otherName = pid === rdv.demandeur_id ? destinataireName : demandeurName;
        const subject = pid === actor_id
          ? `Vous avez ${actionLabel} le rendez-vous avec ${otherName}`
          : `${otherName} ${actionLabel} le rendez-vous avec vous`;

        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
            body: JSON.stringify({
              from: fromEmail,
              to: [email],
              subject,
              html: emailHtml,
            }),
          });
          sent[pid] = res.ok;
          if (!res.ok) console.error(`Resend error (notify): ${res.status} ${await res.text()}`);
        } catch (err) {
          console.error(`Erreur email pour ${pid}:`, err);
        }
      }
    }

    return NextResponse.json({ sent });
  } catch (err) {
    console.error('Erreur rdv/notify:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
