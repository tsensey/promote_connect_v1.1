export interface QuotaConfig {
  dailyMessageLimit: number;
  totalMessageLimit: number;
  maxPostsFreeTrial: number;
  maxVitrineOffersFreeTrial: number;
  trialDurationDays: number;
}

export interface ConversionMessage {
  title: string;
  body: string;
  priceDisplay: string;
  phone: string;
  email: string;
  ctaUrl: string | null;
  ctaLabel: string;
}

export interface FeedConfig {
  sponsoredWeightRatio: number;
  discoverRefreshIntervalMinutes: number;
  sponsoredTopCount: number;
}

/**
 * Retourne true si la bannière de fin d'essai doit être affichée (J-3 ou expirée)
 * CdC §4.1 : "Fin de free trial imminente (à J-3) — Bannière in-app"
 * CdC §6.1 : "La date de fin d'essai est dans les 3 jours ou déjà dépassée"
 *
 * Ré-exporté depuis lib/subscription.ts pour éviter la duplication.
 * La logique unifiée : affiche si J-3 ou moins (incluant expiré).
 */
export { shouldShowTrialBanner } from '@/lib/subscription';

/**
 * Retourne le nombre de jours restants dans le trial (peut être négatif si expiré)
 */
export function getTrialDaysRemaining(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
