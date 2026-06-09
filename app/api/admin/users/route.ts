import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import type { Database } from '@/types/database.types';
import { render } from '@react-email/components';
import CredentialsEmail from '@/emails/CredentialsEmail';

const resendApiKey = process.env.RESEND_API_KEY || '';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function generatePassword(): string {
  return randomBytes(9).toString('base64url').slice(0, 12);
}



export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const supabase = createAdminClient();
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, company, role, sector, country, pavillon, is_active, created_at, subscription_ends_at, subscription_tier')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map<string, string>();
  if (authData?.users) {
    authData.users.forEach(u => {
      if (u.email) emailMap.set(u.id, u.email);
    });
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
    email: emailMap.get(u.id) || null,
  }));

  return NextResponse.json({ users: usersWithExposant });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`admin:users:post:${ip}`, 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });

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
  const exposant_id = body.exposant_id as string | undefined;
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
    });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: `Erreur creation profile: ${profileError.message}` },
      { status: 500 }
    );
  }

  if (role === 'exposant') {
    if (exposant_id) {
      const { error: linkError } = await supabaseAdmin
        .from('exposants')
        .update({ profile_id: userId })
        .eq('id', exposant_id);

      if (linkError) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: `Erreur liaison exposant: ${linkError.message}` },
          { status: 500 }
        );
      }
    } else if (generate_exposant) {
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
  }

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: auth.user!.id,
    actor_email: auth.user!.email,
    actor_role: 'admin',
    action: 'create_profiles',
    entity_type: 'profiles',
    entity_id: userId,
    metadata: { email, full_name, role, company, sector, country, pavillon }
  });

  let emailSent = false;

  if (resendApiKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);

      const emailHtml = await render(
        CredentialsEmail({
          fullName: full_name,
          email,
          password,
          role,
          company: company || null,
          pavillon: (generate_exposant && pavillon) ? pavillon : null,
          stand: (generate_exposant && stand) ? stand : null,
        })
      );

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [email],
        subject: role === 'exposant'
          ? 'Vos acces exposant PROMOTE-CONNECT'
          : 'Vos acces PROMOTE-CONNECT',
        html: emailHtml,
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
  const ip = getClientIp(request);
  const rl = await rateLimit(`admin:users:patch:${ip}`, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });

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
  const subscription_tier = body.subscription_tier as string | undefined;
  const suspension_reason = body.suspension_reason as string | undefined;
  const subscription_ends_at = body.subscription_ends_at as string | undefined;

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

  if (subscription_tier !== undefined) {
    if (!['free_trial', 'paid'].includes(subscription_tier)) {
      return NextResponse.json({ error: "Tier d'abonnement invalide" }, { status: 400 });
    }
    updateData.subscription_tier = subscription_tier;
  }

  if (full_name !== undefined) updateData.full_name = full_name;
  if (company !== undefined) updateData.company = company;
  if (sector !== undefined) updateData.sector = sector;
  if (country !== undefined) updateData.country = country;
  if (pavillon !== undefined) updateData.pavillon = pavillon;

  if (subscription_ends_at !== undefined) {
    updateData.subscription_ends_at = subscription_ends_at;
  }

  if (is_active !== undefined) {
    updateData.is_active = is_active;
    // Set account_status so the middleware's isAccountBlocked works properly
    updateData.account_status = is_active ? 'active' : 'suspended';
    
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

  // Sync auth metadata and ban status
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(id);
  if (userData?.user) {
    const newMetaData = {
      ...userData.user.user_metadata,
      ...(role !== undefined && { role }),
      ...(subscription_tier !== undefined && { subscription_tier }),
      ...(full_name !== undefined && { full_name }),
      ...(company !== undefined && { company }),
      ...(sector !== undefined && { sector }),
      ...(country !== undefined && { country }),
      ...(pavillon !== undefined && { pavillon }),
      ...(is_active !== undefined && { account_status: is_active ? 'active' : 'suspended' }),
    };

    await supabaseAdmin.auth.admin.updateUserById(id, { user_metadata: newMetaData });
  }

  // Auto-create exposant record if role changed to exposant
  if (role === 'exposant') {
    const { data: existingExposant } = await supabaseAdmin
      .from('exposants')
      .select('id')
      .eq('profile_id', id)
      .maybeSingle();

    if (!existingExposant) {
      const exposantName = company || full_name || 'Nouvel Exposant';
      await supabaseAdmin.from('exposants').insert({
        profile_id: id,
        nom: exposantName,
        secteur: sector || null,
        pays: country || null,
        pavillon: pavillon || null,
      });
    }
  }

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: auth.user!.id,
    actor_email: auth.user!.email,
    actor_role: 'admin',
    action: 'update_profiles',
    entity_type: 'profiles',
    entity_id: id,
    metadata: { new: updateData }
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`admin:users:delete:${ip}`, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });

  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');
  const userIdsParam = searchParams.get('ids');
  const deleteExposant = searchParams.get('deleteExposant') !== 'false';

  let userIds: string[] = [];
  if (userId) userIds.push(userId);
  if (userIdsParam) userIds.push(...userIdsParam.split(','));

  if (userIds.length === 0) {
    return NextResponse.json({ error: 'User ID(s) required' }, { status: 400 });
  }

  if (userIds.includes(auth.user!.id)) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  const { error: notifError } = await supabaseAdmin
    .from('notifications')
    .delete()
    .in('profile_id', userIds);

  if (notifError) {
    return NextResponse.json({ error: notifError.message }, { status: 500 });
  }

  const { error: chatMsgError } = await supabaseAdmin
    .from('messages')
    .delete()
    .in('sender_id', userIds);

  if (chatMsgError) {
    return NextResponse.json({ error: chatMsgError.message }, { status: 500 });
  }

  let allConvoIds: string[] = [];
  for (const uid of userIds) {
    const { data: conversations } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .or(`participant_a.eq.${uid},participant_b.eq.${uid}`);
    if (conversations) allConvoIds.push(...conversations.map(c => c.id));
  }

  if (allConvoIds.length > 0) {
    await supabaseAdmin.from('messages').delete().in('conversation_id', allConvoIds);
    await supabaseAdmin.from('conversations').delete().in('id', allConvoIds);
  }

  const { data: exposantData } = await supabaseAdmin
    .from('exposants')
    .select('id')
    .in('profile_id', userIds);

  if (deleteExposant) {
    if (exposantData && exposantData.length > 0) {
      const expIds = exposantData.map((e: any) => e.id);
      await supabaseAdmin.from('produits').delete().in('exposant_id', expIds);
    }
    await supabaseAdmin.from('exposants').delete().in('profile_id', userIds);
  } else {
    await supabaseAdmin.from('exposants').update({ profile_id: null }).in('profile_id', userIds);
  }

  await supabaseAdmin.from('post_comments').delete().in('author_id', userIds);
  await supabaseAdmin.from('post_likes').delete().in('user_id', userIds);
  await supabaseAdmin.from('post_shares').delete().in('user_id', userIds);
  await supabaseAdmin.from('post_reactions').delete().in('user_id', userIds);
  await supabaseAdmin.from('post_saves').delete().in('user_id', userIds);
  await supabaseAdmin.from('posts').delete().in('author_id', userIds);

  for(const uid of userIds) {
    await supabaseAdmin.from('rendez_vous').delete().or(`demandeur_id.eq.${uid},destinataire_id.eq.${uid}`);
    await supabaseAdmin.from('blocked_users').delete().or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`);
    await supabaseAdmin.from('reports').delete().or(`reporter_id.eq.${uid},reported_id.eq.${uid},reviewed_by.eq.${uid}`);
    await supabaseAdmin.from('user_follows').delete().or(`follower_id.eq.${uid},following_id.eq.${uid}`);
  }

  await supabaseAdmin.from('subscriptions' as any).delete().in('profile_id', userIds);
  await supabaseAdmin.from('newsletter_subscriptions').delete().in('profile_id', userIds);

  const { data: userTickets } = await supabaseAdmin.from('support_tickets').select('id').in('profile_id', userIds);
  if (userTickets && userTickets.length > 0) {
    const ticketIds = userTickets.map((t: any) => t.id);
    await supabaseAdmin.from('support_messages' as any).delete().in('ticket_id', ticketIds);
  }
  await supabaseAdmin.from('support_tickets').delete().in('profile_id', userIds);

  await supabaseAdmin.from('user_preferences').delete().in('profile_id', userIds);

  await supabaseAdmin.from('audit_logs').delete().in('actor_id', userIds);
  await supabaseAdmin.from('online_users' as any).delete().in('user_id', userIds);
  await supabaseAdmin.from('platform_config' as any).delete().in('updated_by', userIds);

  const { error: profileDeleteError } = await supabaseAdmin.from('profiles').delete().in('id', userIds);

  if (profileDeleteError) {
    return NextResponse.json({ error: `Erreur suppression profile: ${profileDeleteError.message}` }, { status: 500 });
  }

  for (const uid of userIds) {
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (!deleteError) {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: auth.user!.id,
        actor_email: auth.user!.email,
        actor_role: 'admin',
        action: 'delete_profiles',
        entity_type: 'profiles',
        entity_id: uid,
        metadata: { deleted_user_id: uid }
      });
    }
  }

  return NextResponse.json({ success: true });
}
