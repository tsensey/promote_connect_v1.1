'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ShieldAlert, Users, MousePointerClick } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface LogStats {
  date: string;
  logins: number;
  rateLimits: number;
}

export default function AnalyticsDashboardPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LogStats[]>([]);
  const [totals, setTotals] = useState({
    logins: 0,
    rateLimits: 0,
    uniqueUsers: 0,
    totalEvents: 0
  });

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      // On va récupérer les 30 derniers jours de logs d'intérêt
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: logs, error } = await supabaseClient
        .from('audit_logs')
        .select('action, created_at, actor_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .in('action', ['log_login_event', 'rate_limit_exceeded']);

      if (!error && logs) {
        // Agréger les données par jour
        const grouped = logs.reduce((acc: Record<string, any>, log) => {
          const dateStr = (log.created_at || new Date().toISOString()).split('T')[0];
          if (!acc[dateStr]) {
            acc[dateStr] = { date: dateStr, logins: 0, rateLimits: 0, uniqueActors: new Set() };
          }
          if (log.action === 'log_login_event') acc[dateStr].logins += 1;
          if (log.action === 'rate_limit_exceeded') acc[dateStr].rateLimits += 1;
          if (log.actor_id) acc[dateStr].uniqueActors.add(log.actor_id);
          return acc;
        }, {});

        const sortedData = Object.keys(grouped).sort().map(key => ({
          date: key,
          logins: grouped[key].logins,
          rateLimits: grouped[key].rateLimits,
        }));

        setData(sortedData);

        // Calculer les totaux globaux
        const uniqueAllTime = new Set(logs.map(l => l.actor_id).filter(Boolean));
        setTotals({
          logins: logs.filter(l => l.action === 'log_login_event').length,
          rateLimits: logs.filter(l => l.action === 'rate_limit_exceeded').length,
          uniqueUsers: uniqueAllTime.size,
          totalEvents: logs.length
        });
      }
      setLoading(false);
    }

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
          Monitoring
        </p>
        <h1 className="text-4xl text-foreground">Tableau de Bord Analytique</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Aperçu de l'activité du trafic de la plateforme, des événements de sécurité et de l'engagement global.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24 bg-muted" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="surface-panel border-0">
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Connexions (30j)</p>
                  <p className="text-3xl font-bold">{totals.logins}</p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Activity className="size-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="surface-panel border-0">
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Utilisateurs uniques</p>
                  <p className="text-3xl font-bold">{totals.uniqueUsers}</p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Users className="size-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="surface-panel border-0">
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Alertes Rate Limit</p>
                  <p className="text-3xl font-bold">{totals.rateLimits}</p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <ShieldAlert className="size-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="surface-panel border-0">
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Événements</p>
                  <p className="text-3xl font-bold">{totals.totalEvents}</p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                  <MousePointerClick className="size-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="surface-panel border-0">
              <CardHeader>
                <CardTitle>Activité des Connexions</CardTitle>
                <CardDescription>Volume de logins sur les 30 derniers jours</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    />
                    <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                      labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px' }}
                    />
                    <Bar dataKey="logins" name="Connexions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="surface-panel border-0">
              <CardHeader>
                <CardTitle>Alertes de Sécurité (Rate Limits)</CardTitle>
                <CardDescription>Requêtes bloquées par le pare-feu logiciel</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    />
                    <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                      labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="rateLimits" name="Requêtes bloquées" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
