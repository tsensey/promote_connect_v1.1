import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import type { Database } from '@/types/database.types';

const resendApiKey = process.env.RESEND_API_KEY || '';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function generatePassword(): string {
  return randomBytes(9).toString('base64url').slice(0, 12);
}

function buildCredentialsHtml({
  fullName,
  email,
  password,
  role,
  company,
  pavillon,
  stand,
}: {
  fullName: string;
  email: string;
  password: string;
  role: string;
  company?: string | null;
  pavillon?: string | null;
  stand?: string | null;
}) {
  const loginUrl = `${appUrl}/login`;
  const isExposant = role === 'exposant';

  return `
    <div style="margin:0;background:#eef4ff;padding:32px 16px;font-family:Arial,sans-serif;color:#172554">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 30px 80px rgba(15,23,42,0.12)">
        <div style="padding:36px;background:#2563eb;color:#ffffff">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;opacity:0.78">
            PROMOTE-CONNECT
          </p>
          <h1 style="margin:0;font-size:30px;line-height:1.2">Votre acces est pret</h1>
          <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.8)">
            L administrateur a cree votre compte pour rejoindre le reseau professionnel PROMOTE-CONNECT.
          </p>
        </div>

        <div style="padding:32px">
          <h2 style="margin:0 0 14px;font-size:22px;color:#0f172a">Bienvenue, ${fullName}</h2>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475569">
            Vous pouvez maintenant acceder a la plateforme pour consulter l annuaire,
            dialoguer avec les autres participants et suivre le programme du salon.
          </p>

          <div style="border:1px solid #dbeafe;background:#f8fbff;border-radius:22px;padding:22px;margin-bottom:24px">
            <p style="margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#64748b">
              Vos identifiants
            </p>
            <p style="margin:0 0 10px;font-size:14px;color:#64748b">Email</p>
            <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0f172a">${email}</p>
            <p style="margin:0 0 10px;font-size:14px;color:#64748b">Mot de passe temporaire</p>
            <p style="display:inline-block;margin:0 0 18px;padding:10px 14px;border-radius:14px;background:#0f172a;color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.04em">
              ${password}
            </p>
            <p style="margin:0 0 10px;font-size:14px;color:#64748b">Role</p>
            <p style="margin:0 0 18px;font-size:16px;font-weight:700;color:#0f172a">
              ${isExposant ? 'Exposant' : role === 'admin' ? 'Administrateur' : 'Visiteur'}
            </p>
            ${isExposant ? `
            <p style="margin:12px 0 8px;font-size:14px;color:#64748b">Entreprise</p>
            <p style="margin:0 0 18px;font-size:16px;font-weight:700;color:#0f172a">${company || fullName}</p>
            ${pavillon ? `<p style="margin:0 0 8px;font-size:14px;color:#64748b">Pavillon</p>
            <p style="margin:0 0 18px;font-size:16px;font-weight:700;color:#0f172a">${pavillon}</p>` : ''}
            ${stand ? `<p style="margin:0 0 8px;font-size:14px;color:#64748b">Stand</p>
            <p style="margin:0 0 18px;font-size:16px;font-weight:700;color:#0f172a">${stand}</p>` : ''}
            ` : ''}
            <p style="margin:0;font-size:14px;color:#475569">
              Votre compte dispose d un acces complet a la plateforme.
            </p>
          </div>

          <a href="${loginUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700">
            Se connecter a PROMOTE-CONNECT
          </a>

          <p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:#64748b">
            Pour des raisons de securite, nous vous recommandons de changer ce mot de passe
            lors de votre premiere connexion.
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const supabase = createAdminClient();
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, company, role, sector, country, pavillon, is_active, created_at, access_level')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profileIds = users.map(u => u.id).filter(Boolean);
  const { data: exposants } = await supabase
    .from('exposants')
    .select('id, profile_id')
    .in('profile_id', profileIds);

  const exposantMap = new Map<string, string>();
  if (exposants) {
    for (const exp of exposants) {
      if (exp.profile_id) exposantMap.set(exp.profile_id, exp.id);
    }
  }

  const usersWithExposant = users.map(u => ({
    ...u,
    exposant_id: exposantMap.get(u.id) || null,
  }));

  return NextResponse.json({ users: usersWithExposant });
}

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const full_name = body.full_name as string | undefined;
  const email = body.email as string | undefined;
  const company = body.company as string | undefined;
  const role = body.role as string | undefined;
  const sector = body.sector as string | undefined;
  const country = body.country as string | undefined;
  const pavillon = body.pavillon as string | undefined;
  const espace_id = body.espace_id as string | undefined;
  const stand = body.stand as string | undefined;
  const description = body.description as string | undefined;
  const website = body.website as string | undefined;
  const annee_creation = body.annee_creation as string | undefined;
  const nombre_employes = body.nombre_employes as string | undefined;
  const generate_exposant = body.generate_exposant as boolean | undefined;
  const access_level = body.access_level as string | undefined;

  if (!full_name || !email || !role) {
    return NextResponse.json(
      { error: 'full_name, email et role sont requis' },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Format d\'email invalide' },
      { status: 400 }
    );
  }

  const password = generatePassword();

  const supabaseAdmin = createAdminClient();

  const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      role,
      company: company || null,
      sector: sector || null,
      country: country || null,
      pavillon: pavillon || null,
      access_level: access_level || 'classic',
      invited_by_admin: true,
      temporary_password: true,
    },
  });

  if (authCreateError) {
    if (
      authCreateError.message?.includes('already') ||
      authCreateError.message?.includes('duplicate')
    ) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe deja' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: `Erreur creation auth: ${authCreateError.message}` },
      { status: 500 }
    );
  }

  const userId = authData.user.id;

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      full_name,
      company: company || null,
      role,
      sector: sector || null,
      country: country || null,
      pavillon: pavillon || null,
      access_level: access_level || 'classic',
    });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: `Erreur creation profile: ${profileError.message}` },
      { status: 500 }
    );
  }

  if (generate_exposant && role === 'exposant') {
    const exposantData: Database['public']['Tables']['exposants']['Insert'] = {
      nom: company || full_name,
      secteur: sector || null,
      pavillon: pavillon || null,
      pays: country || null,
      stand: stand || null,
      description: description || null,
      website: website || null,
      annee_creation: annee_creation || null,
      nombre_employes: nombre_employes || null,
      espace_id: espace_id || null,
      profile_id: userId,
    };

    const { data: existingExposant } = await supabaseAdmin
      .from('exposants')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (existingExposant?.id) {
      const { profile_id: _, ...updateData } = exposantData;
      await supabaseAdmin
        .from('exposants')
        .update(updateData as Database['public']['Tables']['exposants']['Update'])
        .eq('id', existingExposant.id);
    } else {
      await supabaseAdmin.from('exposants').insert(exposantData);
    }
  }

  let emailSent = false;

  if (resendApiKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [email],
        subject: role === 'exposant'
          ? 'Vos acces exposant PROMOTE-CONNECT'
          : 'Vos acces PROMOTE-CONNECT',
        html: buildCredentialsHtml({
          fullName: full_name,
          email,
          password,
          role,
          company: company || null,
          pavillon: (generate_exposant && pavillon) ? pavillon : null,
          stand: (generate_exposant && stand) ? stand : null,
        }),
      });

      emailSent = true;
    } catch {
      // Email non critique, ne pas bloquer la creation
    }
  }

  return NextResponse.json({
    success: true,
    user_id: userId,
    email_sent: emailSent,
  });
}

export async function PATCH(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = body.id as string | undefined;
  const role = body.role as string | undefined;
  const full_name = body.full_name as string | undefined;
  const company = body.company as string | undefined;
  const sector = body.sector as string | undefined;
  const country = body.country as string | undefined;
  const pavillon = body.pavillon as string | undefined;
  const is_active = body.is_active as boolean | undefined;
  const access_level = body.access_level as string | undefined;
  const suspension_reason = body.suspension_reason as string | undefined;

  if (!id) {
    return NextResponse.json({ error: 'User ID requis' }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  const updateData: Database['public']['Tables']['profiles']['Update'] = {};

  if (role !== undefined) {
    if (!['visiteur', 'exposant', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Role invalide' }, { status: 400 });
    }
    updateData.role = role;
  }

  if (access_level !== undefined) {
    if (!['classic', 'premium'].includes(access_level)) {
      return NextResponse.json({ error: "Niveau d'acces invalide" }, { status: 400 });
    }
    updateData.access_level = access_level;
  }

  if (full_name !== undefined) updateData.full_name = full_name;
  if (company !== undefined) updateData.company = company;
  if (sector !== undefined) updateData.sector = sector;
  if (country !== undefined) updateData.country = country;
  if (pavillon !== undefined) updateData.pavillon = pavillon;

  if (is_active !== undefined) {
    updateData.is_active = is_active;
    if (!is_active) {
      updateData.suspended_at = new Date().toISOString();
      updateData.suspended_reason = suspension_reason || null;
    } else {
      updateData.suspended_at = null;
      updateData.suspended_reason = null;
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  if (userId === auth.user!.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  const { error: notifError } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('profile_id', userId);

  if (notifError) {
    return NextResponse.json({ error: notifError.message }, { status: 500 });
  }

  const { error: chatMsgError } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('sender_id', userId);

  if (chatMsgError) {
    return NextResponse.json({ error: chatMsgError.message }, { status: 500 });
  }

  const { data: conversations } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`);

  if (conversations && conversations.length > 0) {
    const convoIds = conversations.map((c) => c.id);

    await supabaseAdmin.from('messages').delete().in('conversation_id', convoIds);
    await supabaseAdmin.from('conversations').delete().in('id', convoIds);
  }

  await supabaseAdmin.from('post_comments').delete().eq('author_id', userId);

  await supabaseAdmin.from('post_likes').delete().eq('user_id', userId);

  await supabaseAdmin.from('post_shares').delete().eq('user_id', userId);

  await supabaseAdmin.from('posts').delete().eq('author_id', userId);

  await supabaseAdmin.from('rendez_vous').delete().or(`demandeur_id.eq.${userId},destinataire_id.eq.${userId}`);

  await supabaseAdmin.from('support_messages').delete().eq('sender_id', userId);

  await supabaseAdmin.from('support_tickets').delete().eq('profile_id', userId);

  await supabaseAdmin.from('exposants').delete().eq('profile_id', userId);

  await supabaseAdmin.from('user_preferences').delete().eq('profile_id', userId);

  await supabaseAdmin.from('profiles').delete().eq('id', userId);

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
