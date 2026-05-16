import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const profileId = session.metadata?.profile_id;
      if (!profileId) {
        return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 });
      }

      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      await supabase.from('subscriptions').upsert({
        profile_id: profileId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      });

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('id', profileId);

      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('profile_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (!sub?.profile_id) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_end: periodEnd,
        })
        .eq('stripe_subscription_id', subscriptionId);

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_ends_at: periodEnd,
        })
        .eq('id', sub.profile_id);
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subEvent = event.data.object as Stripe.Subscription;

      const { data: existing } = await supabase
        .from('subscriptions')
        .select('profile_id')
        .eq('stripe_subscription_id', subEvent.id)
        .single();

      if (!existing?.profile_id) break;

      const subStatus = subEvent.status === 'active' || subEvent.status === 'trialing' ? 'active' : 'expired';

      await supabase
        .from('subscriptions')
        .update({
          status: subEvent.status,
          current_period_end: new Date(subEvent.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', subEvent.id);

      await supabase
        .from('profiles')
        .update({
          subscription_status: subStatus,
          subscription_ends_at: new Date(subEvent.current_period_end * 1000).toISOString(),
        })
        .eq('id', existing.profile_id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
