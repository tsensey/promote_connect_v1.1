import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json();
  // TODO: gérer les notifications push FCM depuis les webhooks internes
  return NextResponse.json({ status: 'received', payload });
}
