import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Le webhook Stripe est desactive car le systeme d abonnement n est plus utilise.' },
    { status: 410 }
  );
}
