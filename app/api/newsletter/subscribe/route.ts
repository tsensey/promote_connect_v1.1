import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { render } from '@react-email/components';
import { createClient } from '@supabase/supabase-js';
import { resend } from '@/lib/resend/client';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import WelcomeEmail from '@/emails/WelcomeEmail';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

function generateToken(): string {
  return crypto.randomUUID();
}

function isValidEmail(email: unknown): email is string {
  return typeof email === 'string'
    && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function normalizeFrequency(value: unknown): 'daily' | 'weekly' | 'monthly' {
  return value === 'daily' || value === 'monthly' ? value : 'weekly';
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, remaining } = rateLimit(`newsletter:subscribe:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } },
    );
  }

  try {
    const { email, sectors, frequency } = await request.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;
    const normalizedSectors = normalizeStringArray(sectors);
    const normalizedFrequency = normalizeFrequency(frequency);

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
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
        },
      );

      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user) profileId = user.id;
    }

    const unsubscribeToken = generateToken();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const supabaseAdmin = createAdminClient();

    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .select('id, unsubscribe_token')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('newsletter_subscriptions')
        .update({
          profile_id: profileId,
          sectors: normalizedSectors,
          frequency: normalizedFrequency,
          is_active: true,
          unsubscribe_token: existing.unsubscribe_token || unsubscribeToken,
        })
        .eq('email', normalizedEmail);

      return NextResponse.json({ message: 'Subscription updated' });
    }

    await supabaseAdmin.from('newsletter_subscriptions').insert({
      profile_id: profileId,
      email: normalizedEmail,
      sectors: normalizedSectors,
      frequency: normalizedFrequency,
      is_active: true,
      unsubscribe_token: unsubscribeToken,
    });

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'newsletter@promote-connect.com';
    const fromName = process.env.RESEND_FROM_NAME || 'PROMOTE-CONNECT';
    const unsubscribeUrl = `${appUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

    const emailHtml = await render(
      WelcomeEmail({
        email: normalizedEmail,
        frequency: normalizedFrequency,
        sectors: normalizedSectors,
        unsubscribeUrl,
      }),
    );

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [normalizedEmail],
      subject: 'Bienvenue a la newsletter PROMOTE-CONNECT',
      html: emailHtml,
    });

    return NextResponse.json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ip = getClientIp(request);
  const { allowed, remaining } = rateLimit(`newsletter:unsubscribe:${ip}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } },
    );
  }

  try {
    const { email } = await request.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const supabase = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.email?.toLowerCase() !== normalizedEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    await supabaseAdmin
      .from('newsletter_subscriptions')
      .update({ is_active: false })
      .eq('email', normalizedEmail);

    return NextResponse.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
