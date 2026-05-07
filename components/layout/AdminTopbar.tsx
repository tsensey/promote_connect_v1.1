'use client';

import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, Menu, Search, Shield } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

export function AdminTopbar({
  onToggleSidebar,
  user,
  onSignOut,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
  user: { name: string; email?: string } | null;
  onSignOut: () => void;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onToggleSidebar} className="xl:hidden">
            <Menu className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600/80">
              Administration
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="truncate text-2xl text-foreground">Gestion des acces</h1>
              <Badge variant="secondary" className="hidden rounded-full sm:inline-flex">
                <Shield className="mr-1 size-3.5" />
                Admin
              </Badge>
            </div>
          </div>
        </div>

        <div className="hidden flex-1 justify-center lg:flex">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un utilisateur, un compte, un salon..."
              className="h-12 rounded-full border-white/70 bg-white/90 pl-11 shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden rounded-full sm:inline-flex"
            onClick={() => router.push('/admin/users')}
          >
            Comptes
          </Button>
          <Button variant="ghost" size="icon-sm" className="relative rounded-full">
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-500" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="h-auto rounded-full px-2 py-1.5" />}>
              <Avatar className="size-10 border border-border/70">
                <AvatarFallback className="bg-amber-500/15 font-semibold text-amber-700">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="max-w-[10rem] truncate text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Administrateur</p>
              </div>
              <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl">
              <DropdownMenuLabel>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin')}>Dashboard</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/users')}>Utilisateurs</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                Deconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
