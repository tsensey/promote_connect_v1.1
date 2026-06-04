import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildRdvEmailHtml } from '@/lib/email-rdv';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type AdminClient = SupabaseClient<Database>;

const FROM_EMAIL = 'PROMOTE-CONNECT <rdv@promote-connect.com>';

async function insertNotification(
  supabase: AdminClient,
  profileId: string,
  senderId: string,
  type: string,
  data: Record<string, unknown>,
) {
  const { error } = await supabase.from('notifications').insert({
    profile_id: profileId,
    sender_id: senderId,
    type,
    data: data as any,
  });
  if (error) {
    console.error('Erreur insertion notification:', error);
  }
}

async function sendResendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Resend error (${res.status}): ${text}`);
  } else {
    console.log(`Email envoyé à ${to}: ${subject}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { demandeur_id, destinataire_id, starts_at, ends_at, notes } = body;

    if (!demandeur_id || !destinataire_id || !starts_at || !ends_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const authSupabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user || user.id !== demandeur_id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: demandeurProfile, error: demandeurError } = await adminSupabase
      .from('profiles')
      .select('subscription_tier, subscription_ends_at, full_name')
      .eq('id', demandeur_id)
      .single();

    if (demandeurError || !demandeurProfile) {
      return NextResponse.json({ error: 'Erreur profil demandeur' }, { status: 500 });
    }

    const isPaid =
      demandeurProfile.subscription_tier === 'paid' ||
      (demandeurProfile.subscription_ends_at &&
        new Date(demandeurProfile.subscription_ends_at) > new Date());

    if (!isPaid) {
      return NextResponse.json({ error: "L'abonnement PAID est requis" }, { status: 403 });
    }

    const { data: destinataireProfile } = await adminSupabase
      .from('profiles')
      .select('full_name')
      .eq('id', destinataire_id)
      .single();

    const { data: rdv, error: rdvError } = await authSupabase
      .from('rendez_vous')
      .insert({ demandeur_id, destinataire_id, starts_at, ends_at, notes: notes || null, status: 'pending' })
      .select('id')
      .single();

    if (rdvError) {
      return NextResponse.json({ error: rdvError.message }, { status: 500 });
    }

    const rdvId = rdv?.id;
    const demandeurName = demandeurProfile.full_name ?? 'Un exposant';
    const destinataireName = destinataireProfile?.full_name ?? 'Contact';

    // === Notification in-app ===
    await insertNotification(adminSupabase, destinataire_id, demandeur_id, 'rdv_request', {
      rdv_id: rdvId, starts_at, ends_at, notes: notes || null, status: 'pending',
    });

    // === Emails ===
    const emailHtml = buildRdvEmailHtml({
      demandeurName,
      destinataireName,
      startsAt: starts_at,
      endsAt: ends_at,
      notes: notes ?? undefined,
      status: 'pending',
    });

    let destinataireEmail: string | undefined;
    let demandeurEmail: string | undefined;

    try {
      const r = await adminSupabase.auth.admin.getUserById(destinataire_id);
      destinataireEmail = r.data?.user?.email ?? undefined;
    } catch (err) { console.error('Erreur email destinataire:', err); }

    try {
      const r = await adminSupabase.auth.admin.getUserById(demandeur_id);
      demandeurEmail = r.data?.user?.email ?? undefined;
    } catch (err) { console.error('Erreur email demandeur:', err); }

    if (destinataireEmail) {
      await sendResendEmail(destinataireEmail, `Nouvelle demande de rendez-vous de ${demandeurName}`, emailHtml);
    } else {
      console.warn(`Aucun email pour destinataire ${destinataire_id}`);
    }

    if (demandeurEmail) {
      await sendResendEmail(demandeurEmail, `Votre demande de rendez-vous avec ${destinataireName}`, emailHtml);
    }

    return NextResponse.json({ id: rdvId, status: 'created' }, { status: 201 });
  } catch (err) {
    console.error('Erreur generate-rdv:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
