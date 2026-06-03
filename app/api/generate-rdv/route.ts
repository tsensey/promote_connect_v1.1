import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { demandeur_id, destinataire_id, starts_at, ends_at, notes } = body;

    if (!demandeur_id || !destinataire_id || !starts_at || !ends_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: rawDemandeur, error: demandeurError } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_ends_at, access_level, full_name, email')
      .eq('id', demandeur_id)
      .single() as never;

    if (demandeurError) {
      return NextResponse.json(
        { error: `Erreur profil: ${(demandeurError as { message: string }).message}` },
        { status: 500 }
      );
    }

    const demandeurProfile = rawDemandeur as unknown as {
      subscription_tier: string | null;
      subscription_ends_at: string | null;
      access_level: string | null;
      full_name: string | null;
      email: string | null;
    };

    const isPaid =
      demandeurProfile.subscription_tier === 'paid' ||
      demandeurProfile.access_level === 'premium' ||
      (demandeurProfile.subscription_ends_at &&
        new Date(demandeurProfile.subscription_ends_at) > new Date());

    if (!isPaid) {
      return NextResponse.json(
        { error: "L'abonnement PAID est requis pour créer un rendez-vous" },
        { status: 403 }
      );
    }

    const { data: rawDestinataire } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', destinataire_id)
      .single() as never;

    const destinataireProfile = rawDestinataire as unknown as {
      full_name: string | null;
      email: string | null;
    } | null;

    const { data, error } = await supabase
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
    if (resendApiKey && destinataireProfile?.email && demandeurProfile) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'PROMOTE-CONNECT <rdv@promote-connect.com>',
            to: [destinataireProfile.email],
            subject: `Nouvelle demande de rendez-vous de ${demandeurProfile.full_name}`,
            html: `
              <p>Bonjour ${destinataireProfile.full_name},</p>
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

    return NextResponse.json({ id: data?.id, status: 'created' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
