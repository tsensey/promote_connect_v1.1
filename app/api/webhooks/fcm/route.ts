import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

async function sendFcmNotification(token: string, payload: { title: string; body: string; url?: string }) {
  const fcmServerKey = process.env.FCM_SERVER_KEY;
  if (!fcmServerKey) {
    console.warn('FCM_SERVER_KEY not configured, skipping push notification');
    return null;
  }

  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${fcmServerKey}`,
    },
    body: JSON.stringify({
      to: token,
      notification: {
        title: payload.title,
        body: payload.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
      },
      data: {
        url: payload.url || '/feed',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('FCM send failed:', response.status, errorText);
  }

  return response.json();
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, remaining } = rateLimit(`fcm:${ip}`, 60, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } },
    );
  }

  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const payload = await request.json();
    const { token, title, body, url } = payload;

    if (!token || !title || !body) {
      return NextResponse.json({ error: 'token, title and body are required' }, { status: 400 });
    }

    const result = await sendFcmNotification(token, { title, body, url });

    return NextResponse.json({ status: 'sent', result });
  } catch (error) {
    console.error('FCM webhook error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
