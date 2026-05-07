import { NextResponse } from 'next/server';
import { createBillingPortalSession } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const supabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(
      await getUserIdFromToken(token)
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    const body = await request.json();
    const returnUrl = body?.returnUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await createBillingPortalSession(profile.stripe_customer_id, returnUrl);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 });
  }
}

async function getUserIdFromToken(token: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('Invalid token');
  return data.user.id;
}
