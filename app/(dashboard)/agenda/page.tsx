"use client";

import { useState, useEffect, useMemo } from "react";
import { useEvenements, useRendezVous } from "@/hooks/useAgenda";
import { useAuth } from "@/lib/auth/context";
import { supabaseClient } from "@/lib/supabase/client";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  X,
  Check,
  Search,
  CalendarDays,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

type Speaker = { name: string; title?: string; company?: string };

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50/80 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300",
  confirmed: "bg-emerald-50/80 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  cancelled: "bg-red-50/80 text-red-700 border-red-200/60 dark:bg-red-950/30 dark:text-red-300",
};

const STATUS_DOTS: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

const EVENT_TYPES = ["conference", "atelier", "networking", "keynote", "panel"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString("fr-FR", { day: "numeric" }),
    month: d.toLocaleDateString("fr-FR", { month: "short" }),
    weekday: d.toLocaleDateString("fr-FR", { weekday: "short" }),
    timeStart: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    timeEnd: new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function AgendaPage() {
  const { evenements, loading: eventsLoading } = useEvenements();
  const {
    rdvs,
    loading: rdvsLoading,
    createRdv,
    updateRdvStatus,
  } = useRendezVous();
  const [showNewRdv, setShowNewRdv] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [rdvFilter, setRdvFilter] = useState<string>("all");
  const [eventSearch, setEventSearch] = useState("");
  const { user } = useAuth();
  const myUserId = user?.id;
  const { t } = useTranslation();

  const STATUS_LABELS: Record<string, string> = {
    pending: t('agenda.rdv_pending'),
    confirmed: t('agenda.rdv_confirmed'),
    cancelled: t('agenda.rdv_cancelled'),
  };

  const EVENT_TYPE_CONFIG: Record<string, { label: string; gradient: string; icon: string }> = {
    conference:  { label: t('agenda.event_conference'), gradient: "from-blue-500/20 to-blue-500/5", icon: "🎤" },
    atelier:     { label: t('agenda.event_atelier'), gradient: "from-emerald-500/20 to-emerald-500/5", icon: "🔧" },
    networking:  { label: t('agenda.event_networking'), gradient: "from-violet-500/20 to-violet-500/5", icon: "🤝" },
    keynote:     { label: t('agenda.event_keynote'), gradient: "from-amber-500/20 to-amber-500/5", icon: "⭐" },
    panel:       { label: t('agenda.event_panel'), gradient: "from-rose-500/20 to-rose-500/5", icon: "💬" },
  };

  const filteredEvenements = useMemo(() => {
    return evenements
      .filter((evt) => eventFilter === "all" || evt.type === eventFilter)
      .filter(
        (evt) =>
          eventSearch === "" ||
          evt.titre.toLowerCase().includes(eventSearch.toLowerCase()) ||
          evt.description?.toLowerCase().includes(eventSearch.toLowerCase()),
      );
  }, [evenements, eventFilter, eventSearch]);

  const filteredRdvs = useMemo(() => {
    return rdvs.filter((rdv) => rdvFilter === "all" || rdv.status === rdvFilter);
  }, [rdvs, rdvFilter]);

  const upcomingRdvs = useMemo(
    () =>
      rdvs.filter(
        (rdv) =>
          rdv.status === "confirmed" && new Date(rdv.starts_at) >= new Date(),
      ),
    [rdvs],
  );

  const stats = useMemo(() => ({
    total: evenements.length,
    byType: Object.fromEntries(
      EVENT_TYPES.map((t) => [t, evenements.filter((e) => e.type === t).length])
    ),
  }), [evenements]);

  return (
    <div className="space-y-8 pb-8 max-w-6xl mx-auto">
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
                  {t('agenda.title')}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {evenements.length > 0
                    ? t('agenda.subtitle', { events: evenements.length, rdvs: rdvs.length })
                    : t('agenda.desc')}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowNewRdv(true)}
              className="rounded-xl whitespace-nowrap shadow-sm"
            >
              <Plus className="mr-2 size-4" />
              {t('agenda.request_rdv')}
            </Button>
          </div>
        </div>
      </div>

      {/* Prochains RDV */}
      {upcomingRdvs.length > 0 && (
        <Card className="overflow-hidden border-primary/10 shadow-sm">
          <div className="bg-gradient-to-r from-primary to-primary/80 px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <CalendarDays className="size-4" />
              {t('agenda.upcoming_rdvs')} ({upcomingRdvs.length})
            </h3>
          </div>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {upcomingRdvs.slice(0, 3).map((rdv) => (
              <div
                key={rdv.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <Avatar className="size-10 border-2 border-border/30 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {rdv.other_user?.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {rdv.other_user?.full_name || "Contact"}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {new Date(rdv.starts_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    à{" "}
                    {new Date(rdv.starts_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="programme" className="flex flex-col gap-y-2">
        <TabsList className="rounded-xl bg-muted/80 p-1 w-full sm:w-auto">
          <TabsTrigger value="programme" className="rounded-lg gap-2 data-[state=active]:shadow-sm">
            <Calendar className="size-4" />
            {t('agenda.tab_programme')}
          </TabsTrigger>
          <TabsTrigger value="rdvs" className="rounded-lg gap-2 data-[state=active]:shadow-sm">
            <Users className="size-4" />
            {t('agenda.tab_planning')}
            {rdvs.filter((r) => r.status === "pending" && r.destinataire_id === myUserId).length > 0 && (
              <Badge className="ml-1 rounded-full px-1.5 py-px text-[10px] bg-amber-500 text-white">
                {rdvs.filter((r) => r.status === "pending" && r.destinataire_id === myUserId).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Programme ─── */}
        <TabsContent value="programme" className="mt-6 space-y-4">
          {/* Filtres */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('agenda.search')}
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="h-11 rounded-xl border-border/70 bg-muted/30 pl-11 shadow-none focus:bg-background"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", ...EVENT_TYPES] as const).map((type) => {
                const isActive = eventFilter === type;
                const config = type !== "all" ? EVENT_TYPE_CONFIG[type] : null;
                return (
                  <button
                    key={type}
                    onClick={() => setEventFilter(type)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {config && <span>{config.icon}</span>}
                    {type === "all" ? t('common.all') : config?.label}
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className={cn(
                        "rounded-full px-1.5 py-px text-[9px] font-semibold",
                        isActive && "bg-primary-foreground/15 text-primary-foreground"
                      )}
                    >
                      {type === "all" ? evenements.length : (stats.byType[type] ?? 0)}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Liste */}
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
                    <p className="text-base font-semibold text-foreground">
                      {t('agenda.no_events')}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('agenda.no_events_hint')}
                    </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredEvenements.map((evt) => {
                const typeConfig = evt.type ? EVENT_TYPE_CONFIG[evt.type] : null;
                const date = formatDate(evt.starts_at);
                const endTime = new Date(evt.ends_at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const speakers: Speaker[] = evt.speakers
                  ? (Array.isArray(evt.speakers) ? evt.speakers : JSON.parse(evt.speakers as string))
                  : [];

                return (
                  <Card
                    key={evt.id}
                    className={cn(
                      "overflow-hidden border-border/50 shadow-sm transition-all duration-200",
                      "hover:shadow-md hover:-translate-y-0.5",
                    )}
                  >
                    <div className="flex flex-col gap-4 p-5 sm:flex-row">
                      {/* Date badge */}
                      <div className={cn(
                        "flex shrink-0 flex-col items-center rounded-xl border px-4 py-3 text-center sm:w-20",
                        typeConfig
                          ? `bg-gradient-to-b ${typeConfig.gradient} border-border/60`
                          : "border-border/60 bg-muted/30"
                      )}>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                          {date.month}
                        </span>
                        <span className="text-2xl font-bold text-foreground leading-none mt-0.5">
                          {date.day}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 mt-1">
                          {date.weekday}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                                {evt.titre}
                              </h3>
                              {typeConfig && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-full border-border/60 text-[10px] font-medium",
                                  )}
                                >
                                  <span className="mr-1">{typeConfig.icon}</span>
                                  {typeConfig.label}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {evt.description && (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground/80 line-clamp-2">
                            {evt.description}
                          </p>
                        )}

                        {/* Infos */}
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground/70">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="size-3.5" />
                            {date.timeStart} - {endTime}
                          </span>
                          {evt.pavillon && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="size-3.5" />
                              Pavillon {evt.pavillon}
                              {evt.salle && ` · Salle ${evt.salle}`}
                            </span>
                          )}
                        </div>

                        {/* Speakers */}
                        {speakers.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            {speakers.map((s, i) => (
                              <div key={i} className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1">
                                <User className="size-3 text-muted-foreground/60" />
                                <span className="text-[11px] font-medium text-foreground/80">{s.name}</span>
                                {s.title && (
                                  <span className="text-[10px] text-muted-foreground/60">· {s.title}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── RDVs ─── */}
        <TabsContent value="rdvs" className="mt-6 space-y-4">
          {/* Filtres statut */}
          <div className="flex flex-wrap gap-1.5">
            {(["all", "pending", "confirmed", "cancelled"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setRdvFilter(status)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                    rdvFilter === status
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {status !== "all" && (
                    <span className={cn("size-1.5 rounded-full", STATUS_DOTS[status])} />
                  )}
                  {status === "all" ? t('common.all') : STATUS_LABELS[status]}
                  {status !== "all" && (
                    <Badge
                      variant={rdvFilter === status ? "secondary" : "outline"}
                      className={cn(
                        "rounded-full px-1.5 py-px text-[9px] font-semibold",
                        rdvFilter === status && "bg-primary-foreground/15 text-primary-foreground"
                      )}
                    >
                      {rdvs.filter((r) => r.status === status).length}
                    </Badge>
                  )}
                </button>
              ),
            )}
          </div>

          {/* Liste */}
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
                  <p className="text-base font-semibold text-foreground">
                    {t('agenda.no_rdvs')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {rdvFilter !== "all"
                      ? t('agenda.no_rdvs_filter', { status: STATUS_LABELS[rdvFilter]?.toLowerCase() })
                      : t('agenda.no_rdvs_hint')}
                  </p>
                </div>
                <Button
                  onClick={() => setShowNewRdv(true)}
                  className="rounded-xl"
                >
                  <Plus className="mr-2 size-4" />
                  Demander un RDV
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRdvs.map((rdv) => {
                const isPendingForMe = rdv.status === "pending" && rdv.destinataire_id === myUserId;
                const date = new Date(rdv.starts_at);
                const endDate = new Date(rdv.ends_at);
                const isPast = date < new Date();

                return (
                  <Card
                    key={rdv.id}
                    className={cn(
                      "overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-md",
                      isPendingForMe
                        ? "border-amber-200/60 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800/40"
                        : "border-border/50",
                      rdv.status === "cancelled" && "opacity-60"
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left: avatar + info */}
                        <div className="flex items-center gap-4 min-w-0">
                          <Avatar className={cn(
                            "size-12 shrink-0 ring-2",
                            rdv.status === "confirmed" ? "ring-emerald-200/60 dark:ring-emerald-800/40" :
                            rdv.status === "cancelled" ? "ring-red-200/60 dark:ring-red-800/40" :
                            "ring-amber-200/60 dark:ring-amber-800/40"
                          )}>
                            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                              {rdv.other_user?.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-foreground">
                              {rdv.other_user?.full_name || "Contact"}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground/70">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="size-3.5" />
                                {date.toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="size-3.5" />
                                {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                {" - "}
                                {endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            {rdv.notes && (
                              <p className="mt-1.5 text-sm text-muted-foreground/80 line-clamp-1">
                                {rdv.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: status + actions */}
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          {/* Status */}
                          <Badge
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium inline-flex items-center gap-1.5",
                              STATUS_STYLES[rdv.status || "pending"],
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full", STATUS_DOTS[rdv.status || "pending"])} />
                            {STATUS_LABELS[rdv.status || "pending"]}
                          </Badge>

                          {/* Actions */}
                          {rdv.status === "pending" &&
                            rdv.destinataire_id === myUserId && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-emerald-200 bg-emerald-50/80 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400"
                                  onClick={() => {
                                    updateRdvStatus(rdv.id, "confirmed")
                                      .then(() => toast.success(t('agenda.rdv_accepted')))
                                      .catch(() => toast.error(t('agenda.rdv_accept_error')));
                                  }}
                                >
                                  <Check className="mr-1 size-4" /> {t('agenda.rdv_accept')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-red-200 bg-red-50/80 text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400"
                                  onClick={() => {
                                    updateRdvStatus(rdv.id, "cancelled")
                                      .then(() => toast.info(t('agenda.rdv_refused')))
                                      .catch(() => toast.error(t('agenda.rdv_refuse_error')));
                                  }}
                                >
                                  <X className="mr-1 size-4" /> {t('agenda.rdv_refuse')}
                                </Button>
                              </div>
                            )}

                          {rdv.status === "confirmed" && !isPast && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => {
                                updateRdvStatus(rdv.id, "cancelled")
                                  .then(() => toast.info(t('agenda.rdv_cancelled_msg')))
                                  .catch(() => toast.error(t('agenda.rdv_cancel_error')));
                              }}
                            >
                              <X className="mr-1 size-3.5" />
                              {t('agenda.rdv_cancel')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NewRdvDialog
        open={showNewRdv}
        onOpenChange={setShowNewRdv}
        onCreate={createRdv}
      />
    </div>
  );
}

function NewRdvDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    destinataireId: string,
    startsAt: string,
    endsAt: string,
    notes?: string,
  ) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [destinataireId, setDestinataireId] = useState("");
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<
    { id: string; full_name: string | null; company: string | null; avatar_url: string | null }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDestinataireId("");
      setDate("");
      setTimeStart("");
      setTimeEnd("");
      setNotes("");
      setSearchQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fetchContacts = async () => {
      const { data } = await supabaseClient
        .from("profiles")
        .select("id, full_name, company, avatar_url")
        .ilike("full_name", `%${searchQuery}%`)
        .limit(20);
      if (data) setContacts(data as typeof contacts);
    };
    fetchContacts();
  }, [open, searchQuery]);

  const handleSubmit = async () => {
    if (!destinataireId || !date || !timeStart || !timeEnd) {
      toast.error(t('agenda.rdv_form_required'));
      return;
    }

    setSubmitting(true);
    try {
      const startsAt = new Date(`${date}T${timeStart}`).toISOString();
      const endsAt = new Date(`${date}T${timeEnd}`).toISOString();
      await onCreate(destinataireId, startsAt, endsAt, notes || undefined);
      toast.success(t('agenda.rdv_form_sent'));
      onOpenChange(false);
    } catch {
      toast.error(t('agenda.rdv_form_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t('agenda.rdv_form_title')}
          </DialogTitle>
          <DialogDescription>
            {t('agenda.rdv_form_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t('agenda.rdv_form_contact')}</Label>
            <Input
              placeholder={t('agenda.rdv_form_search')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDestinataireId("");
              }}
              className="rounded-xl"
            />
            {contacts.length > 0 && !destinataireId && (
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-1">
                {contacts.map((c) => (
                  <Button
                    key={c.id}
                    variant="ghost"
                    className="w-full justify-start rounded-lg px-3 py-2.5 text-sm hover:bg-muted h-auto"
                    onClick={() => {
                      setDestinataireId(c.id);
                      setSearchQuery(c.full_name || "");
                    }}
                  >
                    <Avatar className="size-7 mr-2.5 shrink-0">
                      {c.avatar_url ? <AvatarImage src={c.avatar_url} /> : null}
                      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                        {c.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left min-w-0">
                      <p className="truncate text-sm font-medium">{c.full_name || "Contact"}</p>
                      {c.company && (
                        <p className="truncate text-xs text-muted-foreground">{c.company}</p>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">{t('agenda.rdv_form_date')}</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t('agenda.rdv_form_start')}</Label>
              <Input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t('agenda.rdv_form_end')}</Label>
              <Input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">{t('agenda.rdv_form_notes')}</Label>
            <Textarea
              placeholder={t('agenda.rdv_form_notes_placeholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl gap-1.5"
          >
            {submitting ? (
              <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> {t('agenda.rdv_form_sending')}</>
            ) : (
              t('agenda.rdv_form_send')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
