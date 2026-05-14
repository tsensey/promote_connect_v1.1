"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
  Building2,
  Clock,
  MapPin,
  Send,
  Eye,
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

const getQuickActions = (role: string) => [
  { label: role === "exposant" ? "Prospecter (Annuaire)" : "Explorer l annuaire", href: "/annuaire", icon: Users },
  { label: role === "exposant" ? "Gerer mes leads" : "Ouvrir la messagerie", href: "/chat", icon: MessageSquare },
  { label: role === "exposant" ? "Mon planning B2B" : "Consulter l agenda", href: "/agenda", icon: CalendarDays },
];

export default function DashboardHome() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !profile) return;

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
        supabaseClient.from("exposants").select("id", { count: "exact", head: true }),
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

        if (!otherId) continue;

        const [{ data: otherProfile }, { data: lastMessage }] =
          await Promise.all([
            supabaseClient.from("profiles").select("full_name").eq("id", otherId).single(),
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
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[280px_1fr_320px]">
        <div className="space-y-6">
          <div className="surface-panel h-48 animate-pulse" />
          <div className="surface-panel h-72 animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="surface-panel h-72 animate-pulse" />
          <div className="surface-panel h-64 animate-pulse" />
        </div>
        <div className="hidden xl:block space-y-6">
          <div className="surface-panel h-80 animate-pulse" />
          <div className="surface-panel h-60 animate-pulse" />
        </div>
      </div>
    );
  }

  const roleLabel = profile.role === "exposant" ? "Exposant" : "Visiteur";
  const firstName = profile.full_name?.split(" ")[0] || "participant";

  return (
    <div className="grid gap-6 ">
      <section className="space-y-6">
        <Card className="surface-panel overflow-hidden border-0 py-0">
          <div className="brand-gradient relative px-6 pb-12 pt-8">
            <Badge className="mb-4 inline-flex rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/20">
              <Sparkles className="mr-1 size-3.5" />
              Hub de networking PROMOTE
            </Badge>
            <h1 className="text-3xl font-heading font-extrabold text-white sm:text-4xl">
              Bonjour, {firstName}.
            </h1>
            <p className="mt-3 max-w-xl text-base text-white/80">
              Retrouvez ici vos conversations, les prochains rendez-vous et les
              exposants a suivre pour prolonger la dynamique du salon toute
              l&apos;annee.
            </p>
          </div>
          <CardContent className="relative -mt-6 space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Users}
                label={profile.role === "exposant" ? "Reseau exposants" : "Exposants disponibles"}
                value={data.stats.networkSize}
                tone="blue"
              />
              <MetricCard
                icon={MessageSquare}
                label={profile.role === "exposant" ? "Contacts & Leads" : "Conversations ouvertes"}
                value={data.stats.conversationCount}
                tone="emerald"
              />
              <MetricCard
                icon={CalendarDays}
                label={profile.role === "exposant" ? "Rendez-vous B2B" : "Evenements a venir"}
                value={data.stats.upcomingCount}
                tone="amber"
              />
              <MetricCard
                icon={BriefcaseBusiness}
                label={profile.role === "exposant" ? "Produits en vitrine" : "Espace business"}
                value={profile.role === "exposant" ? data.stats.productCount : data.stats.networkSize}
                tone="violet"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {getQuickActions(profile.role || "visiteur").map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "group h-auto gap-3 rounded-xl border-border/70 bg-white/80 px-5 py-4 shadow-sm transition-all hover:border-primary/30 hover:bg-white hover:shadow-md",
                  )}
                >
                  <action.icon className="size-5 text-primary" />
                  <span className="flex-1 text-left text-sm font-medium">{action.label}</span>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel border-0">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Opportunites
                </p>
                <h2 className="mt-1 text-2xl font-heading text-foreground">
                  Exposants a suivre
                </h2>
              </div>
              <Link
                href="/annuaire"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "rounded-full text-sm",
                )}
              >
                Voir tout
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {data.spotlightExposants.map((exposant) => (
                <Link
                  key={exposant.id}
                  href={`/annuaire/${exposant.id}`}
                  className="surface-subtle group flex flex-col gap-3 p-5 transition-all hover:border-primary/30 hover:bg-white hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                        {exposant.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
                          {exposant.nom}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {exposant.secteur || "Secteur non renseigne"}
                        </p>
                      </div>
                    </div>
                    {exposant.is_featured && (
                      <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/15">
                        En vue
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {exposant.description ||
                      "Nouvelle presence entreprise sur PROMOTE-CONNECT."}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {exposant.pays || "International"}
                    </span>
                    {exposant.pavillon && (
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3" />
                        Pavillon {exposant.pavillon}
                      </span>
                    )}
                    <span className="ml-auto text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Voir la fiche &rarr;
                    </span>
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
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Messagerie
                </p>
                <h2 className="mt-1 text-2xl font-heading text-foreground">
                  Conversations recentes
                </h2>
              </div>
              <Link
                href="/chat"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "rounded-full text-sm",
                )}
              >
                Ouvrir le chat
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="space-y-2">
              {data.recentConversations.length === 0 ? (
                <div className="surface-subtle flex items-center gap-3 p-5 text-sm text-muted-foreground">
                  <Send className="size-5 shrink-0 text-primary/50" />
                  <span>
                    Aucune conversation pour le moment. Lancez un premier contact
                    depuis l&apos;annuaire exposants.
                  </span>
                </div>
              ) : (
                data.recentConversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/chat/${conversation.id}`}
                    className="surface-subtle group flex items-center gap-4 p-4 transition-all hover:border-primary/25 hover:bg-white hover:shadow-sm"
                  >
                    <Avatar className="size-11 border-2 border-border/50">
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {conversation.other_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
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
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
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
        <Card className="surface-panel overflow-hidden border-0 py-0">
          <div className="brand-gradient px-6 py-5">
            <div className="flex items-center gap-3">
              <Avatar className="size-14 border-2 border-white/50 shadow-lg">
                <AvatarFallback className="bg-white/20 text-lg font-semibold text-white backdrop-blur-sm">
                  {profile.full_name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="text-lg font-heading font-bold">{profile.full_name}</p>
                <p className="text-sm text-white/80">
                  {profile.company || "Participant PROMOTE-CONNECT"}
                </p>
              </div>
            </div>
          </div>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary" className="rounded-full">
                {roleLabel}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3">
              <span className="text-sm text-muted-foreground">Statut acces</span>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-foreground">Actif</span>
              </div>
            </div>

            <div className="rounded-xl border border-primary/10 bg-primary/[0.04] px-4 py-3">
              <p className="text-xs font-bold text-primary">
                Compte supervise par l&apos;admin
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Creation des acces et diffusion des identifiants centralisees.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel border-0">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Agenda
              </p>
              <h2 className="mt-1 text-2xl font-heading text-foreground">
                Prochains evenements
              </h2>
            </div>
            <div className="space-y-2">
              {data.upcomingEvents.length === 0 ? (
                <div className="surface-subtle flex items-center gap-3 p-4 text-sm text-muted-foreground">
                  <CalendarDays className="size-5 shrink-0 text-primary/50" />
                  <span>
                    Aucun evenement programme.
                  </span>
                </div>
              ) : (
                data.upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href="/agenda"
                    className="surface-subtle group block p-4 transition-all hover:border-primary/25 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex shrink-0 flex-col items-center rounded-xl border border-border/60 bg-white px-3 py-2 text-center">
                        <span className="text-xs font-bold uppercase text-primary">
                          {new Date(event.starts_at).toLocaleDateString("fr-FR", { month: "short" })}
                        </span>
                        <span className="text-lg font-bold text-foreground">
                          {new Date(event.starts_at).toLocaleDateString("fr-FR", { day: "numeric" })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                          {event.titre}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {new Date(event.starts_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {event.type && <> &middot; {event.type}</>}
                          {event.pavillon && <> &middot; Pavillon {event.pavillon}</>}
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Focus business
              </p>
              <h2 className="mt-1 text-2xl font-heading text-foreground">
                {profile.role === "exposant" ? "Votre vitrine" : "Votre presence"}
              </h2>
            </div>

            {profile.role === "exposant" && data.exposantSnapshot ? (
              <div className="space-y-4">
                <div className="surface-subtle space-y-4 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="size-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading text-lg font-semibold text-foreground">
                        {data.exposantSnapshot.nom}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {data.exposantSnapshot.secteur || "Secteur non renseigne"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Produits
                      </p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {data.exposantSnapshot.produitsCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Portee
                      </p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {data.stats.networkSize}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/exposant/ma-vitrine"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md transition-all hover:shadow-lg",
                    )}
                  >
                    <Eye className="size-4" />
                    Gerer ma vitrine
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
                      "w-full rounded-xl bg-white/85",
                    )}
                  >
                    <Users className="size-4" />
                    Trouver des exposants
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="surface-panel border-0">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Rappel</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Tous les acces sont crees par l&apos;administrateur et envoyes
                par email.
              </p>
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
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  };

  const bgStyles = {
    blue: "bg-blue-50",
    emerald: "bg-emerald-50",
    amber: "bg-amber-50",
    violet: "bg-violet-50",
  };

  return (
    <div className="group rounded-xl border border-border/60 bg-white/90 p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-heading font-bold text-foreground">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl shadow-sm",
            bgStyles[tone],
            styles[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
