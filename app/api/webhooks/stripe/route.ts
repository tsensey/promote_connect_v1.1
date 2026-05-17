import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import type { Database } from '@/types/database.types';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-04-22.dahlia',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sb = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const processedEvents = new Set<string>();
const IDEMPOTENCY_TTL = 300_000;

setInterval(() => processedEvents.clear(), IDEMPOTENCY_TTL);

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

  if (processedEvents.has(event.id)) {
    return NextResponse.json({ received: true, deduplicated: true });
  }
  processedEvents.add(event.id);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const profileId = session.metadata?.profile_id;

        if (!profileId) {
          return NextResponse.json({ error: 'Missing profile_id in session metadata' }, { status: 400 });
        }

        let subscriptionStatus = 'active';
        let periodEnd: string | null = null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Record<string, unknown>;
          subscriptionStatus = sub.status as string;
          const rawEnd = sub.current_period_end as number | undefined;
          periodEnd = rawEnd ? new Date(rawEnd * 1000).toISOString() : null;
        }

        await sb.from('profiles').update({
          subscription_status: subscriptionStatus,
          subscription_ends_at: periodEnd,
          stripe_customer_id: customerId,
        } as never).eq('id', profileId);

        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as unknown as Record<string, unknown>;
        const customerId = sub.customer as string;
        const rawEnd = sub.current_period_end as number | undefined;
        const periodEnd = rawEnd
          ? new Date(rawEnd * 1000).toISOString()
          : null;

        const { data: existing } = await sb
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id' as never, customerId as never)
          .maybeSingle();

        if (!existing) {
          console.warn('No profile found for Stripe customer:', customerId);
          break;
        }

        await sb.from('profiles').update({
          subscription_status: sub.status as string,
          subscription_ends_at: periodEnd,
        } as never).eq('id', existing.id);

        break;
      }

      case 'customer.subscription.deleted': {
        const deletedSub = event.data.object as unknown as Record<string, unknown>;
        const deletedCustomerId = deletedSub.customer as string;

        const { data: existing } = await sb
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id' as never, deletedCustomerId as never)
          .maybeSingle();

        if (!existing) break;

        await sb.from('profiles').update({
          subscription_status: 'expired',
          subscription_ends_at: null,
        } as never).eq('id', existing.id);

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceCustomerId = invoice.customer as string;

        const { data: existing } = await sb
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id' as never, invoiceCustomerId as never)
          .maybeSingle();

        if (existing) {
          await sb.from('profiles').update({
            subscription_status: 'past_due',
          } as never).eq('id', existing.id);
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
