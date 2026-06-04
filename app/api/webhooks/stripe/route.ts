import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

function shouldDowngrade(status: string): boolean {
  return ['past_due', 'canceled', 'incomplete_expired', 'unpaid'].includes(status);
}

async function isEventProcessed(sb: ReturnType<typeof createAdminClient>, eventId: string): Promise<boolean> {
  const { data } = await (sb.from('webhook_events' as never) as any)
    .select('status')
    .eq('event_id', eventId)
    .maybeSingle();

  if (!data) return false;
  return data.status === 'completed';
}

async function markEventProcessing(sb: ReturnType<typeof createAdminClient>, eventId: string): Promise<boolean> {
  const { error } = await (sb.from('webhook_events' as never) as any)
    .insert({ event_id: eventId, source: 'stripe', status: 'processing' });

  if (error) {
    if (error.code === '23505') return false;
    return false;
  }
  return true;
}

async function markEventCompleted(sb: ReturnType<typeof createAdminClient>, eventId: string): Promise<void> {
  await (sb.from('webhook_events' as never) as any)
    .update({ status: 'completed' })
    .eq('event_id', eventId);
}

async function markEventFailed(sb: ReturnType<typeof createAdminClient>, eventId: string): Promise<void> {
  await (sb.from('webhook_events' as never) as any)
    .update({ status: 'failed' })
    .eq('event_id', eventId);
}

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

  const sb = createAdminClient();

  if (await isEventProcessed(sb, event.id)) {
    return NextResponse.json({ received: true, deduplicated: true });
  }

  if (!(await markEventProcessing(sb, event.id))) {
    return NextResponse.json({ received: true, deduplicated: true });
  }

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

        const tier = shouldDowngrade(subscriptionStatus) ? 'free_trial' : 'paid';

        await sb.from('profiles').update({
          subscription_status: subscriptionStatus,
          subscription_ends_at: periodEnd,
          stripe_customer_id: customerId,
          subscription_tier: tier,
        } as never).eq('id', profileId);

        await sb.auth.admin.updateUserById(profileId, {
          user_metadata: {
            subscription_tier: tier,
            subscription_status: subscriptionStatus,
          },
        });

        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as unknown as Record<string, unknown>;
        const customerId = sub.customer as string;
        const rawEnd = sub.current_period_end as number | undefined;
        const periodEnd = rawEnd ? new Date(rawEnd * 1000).toISOString() : null;

        const { data: existing } = await sb
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id' as never, customerId as never)
          .maybeSingle();

        if (!existing) {
          console.warn('No profile found for Stripe customer:', customerId);
          break;
        }

        const status = sub.status as string;
        const tier = shouldDowngrade(status) ? 'free_trial' : 'paid';

        await sb.from('profiles').update({
          subscription_status: status,
          subscription_ends_at: periodEnd,
          subscription_tier: tier,
        } as never).eq('id', existing.id);

        await sb.auth.admin.updateUserById(existing.id, {
          user_metadata: {
            subscription_tier: tier,
            subscription_status: status,
          },
        });

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
          subscription_tier: 'free_trial',
        } as never).eq('id', existing.id);

        await sb.auth.admin.updateUserById(existing.id, {
          user_metadata: {
            subscription_tier: 'free_trial',
            subscription_status: 'expired',
          },
        });

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const invoiceCustomerId = invoice.customer as string;

        const { data: existing } = await sb
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id' as never, invoiceCustomerId as never)
          .maybeSingle();

        if (existing) {
          await sb.from('profiles').update({
            subscription_status: 'past_due',
            subscription_tier: 'free_trial',
          } as never).eq('id', existing.id);

          await sb.auth.admin.updateUserById(existing.id, {
            user_metadata: {
              subscription_tier: 'free_trial',
              subscription_status: 'past_due',
            },
          });
        }

        break;
      }
    }

    await markEventCompleted(sb, event.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    await markEventFailed(sb, event.id).catch(() => {});
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
