import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildRdvEmailHtml } from '@/lib/email-rdv';

const FROM_EMAIL = 'PROMOTE-CONNECT <rdv@promote-connect.com>';

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

    const isDemandeur = rdv.demandeur_id === actor_id;
    const targetUserId = isDemandeur ? rdv.destinataire_id : rdv.demandeur_id;
    if (!targetUserId) {
      return NextResponse.json({ error: 'Utilisateur cible introuvable' }, { status: 404 });
    }

    const isConfirmed = rdv.status === 'confirmed';
    const notificationType = isConfirmed ? 'rdv_confirmed' : 'rdv_cancelled';

    // === Notification in-app ===
    const { error: notifErr } = await adminSupabase.from('notifications').insert({
      profile_id: targetUserId,
      sender_id: actor_id,
      type: notificationType,
      data: { rdv_id: rdv.id, status: rdv.status, starts_at: rdv.starts_at, ends_at: rdv.ends_at } as any,
    });
    if (notifErr) console.error('Erreur insertion notification rdv/notify:', notifErr);

    // === Email ===
    const demandeurName = rdv.demandeur?.full_name ?? 'Un participant';
    const destinataireName = rdv.destinataire?.full_name ?? 'Un participant';

    const emailHtml = buildRdvEmailHtml({
      demandeurName,
      destinataireName,
      startsAt: rdv.starts_at,
      endsAt: rdv.ends_at,
      notes: rdv.notes ?? undefined,
      status: rdv.status,
    });

    const subject = isConfirmed
      ? `${destinataireName} a confirmé votre rendez-vous`
      : `${destinataireName} a annulé le rendez-vous`;

    try {
      const { data: { user: targetUser } } = await adminSupabase.auth.admin.getUserById(targetUserId);
      const email = targetUser?.email;

      if (email) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          console.warn('RESEND_API_KEY not set');
          return NextResponse.json({ sent: true, warning: 'no resend key' });
        }
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ from: FROM_EMAIL, to: [email], subject, html: emailHtml }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error(`Resend error (${res.status}): ${text}`);
        } else {
          console.log(`Email notify envoyé à ${email} pour RDV ${rdv_id}`);
        }
      } else {
        console.warn(`Aucun email pour userId ${targetUserId}`);
      }
    } catch (err) {
      console.error('Erreur envoi email rdv/notify:', err);
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('Erreur rdv/notify:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
