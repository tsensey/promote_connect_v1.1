'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Activity, ShieldAlert, Users, MessageSquare, Calendar as CalendarIcon, Filter, MousePointerClick } from 'lucide-react';
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
const ACTIONS_TO_TRACK = ['log_login_event', 'rate_limit_exceeded', 'create_profiles', 'create_messages', 'create_rendez_vous'];

export default function AnalyticsDashboardPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LogStats[]>([]);
  const [pieData, setPieData] = useState<{name: string, value: number}[]>([]);
  
  // Filtres
  const [datePreset, setDatePreset] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [totals, setTotals] = useState({
    logins: 0,
    rateLimits: 0,
    uniqueUsers: 0,
    signups: 0,
    messages: 0,
    rdvs: 0,
    totalEvents: 0
  });

  const fetchAnalytics = async () => {
    setLoading(true);
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
        if (log.action === 'log_login_event') acc[dateStr].logins += 1;
        if (log.action === 'rate_limit_exceeded') acc[dateStr].rateLimits += 1;
        if (log.action === 'create_profiles') acc[dateStr].signups += 1;
        if (log.action === 'create_messages') acc[dateStr].messages += 1;
        if (log.action === 'create_rendez_vous') acc[dateStr].rdvs += 1;
        return acc;
      }, {});

      const sortedData = Object.keys(grouped).sort().map(key => grouped[key]);
      setData(sortedData);

      // Totals
      const tLogins = logs.filter(l => l.action === 'log_login_event').length;
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
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePreset]); // trigger when preset changes, custom is handled via button

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
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse py-0">
                <CardContent className="h-24 bg-muted" />
              </Card>
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="surface-panel border-0 py-0">
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('admin.analytics.unique_users')}</p>
                  <p className="text-3xl font-bold">{totals.uniqueUsers}</p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Users className="size-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="surface-panel border-0 py-0">
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('admin.analytics.messages')}</p>
                  <p className="text-3xl font-bold">{totals.messages}</p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <MessageSquare className="size-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="surface-panel border-0 py-0">
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('admin.analytics.rdvs')}</p>
                  <p className="text-3xl font-bold">{totals.rdvs}</p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <CalendarIcon className="size-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="surface-panel border-0 py-0">
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('admin.analytics.alerts')}</p>
                  <p className="text-3xl font-bold">{totals.rateLimits}</p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <ShieldAlert className="size-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="surface-panel md:col-span-2 border-0">
              <CardHeader>
                <CardTitle>{t('admin.analytics.global_activity')}</CardTitle>
                <CardDescription>{t('admin.analytics.global_activity_desc')}</CardDescription>
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
                    <Legend />
                    <Bar dataKey="logins" name={t('admin.analytics.logins')} stackId="a" fill={COLORS[0]} />
                    <Bar dataKey="signups" name={t('admin.analytics.signups')} stackId="a" fill={COLORS[1]} />
                    <Bar dataKey="messages" name={t('admin.analytics.messages')} stackId="a" fill={COLORS[3]} />
                    <Bar dataKey="rdvs" name={t('admin.analytics.rdvs')} stackId="a" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="surface-panel border-0">
              <CardHeader>
                <CardTitle>{t('admin.analytics.distribution')}</CardTitle>
                <CardDescription>{t('admin.analytics.distribution_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <Card className="surface-panel border-0">
            <CardHeader>
              <CardTitle>{t('admin.analytics.security')}</CardTitle>
              <CardDescription>{t('admin.analytics.security_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
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
                  <Line type="monotone" dataKey="rateLimits" name={t('admin.analytics.blocked_requests')} stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </>
      )}
    </div>
  );
}
