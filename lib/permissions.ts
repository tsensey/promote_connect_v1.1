/**
 * lib/permissions.ts
 * PROMOTE-CONNECT v1.1 — Système centralisé de vérification des droits
 *
 * Basé sur subscription_tier ('free_trial' | 'paid') et account_status ('active' | 'suspended' | 'blocked')
 * CdC §1 — Gestion des abonnements et des droits d'accès
 *
 * IMPORTANT: Les quotas (limites numériques) ne sont plus codés en dur ici.
 * Ils doivent être récupérés depuis lib/subscription.ts → platform_config (DB).
 */

export type SubscriptionTier = 'free_trial' | 'paid';
export type AccountStatus = 'active' | 'suspended' | 'blocked';
export type UserRole = 'visiteur' | 'exposant' | 'admin';
export type BlockType = 'messages' | 'rdv' | 'complete';

export interface PermissionUser {
  id?: string;
  role: UserRole | string | null;
  subscription_tier?: SubscriptionTier | string | null;
  account_status?: AccountStatus | string | null;
  is_active?: boolean | null;
}

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

function isPaid(user: PermissionUser): boolean {
  if (user.role === 'admin') return true;
  return user.subscription_tier === 'paid';
}

function isActive(user: PermissionUser): boolean {
  if (user.account_status) return user.account_status === 'active';
  // Fallback legacy is_active
  return user.is_active !== false;
}

function isAdmin(user: PermissionUser): boolean {
  return user.role === 'admin';
}

// ---------------------------------------------------------------------------
// Permissions de base — accessibles à tous les comptes actifs
// ---------------------------------------------------------------------------

/** Peut lire le fil d'actualité */
export function canReadFeed(user: PermissionUser): boolean {
  return isActive(user);
}

/** Peut lire le programme du salon */
export function canReadAgenda(user: PermissionUser): boolean {
  return isActive(user);
}

/** Peut voir la vitrine produits (vue publique) */
export function canViewVitrine(user: PermissionUser): boolean {
  return isActive(user);
}

// ---------------------------------------------------------------------------
// Permissions réservées aux abonnés PAID — CdC §1.2
// ---------------------------------------------------------------------------

/**
 * Peut accéder à l'annuaire complet des contacts
 * CdC §1.2 : "Accès à l'annuaire des contacts — Non [free trial] / Oui [PAID]"
 */
export function canAccessDirectory(user: PermissionUser): boolean {
  if (!isActive(user)) return false;
  return isPaid(user);
}

/**
 * Peut créer des rendez-vous B2B
 * CdC §1.2 : "Prise de rendez-vous d'affaires — Non autorisé [free trial] / Illimité [PAID]"
 */
export function canRequestRdv(user: PermissionUser): boolean {
  if (!isActive(user)) return false;
  return isPaid(user);
}

/**
 * Peut contacter un exposant (ouvrir une conversation)
 * Les free trial peuvent RÉPONDRE mais pas INITIER (géré côté serveur dans check-quota)
 */
export function canUseChat(user: PermissionUser): boolean {
  return isActive(user); // Tout le monde peut accéder au chat — le quota est vérifié côté serveur
}

/**
 * Peut initier une nouvelle conversation (soumet au quota si free trial)
 */
export function canInitiateConversation(user: PermissionUser): boolean {
  return isActive(user); // Permis pour tous — le quota bloque si dépassé
}

/**
 * Peut voir les coordonnées complètes d'un exposant
 */
export function canSeeContactDetails(user: PermissionUser): boolean {
  if (!isActive(user)) return false;
  return isPaid(user);
}

/**
 * A une messagerie illimitée (pas de quota)
 * CdC §1.2 : "Messagerie — Illimité [PAID]"
 */
export function hasUnlimitedMessaging(user: PermissionUser): boolean {
  return isPaid(user);
}

/**
 * Peut bloquer une autre entreprise
 * CdC §1.2 : "Bloquer une autre entreprise — Non [free trial] / Oui [PAID]"
 * CdC §3.2 : "Les entreprises en free trial ne peuvent pas utiliser cette fonctionnalité"
 */
export function canBlockUsers(user: PermissionUser): boolean {
  if (!isActive(user)) return false;
  return isPaid(user);
}

/**
 * Peut recevoir la newsletter PROMOTE
 * CdC §1.2 : "Newsletter PROMOTE — Non [free trial] / Oui [PAID]"
 */
export function canReceiveNewsletter(user: PermissionUser): boolean {
  if (!isActive(user)) return false;
  return isPaid(user);
}

/**
 * Peut accéder au support technique PROMOTE
 * CdC §1.2 : "Support technique PROMOTE — Non/Oui pendant un temps [free trial] / Oui [PAID]"
 */
