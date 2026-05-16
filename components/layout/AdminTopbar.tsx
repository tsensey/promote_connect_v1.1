'use client';

import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { LocaleToggle } from '@/components/ui/locale-toggle';
import { AdminBreadcrumb } from '@/components/ui/breadcrumb-nav';
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onToggleSidebar} className="xl:hidden">
            <Menu className="size-4" />
          </Button>
          <AdminBreadcrumb className="hidden min-w-0 sm:flex" />
        </div>

        <div className="flex items-center gap-1.5">
          <LocaleToggle />
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative rounded-full text-muted-foreground hover:text-foreground"
          >
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-amber-500 ring-1 ring-background" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="h-auto rounded-full px-2 py-1" />}>
              <Avatar className="size-7 border border-border/60">
                <AvatarFallback className="bg-amber-500/15 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="max-w-[8rem] truncate text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-[11px] text-muted-foreground">{t('layout.admin.topbar.admin')}</p>
              </div>
              <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-lg">
                {t('layout.admin.topbar.dashboard')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/users')} className="rounded-lg">
                {t('layout.admin.topbar.users')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="rounded-lg text-destructive focus:text-destructive">
                {t('layout.admin.topbar.signout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
