"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { STATUS_STYLES, STATUS_DOTS, formatDateFull, formatTime } from "@/lib/agenda/utils";
import type { EnrichedRdv } from "@/hooks/useAgenda";

interface RdvCardProps {
  rdv: EnrichedRdv;
  myUserId: string | undefined;
  onAccept: (id: string) => void;
  onRefuse: (id: string) => void;
  onCancel: (id: string) => void;
}

export function RdvCard({ rdv, myUserId, onAccept, onRefuse, onCancel }: RdvCardProps) {
  const { t, locale } = useTranslation();
  const isPendingForMe = rdv.status === "pending" && rdv.destinataire_id === myUserId;
  const date = new Date(rdv.starts_at);
  const isPast = date < new Date();

  return (
    <Card
      className={cn(
        "overflow-hidden border transition-all duration-200 ",
        isPendingForMe
          ? "border-amber-200/60 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800/40"
          : "border-border/50",
        rdv.status === "cancelled" && "opacity-60",
      )}
    >
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              className={cn(
                "size-12 shrink-0 ring-2",
                rdv.status === "confirmed"
                  ? "ring-emerald-200/60 dark:ring-emerald-800/40"
                  : rdv.status === "cancelled"
                    ? "ring-red-200/60 dark:ring-red-800/40"
                    : "ring-amber-200/60 dark:ring-amber-800/40",
              )}
            >
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
                  {formatDateFull(rdv.starts_at, locale)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {formatTime(rdv.starts_at, locale)}
                  {" - "}
                  {formatTime(rdv.ends_at, locale)}
                </span>
              </div>
              {rdv.notes && (
                <p className="mt-1.5 text-sm text-muted-foreground/80 line-clamp-1">
                  {rdv.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Badge
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                STATUS_STYLES[rdv.status || "pending"],
              )}
            >
              <span className={cn("size-1.5 rounded-full", STATUS_DOTS[rdv.status || "pending"])} />
              {rdv.status === "pending" && t("agenda.rdv_pending")}
              {rdv.status === "confirmed" && t("agenda.rdv_confirmed")}
              {rdv.status === "cancelled" && t("agenda.rdv_cancelled")}
            </Badge>

            {rdv.status === "pending" && rdv.destinataire_id === myUserId && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-emerald-200 bg-emerald-50/80 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400"
                  onClick={() => onAccept(rdv.id)}
                >
                  <Check className="mr-1 size-4" /> {t("agenda.rdv_accept")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-red-200 bg-red-50/80 text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400"
                  onClick={() => onRefuse(rdv.id)}
                >
                  <X className="mr-1 size-4" /> {t("agenda.rdv_refuse")}
                </Button>
              </div>
            )}

            {rdv.status === "confirmed" && !isPast && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={() => onCancel(rdv.id)}
              >
                <X className="mr-1 size-3.5" />
                {t("agenda.rdv_cancel")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
