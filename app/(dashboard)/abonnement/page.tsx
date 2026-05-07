'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { CreditCard, Check, ArrowRight, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const ANNUAL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL || 'price_test_annual';

interface Subscription {
  id: string;
  status: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      const { data: session } = await supabaseClient.auth.getSession();
      if (!session.session?.user) return;

      const { data } = await supabaseClient
        .from('subscriptions')
        .select('*')
        .eq('profile_id', session.session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) setSubscription(data);
    };

    fetchSubscription();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: session } = await supabaseClient.auth.getSession();
      if (!session.session?.user) {
        setError('Vous devez etre connecte pour vous abonner');
        setLoading(false);
        return;
      }

      const token = session.session.access_token;

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId: ANNUAL_PRICE_ID }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data: session } = await supabaseClient.auth.getSession();
      if (!session.session?.user) {
        toast.error('Vous devez etre connecte');
        return;
      }

      const token = session.session.access_token;

      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ returnUrl: window.location.origin + '/abonnement' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      toast.error('Erreur lors de l ouverture du portail de facturation');
    } finally {
      setPortalLoading(false);
    }
  };

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const expiresAt = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <main className="min-h-screen bg-muted px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <Card className="p-4 rounded-lg">
          <h1 className="text-2xl font-semibold text-slate-900">Abonnement PROMOTE-CONNECT</h1>
          <p className="mt-2 text-muted-foreground">
            Accedez a toutes les fonctionnalites pendant 12 mois apres le salon.
          </p>
        </Card>

        {isActive && (
          <Card className="p-4 rounded-lg border-green-200 bg-green-50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-green-900">Abonnement actif</h2>
                {expiresAt && <p className="text-sm text-green-700">Expire le {expiresAt}</p>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="border-green-300 bg-transparent hover:bg-green-100"
              >
                <Settings className="mr-2 h-4 w-4" />
                {portalLoading ? 'Ouverture...' : 'Gerer'}
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-4 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Annuel</h2>
              <p className="mt-1 text-muted-foreground">Acces complet pendant 12 mois</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">49 EUR</span>
                <span className="text-muted-foreground">/an</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              Populaire
            </Badge>
          </div>

          <ul className="mt-6 space-y-2">
            {[
              'Annuaire complet des exposants',
              'Chat prive en temps reel',
              'Agenda interactif et RDV B2B',
              'Vitrine produits/services',
              'Newsletters personnalisees',
              'Support technique prioritaire',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-slate-700">
                <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="mt-6 w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirection...
              </>
            ) : isActive ? (
              <>
                Gerer mon abonnement
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                S'abonner maintenant
              </>
            )}
          </Button>
        </Card>
      </div>
    </main>
  );
}
