export type Speaker = { name: string; title?: string; company?: string };

export const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-amber-50/80 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300",
  confirmed:
    "bg-emerald-50/80 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  cancelled:
    "bg-red-50/80 text-red-700 border-red-200/60 dark:bg-red-950/30 dark:text-red-300",
};

export const STATUS_DOTS: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

export const EVENT_TYPES = [
  "conference",
  "atelier",
  "networking",
  "keynote",
  "panel",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export function getEventTypeConfig(
  type: string | null,
  t: (key: string) => string,
): { label: string; gradient: string; icon: string } | null {
  const configs: Record<string, { labelKey: string; gradient: string; icon: string }> = {
    conference: { labelKey: "agenda.event_conference", gradient: "from-blue-500/20 to-blue-500/5", icon: "Mic" },
    atelier: { labelKey: "agenda.event_atelier", gradient: "from-emerald-500/20 to-emerald-500/5", icon: "Wrench" },
    networking: { labelKey: "agenda.event_networking", gradient: "from-violet-500/20 to-violet-500/5", icon: "Handshake" },
    keynote: { labelKey: "agenda.event_keynote", gradient: "from-amber-500/20 to-amber-500/5", icon: "Star" },
    panel: { labelKey: "agenda.event_panel", gradient: "from-rose-500/20 to-rose-500/5", icon: "MessageSquare" },
  };
  if (!type || !configs[type]) return null;
  const cfg = configs[type];
  return { label: t(cfg.labelKey), gradient: cfg.gradient, icon: cfg.icon };
}

export function formatDate(dateStr: string, locale: string) {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", { day: "numeric" }),
    month: d.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", { month: "short" }),
    weekday: d.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", { weekday: "short" }),
    timeStart: d.toLocaleTimeString(locale === "en" ? "en-US" : "fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    timeEnd: d.toLocaleTimeString(locale === "en" ? "en-US" : "fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function formatDateShort(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function formatTime(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleTimeString(locale === "en" ? "en-US" : "fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateFull(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function parseSpeakers(speakers: unknown): Speaker[] {
  if (!speakers) return [];
  if (Array.isArray(speakers)) return speakers as Speaker[];
  try {
    return JSON.parse(speakers as string) as Speaker[];
  } catch {
    return [];
  }
}
