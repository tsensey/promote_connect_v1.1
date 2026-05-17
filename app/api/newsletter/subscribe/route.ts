import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { renderToString } from 'react-dom/server';
import { createClient } from '@supabase/supabase-js';
import { resend } from '@/lib/resend/client';
import WelcomeEmail from '@/emails/WelcomeEmail';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function generateToken(): string {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  try {
    const { email, sectors, frequency } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    let profileId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const supabase = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user) profileId = user.id;
    }

    const unsubscribeToken = generateToken();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .select('id, unsubscribe_token')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('newsletter_subscriptions')
        .update({
          profile_id: profileId,
          sectors: sectors || [],
          frequency: frequency || 'weekly',
          is_active: true,
          unsubscribe_token: existing.unsubscribe_token || unsubscribeToken,
        })
        .eq('email', email);

      return NextResponse.json({ message: 'Subscription updated' });
    }

    await supabaseAdmin.from('newsletter_subscriptions').insert({
      profile_id: profileId,
      email,
      sectors: sectors || [],
      frequency: frequency || 'weekly',
      is_active: true,
      unsubscribe_token: unsubscribeToken,
    });

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'newsletter@promote-connect.com';
    const fromName = process.env.RESEND_FROM_NAME || 'PROMOTE-CONNECT';
    const unsubscribeUrl = `${appUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

    const emailHtml = renderToString(
      WelcomeEmail({
        email,
        frequency: frequency || 'weekly',
        sectors: sectors || [],
        unsubscribeUrl,
      })
    );

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      subject: 'Bienvenue à la newsletter PROMOTE-CONNECT',
      html: emailHtml,
    });

    return NextResponse.json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await supabaseAdmin
      .from('newsletter_subscriptions')
      .update({ is_active: false })
      .eq('email', email);

    return NextResponse.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
