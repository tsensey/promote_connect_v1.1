import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const resendApiKey = process.env.RESEND_API_KEY || '';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }

  const token = authHeader.split('Bearer ')[1];
  const supabase = createAdminClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }), user: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }), user: null };
  }

  return { error: null, user };
}

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const supabase = createAdminClient();
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, company, role, sector, country, pavillon, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json();
  const {
    full_name,
    email,
    company,
    role,
    sector,
    country,
    pavillon,
    generate_exposant,
  } = body;

  if (!full_name || !email || !role) {
    return NextResponse.json(
      { error: 'full_name, email et role sont requis' },
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
      subscription_status: 'active',
      subscription_ends_at: null,
    });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: `Erreur creation profile: ${profileError.message}` },
      { status: 500 }
    );
  }

  if (generate_exposant && role === 'exposant') {
    const { data: existingExposant } = await supabaseAdmin
      .from('exposants')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (existingExposant?.id) {
      await supabaseAdmin
        .from('exposants')
        .update({
          nom: company || full_name,
          secteur: sector || null,
          pavillon: pavillon || null,
          pays: country || null,
        })
        .eq('id', existingExposant.id);
    } else {
      await supabaseAdmin.from('exposants').insert({
        profile_id: userId,
        nom: company || full_name,
        secteur: sector || null,
        pavillon: pavillon || null,
        pays: country || null,
      });
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
        subject: 'Vos acces PROMOTE-CONNECT',
        html: buildCredentialsHtml({
          fullName: full_name,
          email,
          password,
          role,
        }),
      });

      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send credentials email:', emailError);
    }
  }

  return NextResponse.json({
    success: true,
    user_id: userId,
    email_sent: emailSent,
    temporary_password: password,
  });
}

export async function DELETE(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  if (userId === auth.user!.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  let password = '';

  for (let index = 0; index < 12; index += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}

function buildCredentialsHtml({
  fullName,
  email,
  password,
  role,
}: {
  fullName: string;
  email: string;
  password: string;
  role: string;
}) {
  const loginUrl = `${appUrl}/login`;

  return `
    <div style="margin:0;background:#eef4ff;padding:32px 16px;font-family:Arial,sans-serif;color:#172554">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 30px 80px rgba(15,23,42,0.12)">
        <div style="padding:36px;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 48%,#0f172a 100%);color:#ffffff">
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
              ${role === 'admin' ? 'Administrateur' : role === 'exposant' ? 'Exposant' : 'Visiteur'}
            </p>
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
