'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Shield, Users } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AccessRow {
  id: string;
  full_name: string | null;
  company: string | null;
  role: string | null;
  created_at: string | null;
}

export default function AdminAccessPage() {
  const [accounts, setAccounts] = useState<AccessRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      const { data } = await supabaseClient
        .from('profiles')
        .select('id, full_name, company, role, created_at')
        .order('created_at', { ascending: false });

      setAccounts((data || []) as AccessRow[]);
      setLoading(false);
    };

    void loadAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    const query = search.toLowerCase();
    return accounts.filter((account) =>
      `${account.full_name || ''} ${account.company || ''} ${account.role || ''}`
        .toLowerCase()
        .includes(query)
    );
  }, [accounts, search]);

  const stats = useMemo(
    () => ({
      total: accounts.length,
      admins: accounts.filter((account) => account.role === 'admin').length,
      members: accounts.filter((account) => account.role !== 'admin').length,
    }),
    [accounts]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
          Administration des acces
        </p>
        <h1 className="text-4xl text-foreground">Vue globale des acces</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Le systeme d abonnement est desactive. Tous les comptes listes ici sont actives pour la plateforme.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Comptes" value={stats.total} icon={Users} />
        <StatCard title="Administrateurs" value={stats.admins} icon={Shield} />
        <StatCard title="Membres" value={stats.members} icon={Users} />
      </div>

      <div className="surface-panel">
        <div className="border-b border-border/70 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un compte..."
              className="pl-10"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Acces</TableHead>
              <TableHead>Creation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><div className="h-5 w-32 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-24 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-16 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted" /></TableCell>
                </TableRow>
              ))
            ) : filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium text-foreground">{account.full_name || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{account.company || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-full">
                      {account.role || 'visiteur'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      Actif
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {account.created_at ? new Date(account.created_at).toLocaleDateString('fr-FR') : '-'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Aucun compte trouve
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="surface-panel flex items-center gap-3 p-5">
      <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
