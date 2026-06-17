/**
 * lib/subscription.ts
 * PROMOTE-CONNECT v1.1 — Gestion des abonnements et accès aux quotas
 *
 * Centralise l'accès à platform_config pour les quotas et messages de conversion.
 * CdC §1, §2, §6
 */

import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

async function getPlatformConfigValue(key: string): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('platform_config')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error || !data) return null;
  return data.value;
}

// ---------------------------------------------------------------------------
// Quotas — récupérés depuis la DB (CdC §1.4)
// ---------------------------------------------------------------------------

/**
 * Récupère tous les quotas configurables depuis platform_config
 * Retourne des valeurs de secours si la DB est inaccessible
 */
export async function getQuotaConfig(): Promise<QuotaConfig> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('platform_config')
    .select('key, value')
    .in('key', [
      'daily_message_limit',
      'total_message_limit',
      'max_posts_free_trial',
      'max_vitrine_offers_free_trial',
      'trial_duration_days',
    ]);

  // Valeurs de secours en cas d'erreur
  const defaults: QuotaConfig = {
    dailyMessageLimit: 10,
    totalMessageLimit: 100,
    maxPostsFreeTrial: 2,
    maxVitrineOffersFreeTrial: 2,
    trialDurationDays: 30,
  };

  if (error || !data) return defaults;

  const configMap = Object.fromEntries(data.map((row) => [row.key, row.value]));

  return {
    dailyMessageLimit: Number(configMap['daily_message_limit'] ?? defaults.dailyMessageLimit),
    totalMessageLimit: Number(configMap['total_message_limit'] ?? defaults.totalMessageLimit),
    maxPostsFreeTrial: Number(configMap['max_posts_free_trial'] ?? defaults.maxPostsFreeTrial),
    maxVitrineOffersFreeTrial: Number(configMap['max_vitrine_offers_free_trial'] ?? defaults.maxVitrineOffersFreeTrial),
    trialDurationDays: Number(configMap['trial_duration_days'] ?? defaults.trialDurationDays),
  };
}

/**
 * Récupère la configuration du fil d'actualité (pondération sponsorisés)
 * CdC §8.2
 */
export async function getFeedConfig(): Promise<FeedConfig> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('platform_config')
    .select('key, value')
    .in('key', [
      'sponsored_weight_ratio',
      'discover_mode_refresh_interval_minutes',
      'sponsored_top_count',
    ]);

  const defaults: FeedConfig = {
    sponsoredWeightRatio: 3,
    discoverRefreshIntervalMinutes: 30,
    sponsoredTopCount: 3,
  };

  if (error || !data) return defaults;

  const configMap = Object.fromEntries(data.map((row) => [row.key, row.value]));

  return {
    sponsoredWeightRatio: Number(configMap['sponsored_weight_ratio'] ?? defaults.sponsoredWeightRatio),
    discoverRefreshIntervalMinutes: Number(configMap['discover_mode_refresh_interval_minutes'] ?? defaults.discoverRefreshIntervalMinutes),
    sponsoredTopCount: Number(configMap['sponsored_top_count'] ?? defaults.sponsoredTopCount),
  };
}

// ---------------------------------------------------------------------------
// Message de conversion — CdC §6.2
// ---------------------------------------------------------------------------

/**
 * Récupère le message de conversion configurable depuis platform_config
 * CdC §6.2 : "entièrement configurable depuis le panneau d'administration"
 */
export async function getConversionMessage(): Promise<ConversionMessage> {
  const value = await getPlatformConfigValue('conversion_message') as Record<string, string> | null;

  const defaults: ConversionMessage = {
    title: 'Débloquez l\'accès complet à PROMOTE-CONNECT',
    body: 'Passez à l\'abonnement PAID pour accéder à toutes les fonctionnalités : messagerie illimitée, annuaire complet, rendez-vous d\'affaires et plus encore.',
    priceDisplay: '100 000 F CFA / an',
    phone: '+229 XX XX XX XX',
    email: 'contact@promote-benin.com',
    ctaUrl: null,
    ctaLabel: 'Contacter l\'équipe PROMOTE',
  };

  if (!value || typeof value !== 'object') return defaults;

  return {
    title: String(value.title ?? defaults.title),
    body: String(value.body ?? defaults.body),
    priceDisplay: String(value.price_display ?? defaults.priceDisplay),
    phone: String(value.phone ?? defaults.phone),
    email: String(value.email ?? defaults.email),
    ctaUrl: value.cta_url ? String(value.cta_url) : null,
    ctaLabel: String(value.cta_label ?? defaults.ctaLabel),
  };
}

