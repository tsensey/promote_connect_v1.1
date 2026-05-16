'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  History,
  Layers,
  Megaphone,
  Shield,
  Store,
  Ticket,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(href));
}

function LabelText({
  collapsed,
  children,
  className,
}: {
  collapsed: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out',
        collapsed
          ? 'max-w-0 opacity-0 delay-0'
          : 'max-w-56 opacity-100 delay-150',
        className
      )}
    >
      {children}
    </div>
  );
}

export function AdminSidebar({
  collapsed,
  onToggle,
  onNavigate,
  mobile = false,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const ADMIN_NAV: AdminNavSection[] = [
    {
      title: t('layout.admin.sidebar.pilotage'),
      items: [
        { label: t('layout.admin.sidebar.dashboard'), href: '/admin', icon: BarChart3 },
        { label: t('layout.admin.sidebar.users'), href: '/admin/users', icon: UserPlus, badge: 'Core' },
        { label: t('layout.admin.sidebar.exposants'), href: '/admin/exposants', icon: Users },
        { label: t('layout.admin.sidebar.espaces'), href: '/admin/espaces', icon: Layers },
        { label: t('layout.admin.sidebar.programme'), href: '/admin/programme', icon: CalendarDays },
        { label: t('layout.admin.sidebar.logs'), href: '/admin/logs', icon: History },
      ],
    },
    {
      title: t('layout.admin.sidebar.operationnel'),
      items: [
        { label: t('layout.admin.sidebar.access'), href: '/admin/abonnes', icon: Shield },
        { label: t('layout.admin.sidebar.products'), href: '/admin/exposants', icon: Store },
        { label: t('layout.admin.sidebar.newsletter'), href: '/admin/newsletter', icon: Megaphone },
        { label: t('layout.admin.sidebar.tickets'), href: '/admin/tickets', icon: Ticket },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        mobile
          ? 'flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground'
          : 'fixed inset-y-0 left-0 z-50 hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground xl:flex xl:flex-col',
        !mobile && 'transition-[width] duration-300 ease-in-out',
        !mobile && (collapsed ? 'w-24' : 'w-64')
      )}
    >
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-300">
            <Shield className="size-4" />
          </div>
          <LabelText collapsed={collapsed}>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.24em] text-sidebar-foreground/40">
                {t('layout.admin.sidebar.console')}
              </p>
              <p className="-mt-0.5 truncate text-sm font-bold text-sidebar-foreground">PROMOTE-CONNECT</p>
            </div>
          </LabelText>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className="shrink-0 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="size-3.5 transition-transform duration-300" />
          ) : (
            <ChevronLeft className="size-3.5 transition-transform duration-300" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-xs font-semibold text-amber-600 dark:text-amber-300">
              A
            </div>
            <LabelText collapsed={collapsed}>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-sidebar-foreground">{t('layout.admin.sidebar.console')}</p>
                <p className="truncate text-[11px] text-sidebar-foreground/50">{t('layout.admin.sidebar.subtitle')}</p>
              </div>
            </LabelText>
          </div>
        </div>

        <div className="space-y-5">
          {ADMIN_NAV.map((section) => (
            <div key={section.title}>
              <LabelText collapsed={collapsed} className="mb-1.5 !delay-0">
                <p className="truncate px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-sidebar-foreground/35">
                  {section.title}
                </p>
              </LabelText>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                          : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <LabelText collapsed={collapsed} className="flex items-center gap-2">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant={active ? 'secondary' : 'outline'}
                            className={cn(
                              'rounded-full px-1.5 py-px text-[9px] font-semibold shrink-0',
                              active
                                ? 'bg-sidebar-primary-foreground/15 text-sidebar-primary-foreground'
                                : 'border-sidebar-border text-sidebar-foreground/50'
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </LabelText>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/app"
          className="flex items-center justify-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-xs font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Shield className="size-3.5 shrink-0" />
          <LabelText collapsed={collapsed}>{t('layout.admin.sidebar.back')}</LabelText>
        </Link>
      </div>
    </aside>
  );
}
