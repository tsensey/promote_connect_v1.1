'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Activity, ShieldAlert, Users, MessageSquare, Calendar as CalendarIcon, Filter, MousePointerClick, RefreshCcw } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface LogStats {
  date: string;
  logins: number;
  rateLimits: number;
  signups: number;
  messages: number;
  rdvs: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
const ACTIONS_TO_TRACK = ['user_login', 'rate_limit_exceeded', 'create_profiles', 'create_messages', 'create_rendez_vous'];

export default function AnalyticsDashboardPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LogStats[]>([]);
  const [pieData, setPieData] = useState<{name: string, value: number}[]>([]);
  
  // Filtres
  const [datePreset, setDatePreset] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isRealtime, setIsRealtime] = useState(false);

  const [totals, setTotals] = useState({
    logins: 0,
    rateLimits: 0,
    uniqueUsers: 0,
    signups: 0,
    messages: 0,
    rdvs: 0,
    totalEvents: 0
  });

  const fetchAnalytics = async (silent = false) => {
    if (!silent) setLoading(true);
    let startDate = new Date();
    let endDate = new Date();

    if (datePreset === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (datePreset === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (datePreset === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (datePreset === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
    } else if (datePreset === 'all') {
      startDate = new Date(0); // Epoch
    }

    const { data: logs, error } = await supabaseClient
      .from('audit_logs')
      .select('action, created_at, actor_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('action', ACTIONS_TO_TRACK);

    if (!error && logs) {
      // Group by date
      const grouped = logs.reduce((acc: Record<string, any>, log) => {
        const dateStr = (log.created_at || new Date().toISOString()).split('T')[0];
        if (!acc[dateStr]) {
          acc[dateStr] = { date: dateStr, logins: 0, rateLimits: 0, signups: 0, messages: 0, rdvs: 0 };
        }
        if (log.action === 'user_login') acc[dateStr].logins += 1;
        if (log.action === 'rate_limit_exceeded') acc[dateStr].rateLimits += 1;
        if (log.action === 'create_profiles') acc[dateStr].signups += 1;
        if (log.action === 'create_messages') acc[dateStr].messages += 1;
        if (log.action === 'create_rendez_vous') acc[dateStr].rdvs += 1;
        return acc;
      }, {});

      const sortedData = Object.keys(grouped).sort().map(key => grouped[key]);
      setData(sortedData);

      // Totals
      const tLogins = logs.filter(l => l.action === 'user_login').length;
      const tRateLimits = logs.filter(l => l.action === 'rate_limit_exceeded').length;
      const tSignups = logs.filter(l => l.action === 'create_profiles').length;
      const tMessages = logs.filter(l => l.action === 'create_messages').length;
      const tRdvs = logs.filter(l => l.action === 'create_rendez_vous').length;

      setTotals({
        logins: tLogins,
        rateLimits: tRateLimits,
        signups: tSignups,
        messages: tMessages,
        rdvs: tRdvs,
        uniqueUsers: new Set(logs.map(l => l.actor_id).filter(Boolean)).size,
        totalEvents: logs.length
      });

      // Pie Chart Data
      setPieData([
        { name: t('admin.analytics.logins'), value: tLogins },
        { name: t('admin.analytics.signups'), value: tSignups },
        { name: t('admin.analytics.messages'), value: tMessages },
        { name: t('admin.analytics.rdvs'), value: tRdvs },
        { name: t('admin.analytics.alerts'), value: tRateLimits },
      ].filter(item => item.value > 0));
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePreset]); // trigger when preset changes, custom is handled via button

  useEffect(() => {
    if (!isRealtime) return;

    const channel = supabaseClient.channel('analytics_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          if (ACTIONS_TO_TRACK.includes(payload.new.action)) {
            fetchAnalytics(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRealtime, datePreset, customStart, customEnd]);

  const handleCustomFilter = () => {
    if (customStart && customEnd) {
      setDatePreset('custom');
      fetchAnalytics();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            {t('admin.analytics.monitoring')}
          </p>
          <h1 className="text-4xl text-foreground">{t('admin.analytics.title')}</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {t('admin.analytics.desc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={datePreset} onValueChange={(val) => { if (val) setDatePreset(val); }}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 size-4" />
              <SelectValue placeholder={t('admin.analytics.period')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t('admin.analytics.today')}</SelectItem>
              <SelectItem value="7d">{t('admin.analytics.7d')}</SelectItem>
              <SelectItem value="30d">{t('admin.analytics.30d')}</SelectItem>
              <SelectItem value="all">{t('admin.analytics.all')}</SelectItem>
              <SelectItem value="custom">{t('admin.analytics.custom')}</SelectItem>
            </SelectContent>
          </Select>

          {datePreset === 'custom' && (
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                value={customStart} 
                onChange={e => setCustomStart(e.target.value)} 
                className="w-auto"
              />
              <span className="text-muted-foreground">-</span>
              <Input 
                type="date" 
                value={customEnd} 
                onChange={e => setCustomEnd(e.target.value)} 
                className="w-auto"
              />
              <Button onClick={handleCustomFilter} size="sm">{t('admin.analytics.filter')}</Button>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto lg:ml-4">
            <Switch checked={isRealtime} onCheckedChange={setIsRealtime} id="realtime-mode" />
            <label htmlFor="realtime-mode" className="text-sm font-medium cursor-pointer">Temps réel</label>
            <Button variant="outline" size="icon" onClick={() => fetchAnalytics()} className="ml-2" title="Rafraîchir">
              <RefreshCcw className="size-4" />
            </Button>
          </div>
        </div>
      </div>      {loading ? (
        <div className="space-y-4">
          <Card className="animate-pulse py-0 mb-4 h-[400px]">
            <CardContent className="h-full bg-muted" />
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="animate-pulse py-0 h-[300px]">
              <CardContent className="h-full bg-muted" />
            </Card>
            <Card className="animate-pulse py-0 h-[300px]">
              <CardContent className="h-full bg-muted" />
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-500">
          
          {/* Main Chart Card (KPIs + AreaChart Plausible Style) */}
          <Card className="surface-panel border-0 py-0 mb-4 overflow-hidden">
            <div className="p-6 pb-2">
              <div className="flex flex-wrap gap-y-6">
                {[
                  { label: t('admin.analytics.unique_users'), value: totals.uniqueUsers },
                  { label: t('admin.analytics.logins'), value: totals.logins },
                  { label: t('admin.analytics.messages'), value: totals.messages },
                  { label: t('admin.analytics.rdvs'), value: totals.rdvs },
                  { label: t('admin.analytics.alerts'), value: totals.rateLimits },
                ].map((stat, i) => (
                  <div key={i} className="w-1/2 md:w-1/5 space-y-1 px-4 first:pl-0 md:border-l border-border/30 md:first:border-l-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-semibold">{stat.value}</p>
                      {stat.value > 0 && <span className="text-xs font-semibold text-emerald-500">↗ 100%</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    minTickGap={30}
                  />
                  <Tooltip 
                    cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="logins" name={t('admin.analytics.logins')} stroke={COLORS[0]} strokeWidth={2} fillOpacity={1} fill="url(#colorLogins)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Bottom Widgets (Plausible Style) */}
          <div className="grid gap-4 md:grid-cols-2">
            
            {/* Widget 1: Actions Réparties (Liste avec barres) */}
            <Card className="surface-panel border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Top Actions</span>
                  <span>Volume</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {[...pieData].sort((a, b) => b.value - a.value).map((item, i) => {
                  const max = pieData.length > 0 ? Math.max(...pieData.map(d => d.value)) : 1;
                  const pct = Math.round((item.value / max) * 100);
                  return (
                    <div key={i} className="relative flex items-center justify-between group overflow-hidden rounded-md">
                      <div className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${pct}%` }} />
                      <span className="relative z-10 text-sm font-medium pl-3 py-2">{item.name}</span>
                      <span className="relative z-10 text-sm font-medium pr-3 py-2">{item.value}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Widget 2: Distribution Graphique Miniature */}
            <Card className="surface-panel border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Distribution</span>
                </div>
              </CardHeader>
              <CardContent className="h-[250px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}
