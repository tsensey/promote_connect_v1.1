import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    if (demandeurError) {
      return NextResponse.json(
        { error: `Erreur profil: ${demandeurError.message}` },
        { status: 500 }
      );
    }

    const isPaid =
      demandeurProfile.subscription_tier === 'paid' ||
      (demandeurProfile.subscription_ends_at &&
        new Date(demandeurProfile.subscription_ends_at) > new Date());

    if (!isPaid) {
      return NextResponse.json(
        { error: "L'abonnement PAID est requis pour créer un rendez-vous" },
        { status: 403 }
      );
    }

    const { data: destinataireProfile } = await adminSupabase
      .from('profiles')
      .select('full_name')
      .eq('id', destinataire_id)
      .single();

    const { data, error } = await authSupabase
      .from('rendez_vous')
      .insert({
        demandeur_id,
        destinataire_id,
        starts_at,
        ends_at,
        notes: notes || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && demandeurProfile) {
      const { data: { user: destinataireUser } } = await adminSupabase.auth.admin.getUserById(destinataire_id);
      const destinataireEmail = destinataireUser?.email;

      if (destinataireEmail) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'PROMOTE-CONNECT <rdv@promote-connect.com>',
              to: [destinataireEmail],
              subject: `Nouvelle demande de rendez-vous de ${demandeurProfile.full_name}`,
              html: `
                <p>Bonjour ${destinataireProfile?.full_name},</p>
                <p>${demandeurProfile.full_name} vous a envoyé une demande de rendez-vous sur PROMOTE-CONNECT.</p>
                <p>Début : ${new Date(starts_at).toLocaleString('fr-FR')}</p>
                <p>Fin : ${new Date(ends_at).toLocaleString('fr-FR')}</p>
                ${notes ? `<p>Note : ${notes}</p>` : ''}
                <p>Connectez-vous pour répondre.</p>
              `,
            }),
          });
        } catch {
          // Échec d'envoi d'email non critique
        }
      }
    }

    return NextResponse.json({ id: data?.id, status: 'created' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
