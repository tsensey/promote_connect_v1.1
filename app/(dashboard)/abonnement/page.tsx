'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import {
  ShieldCheck,
  Mail,
  Users,
  Gem,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Crown,
  CalendarDays,
  MessageSquare,
  BookOpen,
  Star,
  Lock,
  Ban,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { useSupportTickets } from '@/hooks/useSupport';
import { useAuth } from '@/lib/auth/context';
import { useQuotaStatus } from '@/hooks/useQuotaStatus';
import { supabaseClient } from '@/lib/supabase/client';
import { type ConversionMessage } from '@/lib/subscription';
import { getAccountStatusLabel, getQuotaMessage } from '@/lib/quota-messages';
import { cn } from '@/lib/utils';

function getDaysRemaining(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null | undefined, locale = 'fr-FR'): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(locale, {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

const ALL_FEATURES = [
  { icon: MessageSquare, labelKey: 'abonnement.feature_chat',       paid: true,  free: false, freeLimitKey: 'abonnement.feature_chat_limit' },
  { icon: Users,         labelKey: 'abonnement.feature_directory',  paid: true,  free: false },
  { icon: CalendarDays,  labelKey: 'abonnement.feature_rdv',        paid: true,  free: false },
  { icon: Star,          labelKey: 'abonnement.feature_vitrine',    paid: true,  free: true,  freeLimitKey: 'abonnement.feature_vitrine_limit' },
  { icon: BookOpen,      labelKey: 'abonnement.feature_newsletter', paid: true,  free: false },
  { icon: ShieldCheck,   labelKey: 'abonnement.feature_support',    paid: true,  free: true },
  { icon: Crown,         labelKey: 'abonnement.feature_featured',   paid: true,  free: false },
];

export default function AbonnementPage() {
  const { t, locale } = useTranslation();
  const perms = usePermissions();
  const { profile } = useAuth();
  const quota = useQuotaStatus();
  const searchParams = useSearchParams();
  const isExpiredParam = searchParams.get('expired') === 'true';

  const [conversionMsg, setConversionMsg] = useState<ConversionMessage | null>(null);
  const { createTicket, tickets, loading: ticketsLoading } = useSupportTickets();
  const [isRequesting, setIsRequesting] = useState(false);
  const [localRequestSent, setLocalRequestSent] = useState(false);

  const hasPendingUpgradeRequest = useMemo(() => {
    return localRequestSent || tickets.some(t => t.subject === 'Demande de passage à Premium');
  }, [localRequestSent, tickets]);

  const handleUpgradeRequest = async () => {
    setIsRequesting(true);
    try {
      await createTicket(
        'Demande de passage à Premium',
        "Je souhaite passer à l'abonnement Premium pour débloquer toutes les fonctionnalités. Pouvez-vous me recontacter pour finaliser mon abonnement ?",
        'high',
        'upgrade'
      );
      setLocalRequestSent(true);
    } catch (e) {
      console.error('Erreur lors de la création du ticket:', e);
    } finally {
      setIsRequesting(false);
    }
  };

  useEffect(() => {
    supabaseClient
      .from('platform_config')
      .select('key, value')
      .in('key', ['conversion_message', 'daily_message_limit', 'max_posts_free_trial', 'max_vitrine_offers_free_trial'])
      .then(({ data }) => {
        if (data) {
          const configMap = Object.fromEntries(data.map((row) => [row.key, row.value]));
          if (configMap['conversion_message']) {
            const val = configMap['conversion_message'] as Record<string, unknown>;
            setConversionMsg({
              title: String(val.title ?? ''),
              body: String(val.body ?? ''),
              priceDisplay: String(val.price_display ?? val.priceDisplay ?? '100 000 F CFA / an'),
              phone: String(val.phone ?? ''),
              email: String(val.email ?? ''),
              ctaUrl: val.cta_url ? String(val.cta_url) : (val.ctaUrl as string | null) ?? null,
              ctaLabel: String(val.cta_label ?? val.ctaLabel ?? "Contacter l'équipe PROMOTE"),
            });
          }
        }
      });
  }, []);

  const msg: ConversionMessage = conversionMsg ?? {
    title: "Débloquez l'accès complet à PROMOTE-CONNECT",
    body: "Passez à l'abonnement PAID pour accéder à toutes les fonctionnalités : messagerie illimitée, annuaire complet, rendez-vous d'affaires et plus encore.",
    priceDisplay: "100 000 F CFA / an",
    phone: "+229 XX XX XX XX",
    email: "contact@promote-benin.com",
    ctaUrl: null,
    ctaLabel: "Contacter l'équipe PROMOTE",
  };

  const subscriptionEndsAt = (profile as Record<string, unknown>)?.subscription_ends_at as string | null ?? null;
  const trialEndsAt = (profile as Record<string, unknown>)?.trial_ends_at as string | null ?? null;
  const accountStatus = (profile as Record<string, unknown>)?.account_status as string | null ?? 'active';

  const subscriptionDaysLeft = useMemo(() => getDaysRemaining(subscriptionEndsAt), [subscriptionEndsAt]);
  const trialDaysLeft = useMemo(() => getDaysRemaining(trialEndsAt), [trialEndsAt]);

  const isPaidExpired = perms.isPaid && subscriptionDaysLeft !== null && subscriptionDaysLeft < 0;
  const isPaidActive = perms.isPaid && !isPaidExpired;
  const isTrialExpired = !perms.isPaid && trialDaysLeft !== null && trialDaysLeft < 0;
  const isFreeTrial = !perms.isPaid && !isTrialExpired;
  const showExpiredWarning = isExpiredParam || isPaidExpired || isTrialExpired;
  const statusLabel = getAccountStatusLabel(accountStatus);

  const canShowQuotaBars = isFreeTrial && !quota.loading;

  if (perms.loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-background p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex size-14 items-center justify-center rounded-2xl',
              isPaidActive ? 'bg-emerald-500/10' : statusLabel.variant === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'
            )}>
              {isPaidActive ? (
                <ShieldCheck className="size-7 text-emerald-500" />
              ) : statusLabel.variant === 'danger' ? (
                <Ban className="size-7 text-red-500" />
              ) : (
                <Crown className="size-7 text-amber-500" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {accountStatus === 'suspended' || accountStatus === 'blocked'
                  ? 'Accès restreint'
                  : isPaidActive
                    ? t('abonnement.title')
                    : showExpiredWarning
                      ? t('abonnement.expired_title') || 'Abonnement expiré'
                      : t('abonnement.free_trial_title') || "Période d'essai gratuit"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {accountStatus === 'suspended'
                  ? 'Votre compte est temporairement suspendu.'
                  : accountStatus === 'blocked'
                    ? 'Votre compte a été bloqué.'
                    : isPaidActive
                      ? t('abonnement.desc')
                      : t('abonnement.free_trial_desc') || 'Accès limité à certaines fonctionnalités'}
              </p>
            </div>
          </div>

          <Badge className={cn(
            'h-8 gap-1.5 rounded-full px-4 text-sm font-semibold self-start border',
            isPaidActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50' :
            accountStatus === 'suspended' ? 'bg-amber-500/10 text-amber-600 border-amber-200/50' :
            accountStatus === 'blocked' ? 'bg-red-500/10 text-red-600 border-red-200/50' :
            isPaidExpired || isTrialExpired ? 'bg-red-500/10 text-red-600 border-red-200/50' :
            'bg-amber-500/10 text-amber-600 border-amber-200/50'
          )}>
            {isPaidActive && <><div className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Actif</>}
            {accountStatus === 'suspended' && <AlertTriangle className="size-3.5" />}
            {accountStatus === 'blocked' && <Ban className="size-3.5" />}
            {(isPaidExpired || isTrialExpired || isExpiredParam) && <><AlertTriangle className="size-3.5" /> Expiré</>}
            {isFreeTrial && !showExpiredWarning && <><Clock className="size-3.5" /> Essai gratuit</>}
          </Badge>
        </div>
      </div>

      {/* ── Bannière statut compte ── */}
      {(accountStatus === 'suspended' || accountStatus === 'blocked') && (
        <div className={cn(
          'flex items-start gap-4 rounded-xl border p-5',
          accountStatus === 'blocked'
            ? 'border-red-200/50 bg-red-50/50'
            : 'border-amber-200/50 bg-amber-50/50'
        )}>
          {accountStatus === 'blocked' ? (
            <Ban className="size-5 text-red-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-semibold text-red-700">
              {accountStatus === 'blocked'
                ? 'Votre compte a été définitivement bloqué'
                : 'Votre compte est temporairement suspendu'}
            </p>
            <p className="text-sm text-red-600/80">
              {accountStatus === 'blocked'
                ? 'Pour toute contestation, contactez l\'équipe PROMOTE.'
                : 'Vous pouvez faire appel de cette décision en contactant le support.'}
            </p>
            <a
              href={`tel:${msg.phone}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mt-2"
            >
              <Phone className="size-3.5" />
              {msg.phone}
            </a>
          </div>
        </div>
      )}

      {/* ── Bannière expiration ── */}
      {showExpiredWarning && accountStatus === 'active' && (
        <div className="flex items-start gap-4 rounded-xl border border-red-200/50 bg-red-50/50 p-5">
          <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">
              {isPaidExpired
                ? t('abonnement.paid_expired_alert') || 'Votre abonnement PROMOTE-CONNECT est arrivé à expiration.'
                : t('abonnement.trial_expired_alert') || "Votre période d'essai gratuit est terminée."}
            </p>
            <p className="text-sm text-red-600/80 mt-1">
              {t('abonnement.expired_contact') || 'Contactez l\'équipe PROMOTE pour renouveler votre accès et retrouver toutes vos fonctionnalités.'}
            </p>
          </div>
        </div>
      )}

      {isPaidActive ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 overflow-hidden border-emerald-500/20 bg-background/50 backdrop-blur-sm py-0">
            <div className="relative overflow-hidden border-b border-emerald-500/10 bg-emerald-500/5 px-6 py-7">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_60%)]" />
              <div className="relative flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50">
                    {t('abonnement.full_access') || 'Accès complet PROMOTE-CONNECT'}
                  </h2>
                  <p className="text-sm text-emerald-700/80 dark:text-emerald-200/70 mt-0.5">
                    {t('abonnement.full_access_desc') || 'Toutes les fonctionnalités débloquées'}
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                {subscriptionEndsAt && (
                  <div className={cn(
                    'rounded-xl border p-4',
                    subscriptionDaysLeft !== null && subscriptionDaysLeft <= 30
                      ? 'border-amber-500/20 bg-amber-500/5'
                      : 'border-emerald-500/20 bg-emerald-500/5'
                  )}>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                      {t('abonnement.expires_on') || 'Expire le'}
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {formatDate(subscriptionEndsAt, locale)}
                    </p>
                    {subscriptionDaysLeft !== null && (
                      <p className={cn(
                        'text-xs mt-1 font-medium',
                        subscriptionDaysLeft <= 0 ? 'text-red-600' :
                        subscriptionDaysLeft <= 7 ? 'text-red-600' :
                        subscriptionDaysLeft <= 30 ? 'text-amber-600' :
                        'text-emerald-600'
                      )}>
                        {subscriptionDaysLeft <= 0
                          ? t('abonnement.expired_ago') || 'Expiré'
                          : `${subscriptionDaysLeft} ${t('abonnement.days_left') || 'jours restants'}`}
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    {t('abonnement.plan') || 'Formule'}
                  </p>
                  <p className="text-lg font-bold text-primary">PROMOTE-CONNECT</p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {msg.priceDisplay}
                  </p>
                </div>
              </div>

              {subscriptionDaysLeft !== null && subscriptionDaysLeft > 0 && subscriptionDaysLeft <= 14 && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200/50 bg-amber-50/50 p-4">
                  <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    {t('abonnement.renewal_warning') || `Votre abonnement expire dans ${subscriptionDaysLeft} jours. Contactez-nous pour le renouveler.`}
                  </p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <a href={`tel:${msg.phone}`}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm hover:border-primary/30 hover:bg-primary/5 transition-colors">
                  <Phone className="size-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{msg.phone}</span>
                </a>
                <a href={`mailto:${msg.email}`}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm hover:border-primary/30 hover:bg-primary/5 transition-colors">
                  <Mail className="size-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground break-all">{msg.email}</span>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t('abonnement.included_features') || 'Fonctionnalités incluses'}
              </h3>
              <div className="space-y-2">
                {ALL_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-3 border border-emerald-500/10 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06] transition-colors">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 shrink-0">
                      <f.icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1">
                      {t(f.labelKey) || f.labelKey.split('.').pop()}
                    </span>
                    <CheckCircle2 className="size-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 overflow-hidden border-amber-500/20 bg-background/50 backdrop-blur-sm py-0">
            <div className="relative overflow-hidden border-b border-amber-500/10 bg-amber-500/5 p-6 sm:p-8 flex flex-col h-full">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_60%)]" />

              <div className="relative z-10 mb-5 flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                <Gem className="size-6" />
              </div>

              {/* Message personnalisé selon le statut */}
              {showExpiredWarning ? (
                <>
                  <h2 className="relative z-10 text-2xl font-bold mb-3 text-foreground">
                    {getQuotaMessage('account_expired').title}
                  </h2>
                  <p className="relative z-10 text-muted-foreground leading-relaxed mb-6">
                    {getQuotaMessage('account_expired').description}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="relative z-10 text-2xl font-bold mb-3 text-foreground">{msg.title}</h2>
                  <p className="relative z-10 text-muted-foreground leading-relaxed mb-6">{msg.body}</p>
                </>
              )}

              {/* Compteur essai */}
              {isFreeTrial && trialEndsAt && (
                <div className={cn(
                  'relative z-10 rounded-xl border p-4 mb-6',
                  trialDaysLeft !== null && trialDaysLeft <= 3
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-amber-500/20 bg-amber-500/5'
                )}>
                  <div className="flex items-center gap-3">
                    <Clock className={cn(
                      'size-5 shrink-0',
                      trialDaysLeft !== null && trialDaysLeft <= 3 ? 'text-red-500' : 'text-amber-500'
                    )} />
                    <div>
                      <p className="font-semibold text-foreground">
                        {trialDaysLeft !== null && trialDaysLeft > 0
                          ? `${trialDaysLeft} ${t('abonnement.trial_days_left') || "jours d'essai restants"}`
                          : t('abonnement.trial_ends_today') || "Dernier jour d'essai"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('abonnement.trial_expires_on') || 'Essai se termine le'} {formatDate(trialEndsAt, locale)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Features grid PAID */}
              <div className="relative z-10 grid sm:grid-cols-2 gap-3 mt-auto">
                {[
                  'Annuaire complet des exposants',
                  'Messagerie B2B illimitée',
                  'Prise de RDV d\'affaires',
                  'Vitrine produits illimitée',
                  'Newsletter PROMOTE exclusive',
                  'Visibilité sponsorisée',
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            {/* ── Barres de quota temps réel ── */}
            {canShowQuotaBars && (
              <Card className="border-amber-500/20 bg-amber-500/[0.03]">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-sm text-amber-700 dark:text-amber-500/80 uppercase tracking-wide flex items-center gap-2">
                    <Clock className="size-3.5" />
                    {t('abonnement.my_limits') || 'Ma Consommation'}
                  </h3>

                  {/* Messages quotidiens */}
                  <QuotaBar
                    label={t('abonnement.daily_messages') || 'Messages aujourd\'hui'}
                    current={quota.messages.current}
                    limit={quota.messages.limit}
                    tip={quota.messages.current >= quota.messages.limit ? getQuotaMessage('daily_quota_exceeded').description : undefined}
                  />

                  {/* Publications */}
                  <QuotaBar
                    label={t('abonnement.max_posts') || 'Publications'}
                    current={quota.posts.current}
                    limit={quota.posts.limit}
                    tip={quota.posts.current >= quota.posts.limit ? getQuotaMessage('post_quota_exceeded').description : undefined}
                  />

                  {/* Vitrine */}
                  <QuotaBar
                    label={t('abonnement.max_vitrine') || 'Produits en vitrine'}
                    current={quota.vitrine.current}
                    limit={quota.vitrine.limit}
                    tip={quota.vitrine.current >= quota.vitrine.limit ? getQuotaMessage('vitrine_quota_exceeded').description : undefined}
                  />
                </CardContent>
              </Card>
            )}

            {/* Si l'essai est expiré, on montre les fonctionnalités bloquées */}
            {showExpiredWarning && (
              <Card className="border-red-500/20 bg-red-500/[0.03]">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-sm text-red-700 dark:text-red-500/80 uppercase tracking-wide flex items-center gap-2">
                    <Lock className="size-3.5" />
                    Fonctionnalités verrouillées
                  </h3>
                  <div className="space-y-2">
                    {ALL_FEATURES.filter(f => !f.free).map((f, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl p-3 border border-red-500/10 bg-red-500/[0.03]">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10 shrink-0">
                          <f.icon className="size-4 text-red-500" />
                        </div>
                        <span className="text-sm font-medium text-foreground flex-1">
                          {t(f.labelKey) || f.labelKey.split('.').pop()}
                        </span>
                        <Lock className="size-3.5 text-muted-foreground/40 shrink-0" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50 flex-1">
              <CardContent className="p-6 flex flex-col h-full gap-5">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {t('abonnement.subscribe_title') || 'Souscription'}
                  </h3>
                  <div className="text-2xl font-bold tracking-tight text-primary">
                    {msg.priceDisplay}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('abonnement.per_year') || 'par an, accès 12 mois'}
                  </p>
                </div>

                <div className="space-y-2 flex-1">
                  <a href={`tel:${msg.phone}`}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm hover:border-primary/30 hover:bg-primary/5 transition-colors">
                    <Phone className="size-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{msg.phone}</span>
                  </a>
                  <a href={`mailto:${msg.email}`}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm hover:border-primary/30 hover:bg-primary/5 transition-colors">
                    <Mail className="size-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground break-all">{msg.email}</span>
                  </a>
                </div>

                <div className="flex flex-col gap-2 w-full mt-2">
                  <Button
                    className="w-full rounded-xl"
                    size="lg"
                    onClick={handleUpgradeRequest}
                    disabled={isRequesting || hasPendingUpgradeRequest || ticketsLoading}
                  >
                    {isRequesting || ticketsLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Envoi en cours...
                      </span>
                    ) : hasPendingUpgradeRequest ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="size-4" /> Demande envoyée
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 truncate">
                        {t('abonnement.request_upgrade') || 'Demander mon passage en Premium'} <Crown className="size-4" />
                      </span>
                    )}
                  </Button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">{t('abonnement.or_contact_us') || 'Ou contactez-nous'}</span>
                    </div>
                  </div>

                  {msg.ctaUrl ? (
                    <a href={msg.ctaUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                      <Button variant="outline" className="w-full rounded-xl" size="lg">
                        {msg.ctaLabel} <ArrowRight className="ml-2 size-4" />
                      </Button>
                    </a>
                  ) : (
                    <a href={`mailto:${msg.email}`} className="block w-full">
                      <Button variant="outline" className="w-full rounded-xl truncate" size="lg">
                        {msg.ctaLabel}
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="md:col-span-3 border-border/50">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                {t('abonnement.feature_comparison') || 'Comparaison des accès'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left py-3 pr-4 font-medium text-muted-foreground w-full">
                        {t('abonnement.feature_col') || 'Fonctionnalité'}
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">
                        {t('abonnement.free_trial_col') || 'Essai gratuit'}
                      </th>
                      <th className="text-center py-3 pl-4 font-medium text-primary whitespace-nowrap">
                        PROMOTE-CONNECT PAID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {ALL_FEATURES.map((f, i) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <f.icon className="size-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-foreground">
                              {t(f.labelKey) || f.labelKey.split('.').pop()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {f.free ? (
                            <div className="flex flex-col items-center gap-1">
                              <CheckCircle2 className="size-4 text-amber-500" />
                              {f.freeLimitKey && (
                                <span className="text-[10px] text-muted-foreground">
                                  {t(f.freeLimitKey) || ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Lock className="size-4 text-muted-foreground/40 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 pl-4 text-center">
                          <CheckCircle2 className="size-4 text-emerald-500 mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function QuotaBar({ label, current, limit, tip }: {
  label: string;
  current: number;
  limit: number;
  tip?: string;
}) {
  const pct = Math.min(100, (current / limit) * 100);
  const isExceeded = current >= limit;
  const isNearLimit = !isExceeded && pct >= 80;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn(
          'font-semibold',
          isExceeded ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-muted-foreground'
        )}>
          {current} / {limit}
        </span>
      </div>
      <div className="h-2 w-full bg-amber-500/20 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isExceeded ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      {tip && isExceeded && (
        <p className="text-[11px] text-red-600 leading-tight">{tip}</p>
      )}
    </div>
  );
}
