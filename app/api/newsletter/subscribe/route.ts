import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend/client';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      await supabaseAdmin
        .from('newsletter_subscriptions')
        .update({
          sectors: sectors || [],
          frequency: frequency || 'weekly',
          is_active: true,
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
    });

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'newsletter@promote-connect.com';
    const fromName = process.env.RESEND_FROM_NAME || 'PROMOTE-CONNECT';

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      subject: 'Bienvenue a la newsletter PROMOTE-CONNECT',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0f172a; font-size: 24px;">Bienvenue !</h1>
          <p style="color: #475569; line-height: 1.6;">
            Vous etes maintenant inscrit a la newsletter PROMOTE-CONNECT.
            Vous recevrez les dernieres actualites et opportunites d'affaires.
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Frequence : ${frequency || 'Hebdomadaire'}<br />
            Secteurs : ${(sectors || []).join(', ') || 'Tous'}
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">
            PROMOTE-CONNECT - communaute professionnelle du salon
          </p>
        </div>
      `,
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
