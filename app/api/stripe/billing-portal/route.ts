import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Le systeme d abonnement est desactive.' },
    { status: 410 }
  );
}
