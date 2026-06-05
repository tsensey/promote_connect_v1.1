/**
 * lib/quota-messages.ts
 * Messages explicites unifiés pour tous les niveaux de restriction de compte.
 *
 * Chaque raison produit un titre + description prêts à l'affichage,
 * un booléen showConversion qui déclenche la ConversionModal côté client,
 * et un code action que les composants peuvent interpréter.
 */

export type QuotaReason =
  | 'daily_quota_exceeded'
  | 'total_quota_exceeded'
  | 'post_quota_exceeded'
  | 'vitrine_quota_exceeded'
  | 'account_inactive'
  | 'account_suspended'
  | 'account_blocked'
  | 'account_expired'
  | 'profile_not_found'
  | 'newsletter_paid_only'
  | 'rdv_paid_only'
  | 'directory_paid_only'
  | 'contact_details_paid_only'
  | 'featured_paid_only'
  | 'initiate_conversation_exceeded'
  | 'upgrade_pending';

export interface QuotaMessage {
  title: string;
  description: string;
  actionLabel: string;
  showConversion: boolean;
  reason: QuotaReason;
}

const MESSAGES: Record<QuotaReason, Omit<QuotaMessage, 'reason'>> = {
  daily_quota_exceeded: {
    title: 'Quota journalier de messages atteint',
    description: 'Vous avez utilisé tous vos messages gratuits aujourd\'hui. Passez à l\'abonnement PAID pour une messagerie illimitée.',
    actionLabel: 'Débloquer la messagerie illimitée',
    showConversion: true,
  },
  total_quota_exceeded: {
    title: 'Quota total de messages atteint',
    description: 'Vous avez atteint la limite totale de messages de votre essai gratuit. Passez à l\'abonnement PAID pour continuer à échanger.',
    actionLabel: 'Passer à PAID',
    showConversion: true,
  },
  post_quota_exceeded: {
    title: 'Limite de publications atteinte',
    description: 'Vous avez atteint le nombre maximum de publications autorisées dans le fil d\'actualité. Passez à PAID pour publier sans limite.',
    actionLabel: 'Publier sans limite',
    showConversion: true,
  },
  vitrine_quota_exceeded: {
    title: 'Limite de produits en vitrine atteinte',
    description: 'Vous avez atteint le nombre maximum de produits dans votre vitrine. Passez à PAID pour une vitrine illimitée et prioritaire.',
    actionLabel: 'Débloquer la vitrine',
    showConversion: true,
  },
  account_inactive: {
    title: 'Compte inactif',
    description: 'Votre compte n\'est pas actif. Veuillez contacter l\'équipe PROMOTE pour plus d\'informations.',
    actionLabel: 'Contacter le support',
    showConversion: false,
  },
  account_suspended: {
    title: 'Compte suspendu',
    description: 'Votre compte a été temporairement suspendu. Vous ne pouvez pas utiliser les fonctionnalités de la plateforme. Contactez l\'équipe PROMOTE pour plus de détails.',
    actionLabel: 'Contacter le support',
    showConversion: false,
  },
  account_blocked: {
    title: 'Compte bloqué',
    description: 'Votre compte a été définitivement bloqué pour non-respect de nos conditions d\'utilisation.',
    actionLabel: 'Contacter le support',
    showConversion: false,
  },
  account_expired: {
    title: 'Abonnement expiré',
    description: 'Votre abonnement PROMOTE-CONNECT est arrivé à expiration. Renouvelez votre accès pour retrouver toutes vos fonctionnalités.',
    actionLabel: 'Renouveler mon abonnement',
    showConversion: false,
  },
  profile_not_found: {
    title: 'Profil introuvable',
    description: 'Votre profil utilisateur n\'a pas été trouvé. Veuillez vous reconnecter ou contacter le support.',
    actionLabel: 'Se reconnecter',
    showConversion: false,
  },
  newsletter_paid_only: {
    title: 'Newsletter réservée aux abonnés PAID',
    description: 'La newsletter PROMOTE est exclusivement réservée aux abonnés PAID. Abonnez-vous pour y accéder.',
    actionLabel: 'S\'abonner à PAID',
    showConversion: true,
  },
  rdv_paid_only: {
    title: 'Rendez-vous réservés aux abonnés PAID',
    description: 'La prise de rendez-vous B2B est une fonctionnalité réservée aux abonnés PAID. Passez à PAID pour planifier des rendez-vous.',
    actionLabel: 'Débloquer les rendez-vous',
    showConversion: true,
  },
  directory_paid_only: {
    title: 'Annuaire complet réservé aux abonnés PAID',
    description: 'L\'annuaire complet des exposants avec coordonnées est accessible uniquement aux abonnés PAID.',
    actionLabel: 'Accéder à l\'annuaire complet',
    showConversion: true,
  },
  contact_details_paid_only: {
    title: 'Coordonnées réservées aux abonnés PAID',
    description: 'Les coordonnées complètes des exposants sont visibles uniquement par les abonnés PAID.',
    actionLabel: 'Voir les coordonnées',
    showConversion: true,
  },
  featured_paid_only: {
    title: 'Visibilité sponsorisée réservée aux abonnés PAID',
    description: 'La mise en avant sponsorisée de votre entreprise est réservée aux abonnés PAID.',
    actionLabel: 'Devenir visible',
    showConversion: true,
  },
  initiate_conversation_exceeded: {
    title: 'Quota de nouveaux échanges atteint',
    description: 'Vous avez atteint votre quota d\'initiation de conversations. Passez à PAID pour contacter librement tous les exposants.',
    actionLabel: 'Contacter sans limite',
    showConversion: true,
  },
  upgrade_pending: {
    title: 'Demande de passage en cours',
    description: 'Votre demande de passage à l\'abonnement PAID a été reçue. L\'équipe PROMOTE vous recontactera sous 48h.',
    actionLabel: 'Suivre ma demande',
    showConversion: false,
  },
};

export function getQuotaMessage(reason: QuotaReason): QuotaMessage {
  return { ...MESSAGES[reason], reason };
}

/**
 * Formate la réponse standardisée pour les API routes.
 */
export function quotaErrorResponse(reason: QuotaReason, extras?: Record<string, unknown>) {
  const msg = getQuotaMessage(reason);
  return {
    error: 'quota_restricted',
    reason,
    title: msg.title,
    message: msg.description,
    showConversion: msg.showConversion,
    actionLabel: msg.actionLabel,
    ...extras,
  };
}

/**
 * Formate la réponse réussie avec les infos de quota restant.
 */
export function quotaSuccessResponse(
  reason: QuotaReason | null,
  remaining?: number,
  extras?: Record<string, unknown>
) {
  return {
    allowed: true,
    remaining,
    ...extras,
  };
}

/**
 * Déclenche l'événement custom pour la ConversionModal depuis un composant client.
 */
export function dispatchConversionModal(open = true) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('show-conversion-modal', { detail: { open } }));
}

/**
 * Retourne le statut du compte pour affichage.
 */
export function getAccountStatusLabel(status: string | null | undefined): {
  label: string;
  variant: 'active' | 'warning' | 'danger' | 'neutral';
  color: string;
} {
  switch (status) {
    case 'active':
      return { label: 'Actif', variant: 'active', color: 'text-emerald-600' };
    case 'suspended':
      return { label: 'Suspendu', variant: 'warning', color: 'text-amber-600' };
    case 'blocked':
      return { label: 'Bloqué', variant: 'danger', color: 'text-red-600' };
    default:
      return { label: 'Inconnu', variant: 'neutral', color: 'text-muted-foreground' };
  }
}
