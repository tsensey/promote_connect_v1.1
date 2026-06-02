import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { render } from '@react-email/components';
import ForgotPasswordEmail from '@/emails/ForgotPasswordEmail';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`forgot-password:${ip}`, 3, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    if (linkError) {
      console.error('Error generating recovery link:', linkError.message);
      return NextResponse.json({ success: true });
    }

    let fullName = 'Utilisateur';
    if (linkData?.user?.id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', linkData.user.id)
        .single();

      if (profile?.full_name) {
        fullName = profile.full_name;
      }
    }

    const actionLink = linkData.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 });
    }

    const resendApiKey = process.env.RESEND_API_KEY || '';
    if (resendApiKey) {
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);

      const emailHtml = await render(
        ForgotPasswordEmail({
          fullName,
          actionLink,
        })
      );

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [email],
        subject: 'Réinitialisation de votre mot de passe — PROMOTE-CONNECT',
        html: emailHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
