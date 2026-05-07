'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Search, Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Subscriber {
  id: string;
  full_name: string | null;
  company: string | null;
  role: string | null;
  subscription_status: string | null;
  subscription_ends_at: string | null;
  created_at: string | null;
}

export default function AdminAbonnesPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, trial: 0 });

  useEffect(() => {
    const fetchSubscribers = async () => {
      setLoading(true);
      const { data: profiles } = await supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });
      if (profiles) {
        setSubscribers(profiles);
        setStats({
          total: profiles.length,
          active: profiles.filter((p) => p.subscription_status === 'active').length,
          expired: profiles.filter((p) => p.subscription_status === 'expired').length,
          trial: profiles.filter((p) => p.subscription_status === 'trial').length,
        });
      }
      setLoading(false);
    };
    fetchSubscribers();
  }, []);

  const filtered = subscribers.filter((sub) => sub.full_name?.toLowerCase().includes(search.toLowerCase()) || sub.company?.toLowerCase().includes(search.toLowerCase()));

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-700 border-0"><TrendingUp className="mr-1 h-3 w-3" />Actif</Badge>;
      case 'trial': return <Badge className="bg-blue-100 text-blue-700 border-0"><Clock className="mr-1 h-3 w-3" />Essai</Badge>;
      case 'expired': return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Expiré</Badge>;
      default: return <Badge variant="secondary">-</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Administration des abonnes</CardTitle>
          <p className="text-sm text-muted-foreground">Suivez les abonnements, les statuts et les acces des membres.</p>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Actifs</p>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Essai</p>
                <p className="text-2xl font-bold text-blue-900">{stats.trial}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600">Expirés</p>
                <p className="text-2xl font-bold text-red-900">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un abonne..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Expiration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-5 w-32 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-24 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-16 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium text-slate-900">{sub.full_name || '-'}</TableCell>
                  <TableCell className="text-sm text-slate-600">{sub.company || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={sub.role === 'exposant' ? 'default' : 'secondary'}>
                      {sub.role || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(sub.subscription_status)}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {sub.subscription_ends_at ? new Date(sub.subscription_ends_at).toLocaleDateString('fr-FR') : '-'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Aucun abonne trouve</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
