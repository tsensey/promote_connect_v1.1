import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@supabase/supabase-js';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          customer: string;
          subscription: string;
          metadata?: { profile_id?: string };
        };

        if (session.metadata?.profile_id) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'active',
              subscription_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', session.metadata.profile_id);
        }

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as {
          id: string;
          customer: string;
          status: string;
          current_period_end: number;
        };

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (profile) {
          let subStatus = subscription.status;
          if (subStatus === 'active' || subStatus === 'trialing') {
            await supabaseAdmin
              .from('profiles')
              .update({
                subscription_status: subStatus === 'trialing' ? 'trial' : 'active',
                subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq('id', profile.id);
          } else if (subStatus === 'canceled' || subStatus === 'unpaid') {
            await supabaseAdmin
              .from('profiles')
              .update({ subscription_status: subStatus === 'canceled' ? 'expired' : 'past_due' })
              .eq('id', profile.id);
          }
        }

        let subData = {
          stripe_customer_id: subscription.customer,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        };

        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (existingSub) {
          await supabaseAdmin
            .from('subscriptions')
            .update(subData)
            .eq('id', existingSub.id);
        } else {
          await supabaseAdmin
            .from('subscriptions')
            .insert({
              ...subData,
              profile_id: profile?.id || null,
            });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as {
          id: string;
          customer: string;
        };

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (profile) {
          await supabaseAdmin
            .from('profiles')
            .update({ subscription_status: 'expired' })
            .eq('id', profile.id);
        }

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as {
          customer: string;
          subscription: string;
        };

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', invoice.customer)
          .single();

        if (profile) {
          await supabaseAdmin
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', profile.id);
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
