"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { supabaseClient } from "@/lib/supabase/client";
import {
  Mail,
  Check,
  Loader2,
  Newspaper,
  CalendarDays,
  BellRing,
  Settings2,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usePermissions } from '@/hooks/usePermissions';
import { ConversionModal } from '@/components/shared/ConversionModal';

interface SectorItem {
  value: string;
  labelKey: string;
}

interface NewsletterEdition {
  id: string;
  titre: string;
  contenu: string | null;
  sent_at: string | null;
}

export default function NewsletterPage() {
  const { t, locale } = useTranslation();
  const perms = usePermissions();
  const [showConversion, setShowConversion] = useState(false);
  const SECTORS: SectorItem[] = [
    { value: "Technology", labelKey: "sector.it" },
    { value: "Energy", labelKey: "sector.energie" },
    { value: "Fashion", labelKey: "sector.fashion" },
    { value: "Healthcare", labelKey: "sector.sante" },
    { value: "Construction", labelKey: "sector.batiment" },
    { value: "Agriculture", labelKey: "sector.agriculture" },
    { value: "Finance", labelKey: "sector.finance" },
    { value: "Logistics", labelKey: "sector.logistique" },
  ];
  const FREQUENCIES = [
    { value: "daily", label: t("newsletter.daily") },
    { value: "weekly", label: t("newsletter.weekly") },
    { value: "monthly", label: t("newsletter.monthly") },
  ];
  const [email, setEmail] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("weekly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editions, setEditions] = useState<NewsletterEdition[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    frequency: string;
    sectors: string[];
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: session } = await supabaseClient.auth.getSession();

      if (session.session?.user) {
        const userEmail = session.session.user.email || "";
        setEmail(userEmail);

        const { data: sub } = await supabaseClient
          .from("newsletter_subscriptions")
          .select("is_active, frequency, sectors")
          .eq("email", userEmail)
          .maybeSingle();

        if (sub) {
          setSubscriptionStatus({
            subscribed: sub.is_active ?? false,
            frequency: sub.frequency || "weekly",
            sectors: sub.sectors || [],
          });
          if (sub.is_active) {
            setFrequency(sub.frequency || "weekly");
            setSectors(sub.sectors || []);
          }
        }
      }

      const { data } = await supabaseClient
        .from("newsletter_editions")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(10);

      if (data) setEditions(data);
    };

    init();
  }, []);

  const toggleSector = (sector: SectorItem) => {
    setSectors((prev) =>
      prev.includes(sector.value)
        ? prev.filter((s) => s !== sector.value)
        : [...prev, sector.value],
    );
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email, sectors, frequency }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || t("common.error"));
      }

      setSubscriptionStatus({
        subscribed: true,
        frequency,
        sectors,
      });
      toast.success(t("newsletter.success"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/newsletter/subscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors du désabonnement");
      }

      setSubscriptionStatus(null);
      toast.success("Désabonnement réussi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du désabonnement");
    } finally {
      setLoading(false);
    }
  };

  const renderConversionGate = () => (
    <div className="relative overflow-hidden rounded-2xl border border-border/50">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md">
        <div className="max-w-md text-center p-8 bg-background/95 rounded-2xl border border-border">
          <LockKeyhole className="size-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">{t('newsletter.restricted_title') || 'Accès réservé'}</h3>
          <p className="text-muted-foreground mb-6">
            {t('newsletter.restricted_desc') || "La newsletter PROMOTE est réservée aux entreprises avec un abonnement actif."}
          </p>
          <Button onClick={() => setShowConversion(true)} className="w-full rounded-xl" size="lg">
            {t('newsletter.unlock_access') || "Débloquer l'accès"}
          </Button>
        </div>
      </div>
      <div className="opacity-20 select-none pointer-events-none">
        {renderContent()}
      </div>
    </div>
  );

  const renderContent = () => (
    <>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <Newspaper className="size-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              {t("newsletter.subscription")}
            </p>
            <h1 className="text-3xl font-heading text-foreground">
              {t("newsletter.title")}
            </h1>
          </div>
        </div>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          {t("newsletter.desc")}
        </p>
      </div>

      {/* Subscription Status / Form */}
      <Card className="surface-panel border-0 overflow-hidden">
        {subscriptionStatus?.subscribed ? (
          <div className="divide-y divide-border/60">
            <div className="brand-gradient p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                  <Check className="size-6 text-white" />
                </div>
                <div className="text-white min-w-0">
                  <h2 className="font-heading text-xl font-semibold">
                    {t("newsletter.subscribed")}
                  </h2>
                  <p className="text-sm text-white/80 truncate">
                    {email}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BellRing className="size-4" />
                  <span>
                    {t("newsletter.frequency")} :{" "}
                    <span className="font-medium text-foreground">
                      {FREQUENCIES.find((f) => f.value === subscriptionStatus.frequency)?.label}
                    </span>
                  </span>
                </div>
                {subscriptionStatus.sectors.length > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Settings2 className="size-4" />
                    <span>
                      Secteurs :{" "}
                      <span className="font-medium text-foreground">
                        {subscriptionStatus.sectors.join(", ")}
                      </span>
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnsubscribe}
                disabled={loading}
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                {loading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Se désabonner
              </Button>
            </div>
          </div>
        ) : (
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Mail className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  {t("newsletter.subscription")}
                </p>
                <h2 className="text-2xl font-heading text-foreground">
                  {t("newsletter.signup")}
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("newsletter.email")}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t("newsletter.email_placeholder")}
                  className="h-11 rounded-xl border-border/70 bg-card"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("newsletter.frequency")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {FREQUENCIES.map((f) => (
                    <Button
                      key={f.value}
                      type="button"
                      variant={frequency === f.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFrequency(f.value)}
                      className="rounded-full"
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("newsletter.sectors")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map((sector) => (
                    <Badge
                      key={sector.value}
                      variant={
                        sectors.includes(sector.value) ? "default" : "secondary"
                      }
                      className="cursor-pointer rounded-full transition-all hover:opacity-80 select-none"
                      onClick={() => toggleSector(sector)}
                    >
                      {sectors.includes(sector.value) && (
                        <Check className="mr-1 size-3" />
                      )}
                      {t(sector.labelKey)}
                    </Badge>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t("newsletter.subscribing")}
                  </>
                ) : (
                  t("newsletter.subscribe")
                )}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Archives */}
      <section className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Newspaper className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              {t("newsletter.archives")}
            </p>
            <h2 className="text-2xl font-heading text-foreground">
              {t("newsletter.previous_editions")}
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          {editions.length > 0 ? (
            editions.map((edition, index) => (
              <article
                key={edition.id}
                className="group relative rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/20 hover:hover:-translate-y-0.5"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {edition.titre}
                    </h3>
                    {edition.sent_at && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarDays className="size-3.5 shrink-0" />
                        {new Date(edition.sent_at).toLocaleDateString(
                          locale === "en" ? "en-US" : "fr-FR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                </div>
                {edition.contenu && (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {edition.contenu}
                  </p>
                )}
              </article>
            ))
          ) : (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                <Mail className="size-8 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-base font-medium text-foreground">
                  {t("newsletter.no_editions")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("newsletter.no_editions_hint")}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );

  if (perms.loading) {
    return (
      <div className="space-y-8 pb-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 max-w-6xl mx-auto">
      {!perms.canReceiveNewsletter ? renderConversionGate() : renderContent()}
      <ConversionModal open={showConversion} onOpenChange={setShowConversion} />
    </div>
  );
}
