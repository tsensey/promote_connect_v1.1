'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  MessageSquare,
  Shield,
  Ticket,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

interface AdminStats {
  totalAccounts: number;
  admins: number;
  exposants: number;
  visiteurs: number;
  evenements: number;
  conversations: number;
  openTickets: number;
}

interface RecentUser {
  id: string;
  full_name: string | null;
  company: string | null;
  role: string | null;
  created_at: string | null;
}

interface RecentExposant {
  id: string;
  nom: string;
  secteur: string | null;
  pays: string | null;
  is_featured: boolean;
  created_at: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalAccounts: 0,
    admins: 0,
    exposants: 0,
    visiteurs: 0,
    evenements: 0,
    conversations: 0,
    openTickets: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentExposants, setRecentExposants] = useState<RecentExposant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [
        profilesRes,
        eventsRes,
        conversationsRes,
        ticketsRes,
        recentUsersRes,
        recentExposantsRes,
      ] = await Promise.all([
        supabaseClient.from('profiles').select('id, role', { count: 'exact' }),
        supabaseClient.from('evenements').select('id', { count: 'exact', head: true }),
        supabaseClient.from('conversations').select('id', { count: 'exact', head: true }),
        supabaseClient.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabaseClient
          .from('profiles')
          .select('id, full_name, company, role, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabaseClient
          .from('exposants')
          .select('id, nom, secteur, pays, is_featured, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const profiles = profilesRes.data || [];

      setStats({
        totalAccounts: profiles.length,
        admins: profiles.filter((profile) => profile.role === 'admin').length,
        exposants: profiles.filter((profile) => profile.role === 'exposant').length,
        visiteurs: profiles.filter((profile) => profile.role === 'visiteur').length,
        evenements: eventsRes.count || 0,
        conversations: conversationsRes.count || 0,
        openTickets: ticketsRes.count || 0,
      });

      setRecentUsers((recentUsersRes.data || []) as RecentUser[]);
      setRecentExposants((recentExposantsRes.data || []) as RecentExposant[]);
      setLoading(false);
    };

    void loadData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
          Pilotage
        </p>
        <h1 className="text-4xl text-foreground">Pilotage des acces</h1>
        <p className="mt-1 max-w-3xl text-base leading-7 text-muted-foreground">
          Tous les comptes sont provisionnes par l administrateur et disposent d un acces complet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Comptes" value={stats.totalAccounts} icon={Users} href="/admin/users" />
        <KpiCard title="Admins" value={stats.admins} icon={Shield} href="/admin/users" />
        <KpiCard title="Exposants" value={stats.exposants} icon={UserPlus} href="/admin/exposants" />
        <KpiCard title="Visiteurs" value={stats.visiteurs} icon={Users} href="/admin/users" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MiniCard label="Evenements publies" value={stats.evenements} icon={CalendarDays} />
        <MiniCard label="Conversations" value={stats.conversations} icon={MessageSquare} />
        <MiniCard label="Tickets ouverts" value={stats.openTickets} icon={Ticket} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel">
          <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
            <div>
              <h2 className="font-heading text-xl text-foreground">Derniers comptes crees</h2>
              <p className="mt-1 text-sm text-muted-foreground">Utilisateurs provisionnes recemment</p>
            </div>
            <Link href="/admin/users" className="flex items-center gap-1 text-sm font-medium text-primary">
              Voir tout
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="space-y-3 p-6">
            {recentUsers.map((user) => (
              <div key={user.id} className="surface-subtle flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-foreground">{user.full_name || 'Utilisateur'}</p>
                  <p className="text-sm text-muted-foreground">{user.company || 'Sans entreprise'}</p>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {user.role || 'visiteur'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel">
          <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
            <div>
              <h2 className="font-heading text-xl text-foreground">Exposants recents</h2>
              <p className="mt-1 text-sm text-muted-foreground">Fiches exposes dans l annuaire</p>
            </div>
            <Link href="/admin/exposants" className="flex items-center gap-1 text-sm font-medium text-primary">
              Voir tout
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="space-y-3 p-6">
            {recentExposants.map((exposant) => (
              <div key={exposant.id} className="surface-subtle flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-foreground">{exposant.nom}</p>
                  <p className="text-sm text-muted-foreground">
                    {[exposant.secteur, exposant.pays].filter(Boolean).join(' - ') || 'Profil exposant'}
                  </p>
                </div>
                {exposant.is_featured && (
                  <Badge variant="secondary" className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    En vue
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="surface-panel flex items-center justify-between p-5 transition hover:shadow-md">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </div>
    </Link>
  );
}

function MiniCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="surface-panel flex items-center gap-3 p-5">
      <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
