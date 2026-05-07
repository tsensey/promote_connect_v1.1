"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { supabaseClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardStats {
  networkSize: number;
  conversationCount: number;
  upcomingCount: number;
  productCount: number;
}

interface UpcomingEvent {
  id: string;
  titre: string;
  type: string | null;
  pavillon: string | null;
  starts_at: string;
}

interface RecentConversation {
  id: string;
  other_name: string;
  last_message: string | null;
  last_message_at: string | null;
}

interface SpotlightExposant {
  id: string;
  nom: string;
  description: string | null;
  secteur: string | null;
  pays: string | null;
  pavillon: string | null;
  is_featured: boolean | null;
}

interface ExposantSnapshot {
  id: string;
  nom: string;
  secteur: string | null;
  produitsCount: number;
}

interface DashboardData {
  stats: DashboardStats;
  upcomingEvents: UpcomingEvent[];
  recentConversations: RecentConversation[];
  spotlightExposants: SpotlightExposant[];
  exposantSnapshot: ExposantSnapshot | null;
}

const quickActions = [
  { label: "Explorer l annuaire", href: "/annuaire" },
  { label: "Ouvrir la messagerie", href: "/chat" },
  { label: "Consulter l agenda", href: "/agenda" },
];

export default function DashboardHome() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !profile) {
        return;
      }

      setLoading(true);

      let exposantSnapshot: ExposantSnapshot | null = null;

      if (profile.role === "exposant") {
        const { data: exposant } = await supabaseClient
          .from("exposants")
          .select("id, nom, secteur")
          .eq("profile_id", user.id)
          .single();

        if (exposant) {
          const { count } = await supabaseClient
            .from("produits")
            .select("id", { count: "exact", head: true })
            .eq("exposant_id", exposant.id);

          exposantSnapshot = {
            id: exposant.id,
            nom: exposant.nom,
            secteur: exposant.secteur,
            produitsCount: count || 0,
          };
        }
      }

      const [
        networkRes,
        conversationsRes,
        eventsRes,
        spotlightRes,
        upcomingRes,
        conversationsListRes,
      ] = await Promise.all([
        supabaseClient
          .from("exposants")
          .select("id", { count: "exact", head: true }),
        supabaseClient
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`),
        supabaseClient
          .from("evenements")
          .select("id", { count: "exact", head: true })
          .gte("starts_at", new Date().toISOString()),
        supabaseClient
          .from("exposants")
          .select("id, nom, description, secteur, pays, pavillon, is_featured")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(4),
        supabaseClient
          .from("evenements")
          .select("id, titre, type, pavillon, starts_at")
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true })
          .limit(5),
        supabaseClient
          .from("conversations")
          .select("*")
          .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
          .order("last_message_at", { ascending: false })
          .limit(4),
      ]);

      const recentConversations: RecentConversation[] = [];

      for (const conversation of conversationsListRes.data || []) {
        const otherId =
          conversation.participant_a === user.id
            ? conversation.participant_b
            : conversation.participant_a;

        if (!otherId) {
          continue;
        }

        const [{ data: otherProfile }, { data: lastMessage }] =
          await Promise.all([
            supabaseClient
              .from("profiles")
              .select("full_name")
              .eq("id", otherId)
              .single(),
            supabaseClient
              .from("messages")
              .select("content, created_at")
              .eq("conversation_id", conversation.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single(),
          ]);

        recentConversations.push({
          id: conversation.id,
          other_name: otherProfile?.full_name || "Contact PROMOTE",
          last_message: lastMessage?.content || null,
          last_message_at:
            lastMessage?.created_at || conversation.last_message_at,
        });
      }

      setData({
        stats: {
          networkSize: networkRes.count || 0,
          conversationCount: conversationsRes.count || 0,
          upcomingCount: eventsRes.count || 0,
          productCount: exposantSnapshot?.produitsCount || 0,
        },
        upcomingEvents: upcomingRes.data || [],
        recentConversations,
        spotlightExposants: spotlightRes.data || [],
        exposantSnapshot,
      });
      setLoading(false);
    };

    void loadData();
  }, [profile, user]);

  if (loading || !data || !profile) {
    return (
      <div className="shell-grid">
        <div className="space-y-6">
          <div className="surface-panel h-72 animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="surface-panel h-48 animate-pulse" />
          <div className="surface-panel h-72 animate-pulse" />
          <div className="surface-panel h-64 animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="surface-panel h-72 animate-pulse" />
          <div className="surface-panel h-60 animate-pulse" />
        </div>
      </div>
    );
  }

  const roleLabel = profile.role === "exposant" ? "Exposant" : "Visiteur";
  return (
    <div className="shell-grid">
      <section className="space-y-6">
        <Card className="surface-panel overflow-hidden border-0">
          <div className="brand-gradient h-24" />
          <CardContent className="-mt-10 space-y-5 p-6">
            <Avatar className="size-20 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-white text-xl font-semibold text-primary">
                {profile.full_name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl text-foreground">{profile.full_name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.company || "Participant PROMOTE-CONNECT"}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-muted/65 px-4 py-3">
                <span className="text-muted-foreground">Role</span>
                <Badge variant="secondary" className="rounded-full">
                  {roleLabel}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted/65 px-4 py-3">
                <span className="text-muted-foreground">Statut acces</span>
                <span className="font-medium text-foreground">Actif</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel border-0">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                Raccourcis
              </p>
              <h3 className="mt-2 text-2xl text-foreground">
                Vos actions du jour
              </h3>
            </div>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full justify-between rounded-2xl bg-white/80",
                  )}
                >
                  {action.label}
                  <ArrowRight className="size-4" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <Card className="surface-panel overflow-hidden border-0">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-3">
                <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                  <Sparkles className="mr-1 size-3.5" />
                  Hub de networking PROMOTE
                </Badge>
                <div>
                  <h1 className="text-4xl text-foreground">
                    Bonjour, {profile.full_name?.split(" ")[0] || "participant"}
                    .
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                    Retrouvez ici vos conversations, les prochains rendez-vous
                    et les exposants a suivre pour prolonger la dynamique du
                    salon toute l&apos;annee.
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-primary/12 bg-primary/6 px-5 py-4 text-sm">
                <p className="font-semibold text-primary">
                  Compte supervise par l&apos;admin
                </p>
                <p className="mt-1 text-muted-foreground">
                  Creation des acces et diffusion des identifiants centralisees.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Users}
                label="Exposants disponibles"
                value={data.stats.networkSize}
                tone="blue"
              />
              <MetricCard
                icon={MessageSquare}
                label="Conversations ouvertes"
                value={data.stats.conversationCount}
                tone="emerald"
              />
              <MetricCard
                icon={CalendarDays}
                label="Evenements a venir"
                value={data.stats.upcomingCount}
                tone="amber"
              />
              <MetricCard
                icon={BriefcaseBusiness}
                label={
                  profile.role === "exposant"
                    ? "Produits publies"
                    : "Espace business"
                }
                value={
                  profile.role === "exposant"
                    ? data.stats.productCount
                    : data.stats.networkSize
                }
                tone="violet"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel border-0">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Opportunites
                </p>
                <h2 className="mt-2 text-3xl text-foreground">
                  Exposants a suivre
                </h2>
              </div>
              <Link
                href="/annuaire"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "rounded-full",
                )}
              >
                Voir tout
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {data.spotlightExposants.map((exposant) => (
                <Link
                  key={exposant.id}
                  href={`/annuaire/${exposant.id}`}
                  className="surface-subtle flex flex-col gap-4 p-5 transition hover:border-primary/25 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl text-foreground">
                        {exposant.nom}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {exposant.secteur || "Secteur non renseigne"}
                      </p>
                    </div>
                    {exposant.is_featured && (
                      <Badge className="rounded-full bg-primary text-primary-foreground">
                        En vue
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {exposant.description ||
                      "Nouvelle presence entreprise sur PROMOTE-CONNECT. Ouvrez la fiche pour voir les produits, la societe et les contacts."}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {exposant.pays || "International"}
                      {exposant.pavillon
                        ? ` - Pavillon ${exposant.pavillon}`
                        : ""}
                    </span>
                    <span className="font-medium text-primary">Consulter</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel border-0">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Messagerie
                </p>
                <h2 className="mt-2 text-3xl text-foreground">
                  Conversations recentes
                </h2>
              </div>
              <Link
                href="/chat"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "rounded-full",
                )}
              >
                Ouvrir le chat
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {data.recentConversations.length === 0 ? (
                <div className="surface-subtle p-5 text-sm text-muted-foreground">
                  Aucune conversation pour le moment. Lancez un premier contact
                  depuis l&apos;annuaire exposants.
                </div>
              ) : (
                data.recentConversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/chat/${conversation.id}`}
                    className="surface-subtle flex items-start gap-4 p-4 transition hover:border-primary/25 hover:bg-white"
                  >
                    <Avatar className="size-11 border border-border/70">
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {conversation.other_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {conversation.other_name}
                        </p>
                        {conversation.last_message_at && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {new Date(
                              conversation.last_message_at,
                            ).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {conversation.last_message || "Conversation ouverte"}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <Card className="surface-panel border-0">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                Agenda
              </p>
              <h2 className="mt-2 text-3xl text-foreground">
                Prochains rendez-vous
              </h2>
            </div>
            <div className="space-y-3">
              {data.upcomingEvents.length === 0 ? (
                <div className="surface-subtle p-5 text-sm text-muted-foreground">
                  Aucun evenement programme. L&apos;administration publiera les
                  prochains temps forts ici.
                </div>
              ) : (
                data.upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href="/agenda"
                    className="surface-subtle block p-4 transition hover:border-primary/25 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {event.titre}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {event.type || "Session"}
                          {event.pavillon
                            ? ` - Pavillon ${event.pavillon}`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>
                          {new Date(event.starts_at).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </p>
                        <p>
                          {new Date(event.starts_at).toLocaleTimeString(
                            "fr-FR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel border-0">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                Focus business
              </p>
              <h2 className="mt-2 text-3xl text-foreground">
                {profile.role === "exposant"
                  ? "Votre vitrine"
                  : "Votre presence"}
              </h2>
            </div>

            {profile.role === "exposant" && data.exposantSnapshot ? (
              <div className="surface-subtle space-y-4 p-5">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {data.exposantSnapshot.nom}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.exposantSnapshot.secteur || "Secteur non renseigne"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/85 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Produits
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {data.exposantSnapshot.produitsCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/85 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Portee
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {data.stats.networkSize}
                    </p>
                  </div>
                </div>
                <Link
                  href="/vitrine/mes-produits"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full rounded-2xl",
                  )}
                >
                  Gerer ma vitrine
                </Link>
              </div>
            ) : (
              <div className="surface-subtle space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <TrendingUp className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">
                      Reseau en croissance
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {data.stats.networkSize} exposants sont deja accessibles
                      pour vos prises de contact et vos rendez-vous B2B.
                    </p>
                  </div>
                </div>
                <Link
                  href="/annuaire"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full rounded-2xl bg-white/85",
                  )}
                >
                  Trouver des exposants
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="surface-panel border-0">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <Clock3 className="size-5 text-primary" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Rappel
                </p>
                <p className="text-sm text-muted-foreground">
                  Tous les acces sont crees par l&apos;administrateur et envoyes
                  par email.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "blue" | "emerald" | "amber" | "violet";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
        </div>
        <div
          className={`flex size-12 items-center justify-center rounded-2xl ${styles[tone]}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
