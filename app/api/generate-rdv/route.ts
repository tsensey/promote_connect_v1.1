import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
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

    const emailHtml = buildRdvEmailHtml({
      demandeurName,
      destinataireName,
      startsAt: starts_at,
      endsAt: ends_at,
      notes: notes ?? undefined,
      status: 'pending',
    });

    const resendApiKey = process.env.RESEND_API_KEY || '';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const sent = { destinataire: false, demandeur: false };

    if (resendApiKey) {
      const destinataireEmail = await getUserEmail(adminSupabase, destinataire_id);
      if (destinataireEmail) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
            body: JSON.stringify({
              from: fromEmail,
              to: [destinataireEmail],
              subject: `Nouvelle demande de rendez-vous de ${demandeurName}`,
              html: emailHtml,
            }),
          });
          sent.destinataire = res.ok;
          if (!res.ok) console.error(`Resend error (demande): ${res.status} ${await res.text()}`);
        } catch (err) {
          console.error('Erreur email destinataire:', err);
        }
      }

      const demandeurEmail = await getUserEmail(adminSupabase, demandeur_id);
      if (demandeurEmail) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
            body: JSON.stringify({
              from: fromEmail,
              to: [demandeurEmail],
              subject: `Votre demande de rendez-vous avec ${destinataireName}`,
              html: emailHtml,
            }),
          });
          sent.demandeur = res.ok;
          if (!res.ok) console.error(`Resend error (confirmation): ${res.status} ${await res.text()}`);
        } catch (err) {
          console.error('Erreur email demandeur:', err);
        }
      }
    }

    return NextResponse.json({ id: rdvId, status: 'created', email_sent: sent }, { status: 201 });
  } catch (err) {
    console.error('Erreur generate-rdv:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
