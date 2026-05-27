'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

export function TrialBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const { showTrialBanner, trialDaysRemaining, isFreeTrial } = usePermissions();

  useEffect(() => {
    // Ne montrer que si c'est pertinent
    if (showTrialBanner && isFreeTrial) {
      const isDismissed = sessionStorage.getItem('trial_banner_dismissed') === 'true';
      if (!isDismissed) {
        setVisible(true);
      }
    }
  }, [showTrialBanner, isFreeTrial]);

  if (!visible || trialDaysRemaining === null) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('trial_banner_dismissed', 'true');
    setVisible(false);
  };

  const isExpired = trialDaysRemaining < 0;

  return (
    <div className={`relative w-full px-4 py-3 sm:px-6 lg:px-8 text-sm ${
      isExpired ? 'bg-destructive text-destructive-foreground' : 'bg-amber-500 text-amber-950'
    }`}>
      <div className="mx-auto flex flex-col sm:flex-row max-w-7xl sm:items-center justify-between gap-y-3 gap-x-6 pr-8 sm:pr-0">
        <div className="flex items-start sm:items-center gap-x-3">
          <Clock className="size-5 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <p className="font-medium leading-5 sm:leading-6">
            {isExpired ? (
              <strong className="font-semibold">Votre période d'essai gratuit est terminée.</strong>
            ) : trialDaysRemaining === 0 ? (
              <strong className="font-semibold">C'est le dernier jour de votre période d'essai gratuit.</strong>
            ) : (
              <strong className="font-semibold">Il vous reste {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''} d'essai gratuit.</strong>
            )}
            <span className="hidden sm:inline"> Passez à l'abonnement PAID pour conserver un accès illimité à toutes les fonctionnalités.</span>
          </p>
        </div>
        <div className="flex items-center gap-x-4 sm:gap-x-6 shrink-0">
          <Button
            variant={isExpired ? "secondary" : "default"}
            size="sm"
            onClick={() => router.push('/abonnement')}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
              isExpired ? 'bg-white text-destructive hover:bg-white/90' : 'bg-amber-950 text-white hover:bg-amber-900'
            }`}
          >
            S'abonner <ArrowRight className="ml-1 size-3" />
          </Button>
        </div>
      </div>
      <button 
        type="button" 
        onClick={handleDismiss}
        className="absolute right-2 top-2 sm:right-4 sm:top-auto sm:top-1/2 sm:-translate-y-1/2 p-2 hover:bg-black/10 rounded-full transition-colors focus-visible:outline-offset-[-4px]"
      >
        <span className="sr-only">Fermer</span>
        <X className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
