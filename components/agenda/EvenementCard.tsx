"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { getEventTypeConfig, formatDate, parseSpeakers } from "@/lib/agenda/utils";
import type { Speaker } from "@/lib/agenda/utils";
import type { Database } from "@/types/database.types";

type Evenement = Database["public"]["Tables"]["evenements"]["Row"];

interface EvenementCardProps {
  evenement: Evenement;
}

export function EvenementCard({ evenement: evt }: EvenementCardProps) {
  const { t, locale } = useTranslation();
  const typeConfig = evt.type ? getEventTypeConfig(evt.type, t) : null;
  const date = formatDate(evt.starts_at, locale);
  const endTime = new Date(evt.ends_at).toLocaleTimeString(
    locale === "en" ? "en-US" : "fr-FR",
    { hour: "2-digit", minute: "2-digit" },
  );
  const speakers: Speaker[] = parseSpeakers(evt.speakers);

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/50 transition-all duration-200",
        "hover:hover:-translate-y-0.5",
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row">
          <div
            className={cn(
              "flex shrink-0 flex-col items-center rounded-xl border px-4 py-3 text-center sm:w-20",
              typeConfig
                ? `bg-gradient-to-b ${typeConfig.gradient} border-border/60`
                : "border-border/60 bg-muted/30",
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {date.month}
            </span>
            <span className="mt-0.5 text-2xl font-bold leading-none text-foreground">
              {date.day}
            </span>
            <span className="mt-1 text-[10px] text-muted-foreground/60">
              {date.weekday}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="leading-snug text-base font-semibold text-foreground transition-colors">
                    {evt.titre}
                  </h3>
                  {typeConfig && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/60 text-[10px] font-medium"
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

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground/70">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {date.timeStart} - {endTime}
              </span>
              {evt.pavillon && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {t("annuaire.pavillon", { pavillon: evt.pavillon })}
                  {evt.salle && t("agenda.event_room", { room: evt.salle })}
                </span>
              )}
            </div>

            {speakers.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {speakers.map((s, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1"
                  >
                    <User className="size-3 text-muted-foreground/60" />
                    <span className="text-[11px] font-medium text-foreground/80">{s.name}</span>
                    {s.title && (
                      <span className="text-[10px] text-muted-foreground/60">
                        · {s.title}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
