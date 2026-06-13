"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  Users,
  Loader2,
  Mic, Wrench, Handshake, Star, MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { useTranslation } from "@/lib/i18n";
import { getEventTypeConfig, formatDate, parseSpeakers } from "@/lib/agenda/utils";
import type { Speaker } from "@/lib/agenda/utils";
import type { Database } from "@/types/database.types";

type Evenement = Database["public"]["Tables"]["evenements"]["Row"];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Mic, Wrench, Handshake, Star, MessageSquare,
};

function RenderEventIcon({ iconName, className = "size-4" }: { iconName: string; className?: string }) {
  const Icon = ICON_MAP[iconName];
  return Icon ? <Icon className={className} /> : null;
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const [event, setEvent] = useState<Evenement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const fetchEvent = async () => {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from("evenements")
        .select("*")
        .eq("id", eventId)
        .single();
      if (error) {
        setError(error.message);
      } else {
        setEvent(data);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <CalendarDays className="mx-auto mb-4 size-12 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold">{t("agenda.event_not_found")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error || t("agenda.event_not_found_desc")}</p>
        <Button onClick={() => router.push("/agenda")} className="mt-6 rounded-xl">
          <ArrowLeft className="mr-2 size-4" /> {t("agenda.back_to_agenda")}
        </Button>
      </div>
    );
  }

  const typeConfig = event.type ? getEventTypeConfig(event.type, t) : null;
  const date = formatDate(event.starts_at, locale);
  const endTime = new Date(event.ends_at).toLocaleTimeString(
    locale === "en" ? "en-US" : "fr-FR",
    { hour: "2-digit", minute: "2-digit" },
  );
  const speakers: Speaker[] = parseSpeakers(event.speakers);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/agenda")}
        className="rounded-xl"
      >
        <ArrowLeft className="mr-2 size-4" />
        {t("agenda.tab_programme")}
      </Button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-background border border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            {/* Date badge */}
            <div className="flex shrink-0 flex-col items-center rounded-2xl border border-border/60 bg-muted/30 px-6 py-4 text-center sm:w-24">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {date.month}
              </span>
              <span className="mt-0.5 text-3xl font-bold leading-none text-foreground">
                {date.day}
              </span>
              <span className="mt-1 text-xs text-muted-foreground/60">
                {date.weekday}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {event.titre}
                </h1>
                {typeConfig && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/60 text-xs font-medium"
                  >
                    <RenderEventIcon iconName={typeConfig.icon} className="mr-1 size-4" />
                    {typeConfig.label}
                  </Badge>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground/70">
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4" />
                  {date.timeStart} - {endTime}
                </span>
                {event.pavillon && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="size-4" />
                    {t("annuaire.pavillon", { pavillon: event.pavillon })}
                    {event.salle && ` — ${event.salle}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Description */}
        <div className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t("agenda.event_description")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground/80">
                {event.description || t("agenda.no_description")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Infos sidebar */}
        <div className="space-y-4">
          {/* Lieu */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="size-4 text-muted-foreground" />
                {t("agenda.event_location")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-0 text-sm text-muted-foreground">
              {event.pavillon && <p>{t("annuaire.pavillon", { pavillon: event.pavillon })}</p>}
              {event.salle && <p>{t("agenda.room_label")} {event.salle}</p>}
              {!event.pavillon && <p>{t("agenda.not_communicated")}</p>}
            </CardContent>
          </Card>

          {/* Horaires */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="size-4 text-muted-foreground" />
                {t("agenda.event_schedule")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-0 text-sm text-muted-foreground">
              <p>{t("agenda.event_start")} {date.timeStart}</p>
              <p>{t("agenda.event_end")} {endTime}</p>
            </CardContent>
          </Card>

          {/* Contact pour RDV */}
          {user && (
            <Button
              className="w-full rounded-xl"
              onClick={() => router.push("/agenda")}
            >
              <Users className="mr-2 size-4" />
              {t("agenda.request_meeting")}
            </Button>
          )}
        </div>
      </div>

      {/* Speakers */}
      {speakers.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="size-5 text-muted-foreground" />
              {t("agenda.speakers_count", { count: speakers.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {speakers.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
                >
                  <Avatar className="size-10 border-2 border-border/30">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {s?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{s?.name || t("agenda.speaker_default")}</p>
                    {s.title && (
                      <p className="truncate text-xs text-muted-foreground/70">{s.title}</p>
                    )}
                    {s.company && (
                      <p className="truncate text-xs text-muted-foreground/60">{s.company}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
