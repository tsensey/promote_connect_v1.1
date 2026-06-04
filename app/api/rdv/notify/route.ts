import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend/client';
import { buildRdvEmailHtml } from '@/lib/email-rdv';

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
    const actorName = actor_id === rdv.demandeur_id ? demandeurName : destinataireName;

    const notificationType = isConfirmed ? 'rdv_confirmed' : 'rdv_cancelled';
    const actionLabel = isConfirmed ? 'a confirmé' : 'a annulé';

    const emailHtml = buildRdvEmailHtml({
      demandeurName,
      destinataireName,
      startsAt: rdv.starts_at,
      endsAt: rdv.ends_at,
      notes: rdv.notes ?? undefined,
      status: rdv.status,
    });

    // Envoyer notification + email aux DEUX participants
    const participantIds = [rdv.demandeur_id, rdv.destinataire_id].filter(Boolean) as string[];
    const participants = participantIds.map(id => ({
      id,
      name: id === rdv.demandeur_id ? demandeurName : destinataireName,
    }));

    for (const p of participants) {
      // Notification in-app
      const { error: notifErr } = await adminSupabase.from('notifications').insert({
        profile_id: p.id,
        sender_id: actor_id,
        type: notificationType,
        data: { rdv_id: rdv.id, status: rdv.status, starts_at: rdv.starts_at, ends_at: rdv.ends_at } as any,
      });
      if (notifErr) console.error('Erreur insertion notification:', notifErr);

      // Email
      try {
        const { data: { user } } = await adminSupabase.auth.admin.getUserById(p.id);
        const email = user?.email;
        if (!email) {
          console.warn(`Aucun email pour userId ${p.id}`);
          continue;
        }

        const subject = p.id === actor_id
          ? `Vous avez ${actionLabel} le rendez-vous avec ${actor_id === rdv.demandeur_id ? destinataireName : demandeurName}`
          : `${actorName} ${actionLabel} le rendez-vous avec vous`;

        await resend.emails.send({
          from: 'PROMOTE-CONNECT <rdv@promote-connect.com>',
          to: [email],
          subject,
          html: emailHtml,
        });
        console.log(`Email ${rdv.status} envoyé à ${email}`);
      } catch (err) {
        console.error(`Erreur email pour ${p.id}:`, err);
      }
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('Erreur rdv/notify:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
