'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';
import {
  Users,
  CreditCard,
  Store,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  MessageSquare,
  Ticket,
  BarChart3,
  Activity,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdminStats {
  totalExposants: number;
  activeSubscriptions: number;
  totalProduits: number;
  totalEvenements: number;
  totalConversations: number;
  totalRdv: number;
  openTickets: number;
  newsletterSubscribers: number;
  revenueMRR: number;
}

interface RecentExposant {
  id: string;
  nom: string;
  secteur: string | null;
  pays: string | null;
  is_featured: boolean;
  created_at: string | null;
}

interface RecentSubscription {
  id: string;
  profile_id: string;
  status: string | null;
  created_at: string;
  profile: { full_name: string; company: string | null } | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalExposants: 0,
    activeSubscriptions: 0,
    totalProduits: 0,
    totalEvenements: 0,
    totalConversations: 0,
    totalRdv: 0,
    openTickets: 0,
    newsletterSubscribers: 0,
    revenueMRR: 0,
  });
  const [recentExposants, setRecentExposants] = useState<RecentExposant[]>([]);
  const [recentSubscriptions, setRecentSubscriptions] = useState<RecentSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [
        exposantsRes,
        subsRes,
        produitsRes,
        eventsRes,
        convsRes,
        rdvsRes,
        ticketsRes,
        newsletterRes,
      ] = await Promise.all([
        supabaseClient.from('exposants').select('id', { count: 'exact', head: true }),
        supabaseClient.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
        supabaseClient.from('produits').select('id', { count: 'exact', head: true }),
        supabaseClient.from('evenements').select('id', { count: 'exact', head: true }),
        supabaseClient.from('conversations').select('id', { count: 'exact', head: true }),
        supabaseClient.from('rendez_vous').select('id', { count: 'exact', head: true }),
        supabaseClient.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabaseClient.from('newsletter_subscriptions').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      const { data: recentExps } = await supabaseClient
        .from('exposants')
        .select('id, nom, secteur, pays, is_featured, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentSubs } = await supabaseClient
        .from('subscriptions')
        .select(`
          id,
          profile_id,
          status,
          created_at,
          profile:profiles(full_name, company)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalExposants: exposantsRes.count || 0,
        activeSubscriptions: subsRes.count || 0,
        totalProduits: produitsRes.count || 0,
        totalEvenements: eventsRes.count || 0,
        totalConversations: convsRes.count || 0,
        totalRdv: rdvsRes.count || 0,
        openTickets: ticketsRes.count || 0,
        newsletterSubscribers: newsletterRes.count || 0,
        revenueMRR: (subsRes.count || 0) * 4,
      });

      if (recentExps) setRecentExposants(recentExps);
      if (recentSubs) setRecentSubscriptions(recentSubs as unknown as RecentSubscription[]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
        <p className="mt-1 text-muted-foreground">Vue d ensemble de la plateforme PROMOTE-CONNECT</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Exposants"
          value={stats.totalExposants}
          icon={Users}
          href="/admin/exposants"
          color="blue"
          trend="+12%"
        />
        <KpiCard
          title="Abonnes actifs"
          value={stats.activeSubscriptions}
          icon={CreditCard}
          href="/admin/abonnes"
          color="green"
          trend="+8%"
        />
        <KpiCard
          title="MRR"
          value={`${stats.revenueMRR} EUR`}
          icon={TrendingUp}
          href="/admin/abonnes"
          color="purple"
          trend="+15%"
        />
        <KpiCard
          title="Tickets ouverts"
          value={stats.openTickets}
          icon={Ticket}
          href="/admin/tickets"
          color={stats.openTickets > 0 ? 'red' : 'slate'}
          trend={stats.openTickets > 0 ? 'A traiter' : 'Tout est OK'}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SecondaryStatCard title="Produits" value={stats.totalProduits} icon={Store} />
        <SecondaryStatCard title="Evenements" value={stats.totalEvenements} icon={Calendar} />
        <SecondaryStatCard title="Conversations" value={stats.totalConversations} icon={MessageSquare} />
        <SecondaryStatCard title="RDV B2B" value={stats.totalRdv} icon={BarChart3} />
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Exposants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Derniers exposants inscrits</CardTitle>
                <CardDescription>Les 5 derniers exposants ajoutes</CardDescription>
              </div>
              <Link
                href="/admin/exposants"
                className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Voir tout
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentExposants.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between rounded-lg border border-border bg-muted p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-blue-100 text-sm font-medium text-blue-700">
                        {exp.nom.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {exp.nom}
                        {exp.is_featured && (
                          <Badge className="ml-2 bg-amber-100 text-amber-700 border-0 text-[10px]">
                            Vedette
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                         {exp.secteur} {exp.pays && `• ${exp.pays}`}
                       </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                     {exp.created_at
                       ? new Date(exp.created_at).toLocaleDateString('fr-FR', {
                           day: 'numeric',
                           month: 'short',
                         })
                       : '-'}
                   </span>
                </div>
              ))}
               {recentExposants.length === 0 && (
                 <p className="py-4 text-sm text-muted-foreground text-center">Aucun exposant.</p>
               )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Subscriptions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Derniers abonnements</CardTitle>
                <CardDescription>Souscriptions recentes</CardDescription>
              </div>
              <Link
                href="/admin/abonnes"
                className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Voir tout
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-lg border border-border bg-muted p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-green-100 text-sm font-medium text-green-700">
                        {(sub.profile as any)?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {(sub.profile as any)?.full_name || 'Inconnu'}
                      </p>
                     <p className="text-xs text-muted-foreground">
                         {(sub.profile as any)?.company || 'Pas d entreprise'}
                       </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      sub.status === 'active'
                        ? 'bg-green-100 text-green-700 border-0'
                        : sub.status === 'past_due'
                          ? 'bg-red-100 text-red-700 border-0'
                          : 'bg-slate-100 text-slate-600 border-0'
                    }
                  >
                    {sub.status || 'inconnu'}
                  </Badge>
                </div>
              ))}
               {recentSubscriptions.length === 0 && (
                 <p className="py-4 text-sm text-muted-foreground text-center">Aucun abonnement.</p>
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
       <Card>
         <CardHeader>
           <CardTitle>Actions rapides</CardTitle>
           <CardDescription>Taches d administration courantes</CardDescription>
         </CardHeader>
         <CardContent>
           <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              label="Ajouter un exposant"
              description="Inscrire un nouvel exposant"
              icon={Users}
              href="/admin/exposants"
              color="blue"
            />
            <QuickAction
              label="Envoyer newsletter"
              description="Creer et envoyer"
              icon={MessageSquare}
              href="/admin/newsletter"
              color="green"
            />
            <QuickAction
              label="Gerer programme"
              description="Modifier les evenements"
              icon={Calendar}
              href="/admin/programme"
              color="purple"
            />
            <QuickAction
              label="Gerer abonnements"
              description="Voir les abonnes"
              icon={CreditCard}
              href="/admin/abonnes"
              color="orange"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  href,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'red' | 'slate';
  trend: string;
}) {
  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', value: 'text-blue-900' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', value: 'text-green-900' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', value: 'text-purple-900' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', value: 'text-red-900' },
    slate: { bg: 'bg-slate-50', icon: 'text-slate-600', value: 'text-slate-900' },
  };
  const c = colors[color];

  return (
    <Link href={href} className="group">
      <Card className="transition-all hover:shadow-md hover:border-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className={`mt-1 text-2xl font-bold ${c.value}`}>{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
              <Icon className={`h-5 w-5 ${c.icon}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SecondaryStatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-lg font-bold text-slate-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  label,
  description,
  icon: Icon,
  href,
  color,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colors = {
    blue: { bg: 'bg-blue-50 hover:bg-blue-100', icon: 'text-blue-600', text: 'text-blue-700' },
    green: { bg: 'bg-green-50 hover:bg-green-100', icon: 'text-green-600', text: 'text-green-700' },
    purple: { bg: 'bg-purple-50 hover:bg-purple-100', icon: 'text-purple-600', text: 'text-purple-700' },
    orange: { bg: 'bg-orange-50 hover:bg-orange-100', icon: 'text-orange-600', text: 'text-orange-700' },
  };
  const c = colors[color];

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg p-3 transition ${c.bg}`}
    >
      <Icon className={`h-5 w-5 ${c.icon}`} />
      <div>
        <p className={`text-sm font-medium ${c.text}`}>{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