// ---------------------------------------------------------------------------
// Vérification de l'état du compte — CdC §1, §3
// ---------------------------------------------------------------------------

/**
 * Vérifie le tier d'abonnement d'un utilisateur depuis la DB
 */
export async function getSubscriptionTier(
  userId: string
): Promise<'free_trial' | 'paid' | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return (data.subscription_tier as 'free_trial' | 'paid') ?? 'free_trial';
}

/**
 * Vérifie le statut du compte d'un utilisateur depuis la DB
 */
export async function getAccountStatus(
  userId: string
): Promise<'active' | 'suspended' | 'blocked' | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return (data.account_status as 'active' | 'suspended' | 'blocked') ?? 'active';
}

// ---------------------------------------------------------------------------
// Bannière fin d'essai — CdC §4.1, §6.1
// ---------------------------------------------------------------------------

/**
 * Retourne true si la bannière de fin d'essai doit être affichée (J-3 ou expirée)
 * CdC §4.1 : "Fin de free trial imminente (à J-3) — Bannière in-app"
 * CdC §6.1 : "La date de fin d'essai est dans les 3 jours ou déjà dépassée"
 */
export function shouldShowTrialBanner(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false;
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  // Afficher si expire dans 3 jours ou moins (y compris déjà expirée)
  return diffDays <= 3;
}

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

// ---------------------------------------------------------------------------
// Vérification de quota côté serveur — CdC §2.2
// ---------------------------------------------------------------------------

/**
 * Vérifie si un utilisateur free trial peut envoyer un message
 * Doit être appelé côté serveur (API route) — jamais côté client
 *
 * Retourne { allowed: true } ou { allowed: false, reason: string }
 * N'incrémente PAS le compteur — appeler incrementMessageCount() après insert réussi
 */
export async function checkMessageQuota(
  senderId: string,
  conversationId: string
): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: number;
  dailyLimit?: number;
  currentCount?: number;
  isSameDay?: boolean;
  lastExchangeReset?: string | null;
}> {
  // Utiliser le client admin pour contourner les restrictions RLS sur profiles
  const adminClient = createAdminClient();
  const supabase = await createClient();

  // 1. Vérifier le tier de l'expéditeur
  const { data: rawSenderProfile } = await adminClient
    .from('profiles')
    .select('role, subscription_tier, account_status, daily_exchange_count, last_exchange_reset, quota_override_messages, subscription_ends_at')
    .eq('id', senderId)
    .single();

  if (!rawSenderProfile) {
    return { allowed: false, reason: 'profile_not_found' };
  }

  const senderProfile = rawSenderProfile as unknown as {
    role: string | null;
    subscription_tier: string | null;
    account_status: string | null;
    daily_exchange_count: number | null;
    last_exchange_reset: string | null;
    quota_override_messages: number | null;
    subscription_ends_at: string | null;
  };

  // Vérifier que le compte est actif
  if (senderProfile.account_status !== 'active') {
    return { allowed: false, reason: 'account_inactive' };
  }

  // Les PAID et admins peuvent toujours envoyer — mais vérifier que l'abonnement est valide pour les PAID
  if (senderProfile.subscription_tier?.toLowerCase() === 'paid' || senderProfile.role === 'admin') {
    if (senderProfile.subscription_ends_at && new Date(senderProfile.subscription_ends_at) < new Date()) {
      // La date de fin est dépassée → traiter comme free_trial
      // (ne pas return early, laisser le code continuer vers la logique free_trial)
    } else {
      return { allowed: true };
    }
  }

  // 2. Pour les free trial — vérifier si l'autre participant est PAID (CdC §2.1)
  const { data: conversation } = await supabase
    .from('conversations')
    .select('participant_a, participant_b')
    .eq('id', conversationId)
    .single();

  const otherParticipantId = conversation?.participant_a === senderId ? conversation?.participant_b : conversation?.participant_a;
  
  if (otherParticipantId) {
    const { data: otherProfile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', otherParticipantId)
      .single();
      
    if (otherProfile?.subscription_tier === 'paid') {
      return { allowed: true };
    }
  }

  // 3. Vérifier le quota total depuis platform_config (CdC §1.2)
  const quotaConfig = await getQuotaConfig();

  const { count: totalSent } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', senderId);

  if (totalSent !== null && totalSent >= quotaConfig.totalMessageLimit) {
    return {
      allowed: false,
      reason: 'total_quota_exceeded',
      remaining: 0,
    };
  }

  // 4. Vérifier le quota journalier via comptage réel (comme la RLS)
  //    On utilise la même logique que get_user_message_count() côté PostgreSQL
  //    pour garantir la cohérence avec l'insertion réelle. CdC §1.3
  const dailyLimit = senderProfile.quota_override_messages ?? quotaConfig.dailyMessageLimit;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: dailyCount } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', senderId)
    .gte('created_at', todayStart.toISOString());

  const currentCount = dailyCount ?? 0;

  if (currentCount >= dailyLimit) {
    return {
      allowed: false,
      reason: 'daily_quota_exceeded',
      remaining: 0,
      dailyLimit,
      currentCount,
    };
  }

  return {
    allowed: true,
    remaining: dailyLimit - currentCount,
    dailyLimit,
    currentCount,
    isSameDay: true,
    lastExchangeReset: senderProfile.last_exchange_reset,
  };
}