export function canAccessSupport(user: PermissionUser): boolean {
  return isActive(user); // FAQ accessible à tous, tickets/chat réservés PAID (géré dans l'UI)
}

// ---------------------------------------------------------------------------
// Publications et vitrine — CdC §1.2, §8, §9
// ---------------------------------------------------------------------------

/**
 * Peut publier dans le fil d'actualité (toujours true, quota vérifié côté serveur)
 * CdC §1.2 : "Publications dans le fil — Maximum 2 [free trial] / Illimité [PAID]"
 */
export function canPublishPost(user: PermissionUser): boolean {
  return isActive(user);
}

/**
 * Peut publier une offre dans la vitrine (toujours true, quota vérifié côté serveur)
 * CdC §1.2 : "Vitrine produits/offres — Maximum 2 [free trial] / Illimité + prioritaire [PAID]"
 */
export function canPublishOffer(user: PermissionUser): boolean {
  return isActive(user);
}

/**
 * L'entreprise peut apparaître comme "sponsorisée"
 * CdC §8.1 : "avoir un abonnement PAID actif ET avoir été activée par l'admin (is_featured)"
 * NOTE: is_featured doit être passé séparément — cette fonction vérifie seulement le tier
 */
export function isEligibleForSponsoring(user: PermissionUser): boolean {
  if (!isActive(user)) return false;
  return isPaid(user);
}

// ---------------------------------------------------------------------------
// Logique asymétrique de messagerie — CdC §2.1
// ---------------------------------------------------------------------------

/**
 * Détermine si l'expéditeur doit décompter son quota de messages
 *
 * Règle : si la conversation a été initiée par un PAID,
 * le free trial qui répond ne consomme PAS son quota.
 * CdC §2.1 : "Si c'est un abonné PAID, le destinataire peut répondre librement"
 */
export function shouldDeductQuota(
  sender: PermissionUser,
  conversationInitiatorTier: SubscriptionTier | string | null
): boolean {
  // Les PAID et admins ne consomment jamais de quota
  if (isPaid(sender)) return false;

  // Si la conversation a été initiée par un PAID → pas de décompte
  if (conversationInitiatorTier === 'paid') return false;

  // Sinon (free_trial qui initie, ou répond à un free_trial) → décompte
  return true;
}

// ---------------------------------------------------------------------------
// Legacy compatibility — conservé pour la migration progressive
// ---------------------------------------------------------------------------

/** @deprecated Utiliser canRequestRdv() */
export function canContactExposant(user: PermissionUser): boolean {
  return canAccessDirectory(user);
}

/** @deprecated Utiliser hasUnlimitedMessaging() */
export function canExchangeWith(
  currentUser: PermissionUser,
  targetUser: { subscription_tier?: string | null }
): boolean {
  if (isAdmin(currentUser)) return true;
  if (isPaid(currentUser)) return true;
  if (targetUser.subscription_tier === 'paid') return true;
  return false;
}

/** @deprecated Les quotas viennent maintenant de platform_config via lib/subscription.ts */
export function getDailyExchangeLimit(): number {
  // Valeur de secours uniquement — utiliser getQuotaConfig() de lib/subscription.ts
  return 10;
}

/** @deprecated Utiliser lib/subscription.ts → checkDailyQuota() */
export function hasReachedExchangeLimit(
  dailyCount: number,
  lastReset: string | null
): boolean {
  const limit = getDailyExchangeLimit();
  if (!lastReset) return dailyCount >= limit;

  const lastResetDate = new Date(lastReset);
  const now = new Date();
  const isSameDay =
    lastResetDate.getFullYear() === now.getFullYear() &&
    lastResetDate.getMonth() === now.getMonth() &&
    lastResetDate.getDate() === now.getDate();

  if (!isSameDay) return false;
  return dailyCount >= limit;
}

// ---------------------------------------------------------------------------
// Types utilitaires
// ---------------------------------------------------------------------------

/** Mapping complet des permissions pour un utilisateur (utilisé dans usePermissions) */
export interface UserPermissions {
  loading: boolean;
  // Compte
  isActive: boolean;
  isPaid: boolean;
  isAdmin: boolean;
  tier: SubscriptionTier | null;
  // Features
  canReadFeed: boolean;
  canReadAgenda: boolean;
  canViewVitrine: boolean;
  canAccessDirectory: boolean;
  canRequestRdv: boolean;
  canUseChat: boolean;
  canSeeContactDetails: boolean;
  hasUnlimitedMessaging: boolean;
  canBlockUsers: boolean;
  canReceiveNewsletter: boolean;
  canAccessSupport: boolean;
  canPublishPost: boolean;
  canPublishOffer: boolean;
  isEligibleForSponsoring: boolean;
}
