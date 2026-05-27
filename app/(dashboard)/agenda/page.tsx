"use client";

import { useMemo, useState } from "react";
import { useEvenements, useRendezVous } from "@/hooks/useAgenda";
import { useAuth } from "@/lib/auth/context";
import { useAgendaStore } from "@/store/agendaStore";
import {
  Calendar,
  CalendarDays,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { EVENT_TYPES, getEventTypeConfig, formatDateShort } from "@/lib/agenda/utils";
import { EvenementCard } from "@/components/agenda/EvenementCard";
import { RdvCard } from "@/components/agenda/RdvCard";
import { NewRdvDialog } from "@/components/agenda/NewRdvDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { Crown } from "lucide-react";
import { ConversionModal } from "@/components/shared/ConversionModal";

export default function AgendaPage() {
  const { evenements, loading: eventsLoading } = useEvenements();
  const { rdvs, loading: rdvsLoading, createRdv, updateRdvStatus } = useRendezVous();
  const { user } = useAuth();
  const perms = usePermissions();
  const myUserId = user?.id;
  const { t, locale } = useTranslation();
  const [showConversion, setShowConversion] = useState(false);

  const {
    eventFilter,
    rdvFilter,
    eventSearch,
    showNewRdv,
    setEventFilter,
    setRdvFilter,
    setEventSearch,
    setShowNewRdv,
  } = useAgendaStore();

  const filteredEvenements = useMemo(
    () =>
      evenements
        .filter((evt) => eventFilter === "all" || evt.type === eventFilter)
        .filter(
          (evt) =>
            eventSearch === "" ||
            evt.titre.toLowerCase().includes(eventSearch.toLowerCase()) ||
            evt.description?.toLowerCase().includes(eventSearch.toLowerCase()),
        ),
    [evenements, eventFilter, eventSearch],
  );

  const filteredRdvs = useMemo(
    () => rdvs.filter((rdv) => rdvFilter === "all" || rdv.status === rdvFilter),
    [rdvs, rdvFilter],
  );

  const upcomingRdvs = useMemo(
    () =>
      rdvs.filter(
        (rdv) => rdv.status === "confirmed" && new Date(rdv.starts_at) >= new Date(),
      ),
    [rdvs],
  );

  const stats = useMemo(
    () => ({
      total: evenements.length,
      byType: Object.fromEntries(
        EVENT_TYPES.map((t) => [t, evenements.filter((e) => e.type === t).length]),
      ),
    }),
    [evenements],
  );

  const pendingForMeCount = rdvs.filter(
    (r) => r.status === "pending" && r.destinataire_id === myUserId,
  ).length;

  const handleAccept = (id: string) => {
    updateRdvStatus(id, "confirmed")
      .then(() => toast.success(t("agenda.rdv_accepted")))
      .catch(() => toast.error(t("agenda.rdv_accept_error")));
  };

  const handleRefuse = (id: string) => {
    updateRdvStatus(id, "cancelled")
      .then(() => toast.info(t("agenda.rdv_refused")))
      .catch(() => toast.error(t("agenda.rdv_refuse_error")));
  };

  const handleCancel = (id: string) => {
    updateRdvStatus(id, "cancelled")
      .then(() => toast.info(t("agenda.rdv_cancelled_msg")))
      .catch(() => toast.error(t("agenda.rdv_cancel_error")));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-background border border-border/50 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 shadow-sm shadow-primary/5">
                <CalendarDays className="size-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {t("agenda.title")}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {evenements.length > 0
                    ? t("agenda.subtitle", { events: evenements.length, rdvs: rdvs.length })
                    : t("agenda.desc")}
                </p>
              </div>
            </div>
            {perms.canRequestRdv ? (
              <Button onClick={() => setShowNewRdv(true)} className="whitespace-nowrap rounded-xl shadow-sm">
                <Plus className="mr-2 size-4" />
                {t("agenda.request_rdv")}
              </Button>
            ) : (
              <Button onClick={() => setShowConversion(true)} className="whitespace-nowrap rounded-xl shadow-sm border-amber-500/50 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
                <Crown className="mr-2 size-4" />
                {t("agenda.request_rdv")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Prochains RDV */}
      {upcomingRdvs.length > 0 && (
        <Card className="overflow-hidden border-primary/10 shadow-sm py-0">
          <div className="bg-gradient-to-r from-primary to-primary/80 px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <CalendarDays className="size-4" />
              {t("agenda.upcoming_rdvs")} ({upcomingRdvs.length})
            </h3>
          </div>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {upcomingRdvs.slice(0, 3).map((rdv) => (
              <div
                key={rdv.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Avatar className="size-10 shrink-0 border-2 border-border/30">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {rdv.other_user?.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {rdv.other_user?.full_name || "Contact"}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {formatDateShort(rdv.starts_at, locale)}{" "}
                    {t("agenda.rdv_at")}{" "}
                    {new Date(rdv.starts_at).toLocaleTimeString(
                      locale === "en" ? "en-US" : "fr-FR",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="programme" className="flex flex-col gap-y-2">
        <TabsList className="w-full rounded-xl bg-muted/80 p-1 sm:w-auto">
          <TabsTrigger value="programme" className="gap-2 rounded-lg data-[state=active]:shadow-sm">
            <Calendar className="size-4" />
            {t("agenda.tab_programme")}
          </TabsTrigger>
          <TabsTrigger value="rdvs" className="gap-2 rounded-lg data-[state=active]:shadow-sm">
            <Users className="size-4" />
            {t("agenda.tab_planning")}
            {pendingForMeCount > 0 && (
              <Badge className="ml-1 rounded-full bg-amber-500 px-1.5 py-px text-[10px] text-white">
                {pendingForMeCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Programme ─── */}
        <TabsContent value="programme" className="mt-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("agenda.search")}
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="h-11 rounded-xl border-border/70 bg-muted/30 pl-11 shadow-none focus:bg-background"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", ...EVENT_TYPES] as const).map((type) => {
                const isActive = eventFilter === type;
                const config = type !== "all" ? getEventTypeConfig(type, t) : null;
                return (
                  <button
                    key={type}
                    onClick={() => setEventFilter(type)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {config && <span>{config.icon}</span>}
                    {type === "all" ? t("common.all") : config?.label}
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className={cn(
                        "rounded-full px-1.5 py-px text-[9px] font-semibold",
                        isActive && "bg-primary-foreground/15 text-primary-foreground",
                      )}
                    >
                      {type === "all" ? evenements.length : (stats.byType[type] ?? 0)}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {eventsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/50 shadow-sm">
                  <div className="flex gap-4 p-5">
                    <div className="w-20 shrink-0 space-y-2">
                      <div className="h-3 w-full animate-pulse rounded bg-muted" />
                      <div className="h-8 w-full animate-pulse rounded-lg bg-muted" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-3/4 animate-pulse rounded-lg bg-muted" />
                      <div className="h-3 w-full animate-pulse rounded-lg bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded-lg bg-muted" />
                      <div className="flex gap-3">
                        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredEvenements.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                  <Calendar className="size-8 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{t("agenda.no_events")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("agenda.no_events_hint")}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredEvenements.map((evt) => (
                <EvenementCard key={evt.id} evenement={evt} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── RDVs ─── */}
        <TabsContent value="rdvs" className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {(["all", "pending", "confirmed", "cancelled"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setRdvFilter(status)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                  rdvFilter === status
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {status !== "all" && (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      status === "pending" && "bg-amber-500",
                      status === "confirmed" && "bg-emerald-500",
                      status === "cancelled" && "bg-red-500",
                    )}
                  />
                )}
                {status === "all"
                  ? t("common.all")
                  : status === "pending"
                    ? t("agenda.rdv_pending")
                    : status === "confirmed"
                      ? t("agenda.rdv_confirmed")
                      : t("agenda.rdv_cancelled")}
                {status !== "all" && (
                  <Badge
                    variant={rdvFilter === status ? "secondary" : "outline"}
                    className={cn(
                      "rounded-full px-1.5 py-px text-[9px] font-semibold",
                      rdvFilter === status && "bg-primary-foreground/15 text-primary-foreground",
                    )}
                  >
                    {rdvs.filter((r) => r.status === status).length}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {rdvsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/50 shadow-sm">
                  <div className="flex items-center gap-4 p-5">
                    <div className="size-12 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 animate-pulse rounded-lg bg-muted" />
                      <div className="h-3 w-2/3 animate-pulse rounded-lg bg-muted" />
                    </div>
                    <div className="h-7 w-20 animate-pulse rounded-full bg-muted" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredRdvs.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                  <CalendarDays className="size-8 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{t("agenda.no_rdvs")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {rdvFilter !== "all"
                      ? t("agenda.no_rdvs_filter", {
                          status:
                            rdvFilter === "pending"
                              ? t("agenda.rdv_pending").toLowerCase()
                              : rdvFilter === "confirmed"
                                ? t("agenda.rdv_confirmed").toLowerCase()
                                : t("agenda.rdv_cancelled").toLowerCase(),
                        })
                      : t("agenda.no_rdvs_hint")}
                  </p>
                </div>
                {perms.canRequestRdv ? (
                  <Button onClick={() => setShowNewRdv(true)} className="rounded-xl">
                    <Plus className="mr-2 size-4" />
                    {t("agenda.request_rdv")}
                  </Button>
                ) : (
                  <Button onClick={() => setShowConversion(true)} className="rounded-xl border-amber-500/50 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
                    <Crown className="mr-2 size-4" />
                    {t("agenda.request_rdv")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRdvs.map((rdv) => (
                <RdvCard
                  key={rdv.id}
                  rdv={rdv}
                  myUserId={myUserId}
                  onAccept={handleAccept}
                  onRefuse={handleRefuse}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NewRdvDialog open={showNewRdv} onOpenChange={setShowNewRdv} onCreate={createRdv} />
      <ConversionModal open={showConversion} onOpenChange={setShowConversion} />
    </div>
  );
}