/**
 * Incrémente le compteur daily_exchange_count après envoi réussi d'un message
 * Doit être appelée UNIQUEMENT après confirmation de l'insertion dans messages
 */
export async function incrementMessageCount(
  senderId: string,
  currentCount: number,
  isSameDay: boolean,
  lastExchangeReset: string | null
): Promise<void> {
  const supabase = await createClient();
  const newCount = currentCount + 1;
  const now = new Date();
  await supabase
    .from('profiles')
    .update({
      daily_exchange_count: newCount,
      last_exchange_reset: isSameDay ? lastExchangeReset : now.toISOString(),
    })
    .eq('id', senderId);
}

/**
 * Vérifie si un free trial peut publier un post (max selon platform_config)
 * CdC §1.2, §8
 */
export async function checkPostQuota(
  userId: string
): Promise<{ allowed: boolean; currentCount?: number; limit?: number }> {
  // Utiliser le client admin pour contourner les restrictions RLS sur profiles
  const adminClient = createAdminClient();
  const supabase = await createClient();

  const { data: rawProfile } = await adminClient
    .from('profiles')
    .select('role, subscription_tier, quota_override_posts')
    .eq('id', userId)
    .single();

  if (!rawProfile) return { allowed: false };

  const profile = rawProfile as unknown as {
    role: string | null;
    subscription_tier: string | null;
    quota_override_posts: number | null;
  };

  // Les PAID et admins n'ont pas de limite
  if (profile.subscription_tier?.trim().toLowerCase() === 'paid' || profile.role === 'admin') return { allowed: true };

  const quotaConfig = await getQuotaConfig();
  const limit = profile.quota_override_posts ?? quotaConfig.maxPostsFreeTrial;

  // Compter les posts actifs de l'utilisateur
  const { count } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId);

  const currentCount = count ?? 0;

  return {
    allowed: currentCount < limit,
    currentCount,
    limit,
  };
}

/**
 * Vérifie si un free trial peut publier une offre vitrine (max selon platform_config)
 * CdC §1.2, §9.1
 */
export async function checkVitrineQuota(
  exposantId: string,
  userId: string
): Promise<{ allowed: boolean; currentCount?: number; limit?: number }> {
  // Utiliser le client admin pour contourner les restrictions RLS sur profiles
  const adminClient = createAdminClient();
  const supabase = await createClient();

  const { data: rawProfile } = await adminClient
    .from('profiles')
    .select('role, subscription_tier, quota_override_vitrine')
    .eq('id', userId)
    .single();

  if (!rawProfile) return { allowed: false };

  const profile = rawProfile as unknown as {
    role: string | null;
    subscription_tier: string | null;
    quota_override_vitrine: number | null;
  };

  // Les PAID et admins n'ont pas de limite
  if (profile.subscription_tier?.trim().toLowerCase() === 'paid' || profile.role === 'admin') return { allowed: true };

  const quotaConfig = await getQuotaConfig();
  const limit = profile.quota_override_vitrine ?? quotaConfig.maxVitrineOffersFreeTrial;

  // Compter les offres actives de l'exposant
  const { count } = await supabase
    .from('produits')
    .select('id', { count: 'exact', head: true })
    .eq('exposant_id', exposantId);

  const currentCount = count ?? 0;

  return {
    allowed: currentCount < limit,
    currentCount,
    limit,
  };
}
