import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import { randomBytes } from 'crypto';
import { render } from '@react-email/components';
import ResetPasswordEmail from '@/emails/ResetPasswordEmail';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const resendApiKey = process.env.RESEND_API_KEY || '';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`admin:reset-password:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
  }

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

  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user_id);
  const currentMetadata = userData?.user?.user_metadata || {};

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user_id,
    { 
      password: newPassword,
      user_metadata: { ...currentMetadata, temporary_password: true }
    }
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

      const emailHtml = await render(
        ResetPasswordEmail({
          fullName,
          password: newPassword,
        })
      );

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [email],
        subject: 'Votre mot de passe a été réinitialisé — PROMOTE-CONNECT',
        html: emailHtml,
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
