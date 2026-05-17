import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import { randomBytes } from 'crypto';

const resendApiKey = process.env.RESEND_API_KEY || '';

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const user_id = body.user_id as string | undefined;
  const send_email = body.send_email as boolean | undefined;

  if (!user_id) {
    return NextResponse.json({ error: 'user_id requis' }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  const newPassword = randomBytes(9).toString('base64url').slice(0, 12);

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user_id,
    { password: newPassword }
  );

  if (updateError) {
    return NextResponse.json(
      { error: `Erreur mise à jour mot de passe: ${updateError.message}` },
      { status: 500 }
    );
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', user_id)
    .single();

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user_id);
  const email = authUser?.user?.email || '';
  const fullName = profile?.full_name || email;

  let emailSent = false;

  if (send_email !== false && resendApiKey && email) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [email],
        subject: 'Votre mot de passe a été réinitialisé — PROMOTE-CONNECT',
        html: `
          <div style="margin:0;background:#eef4ff;padding:32px 16px;font-family:Arial,sans-serif;color:#172554">
            <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 30px 80px rgba(15,23,42,0.12)">
              <div style="padding:36px;background:#2563eb;color:#ffffff">
                <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;opacity:0.78">PROMOTE-CONNECT</p>
                <h1 style="margin:0;font-size:30px;line-height:1.2">Mot de passe réinitialisé</h1>
              </div>
              <div style="padding:32px">
                <h2 style="margin:0 0 14px;font-size:22px;color:#0f172a">Bonjour, ${fullName}</h2>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475569">
                  Votre mot de passe a été réinitialisé par un administrateur.
                </p>
                <div style="border:1px solid #dbeafe;background:#f8fbff;border-radius:22px;padding:22px;margin-bottom:24px">
                  <p style="margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#64748b">Nouveau mot de passe</p>
                  <p style="display:inline-block;margin:0;padding:10px 14px;border-radius:14px;background:#0f172a;color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.04em">
                    ${newPassword}
                  </p>
                </div>
                <a href="${appUrl}/login" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700">
                  Se connecter à PROMOTE-CONNECT
                </a>
                <p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:#64748b">
                  Pour des raisons de sécurité, nous vous recommandons de changer ce mot de passe lors de votre prochaine connexion.
                </p>
              </div>
            </div>
          </div>
        `,
      });
      emailSent = true;
    } catch {
      // Email non critique
    }
  }

  return NextResponse.json({
    success: true,
    email_sent: emailSent,
  });
}
