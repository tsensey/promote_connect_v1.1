'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
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

const ADMIN_NAV: AdminNavSection[] = [
  {
    title: 'Pilotage',
    items: [
      { label: 'Dashboard', href: '/admin', icon: BarChart3 },
      { label: 'Utilisateurs', href: '/admin/users', icon: UserPlus, badge: 'Core' },
      { label: 'Exposants', href: '/admin/exposants', icon: Users },
      { label: 'Programme', href: '/admin/programme', icon: CalendarDays },
    ],
  },
  {
    title: 'Operationnel',
    items: [
      { label: 'Abonnes', href: '/admin/abonnes', icon: Shield },
      { label: 'Produits', href: '/admin/exposants', icon: Store },
      { label: 'Newsletter', href: '/admin/newsletter', icon: Megaphone },
      { label: 'Tickets', href: '/admin/tickets', icon: Ticket },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(href));
}

export function AdminSidebar({
  collapsed,
  onToggle,
  mobile = false,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        mobile
          ? 'flex h-full w-full flex-col border-r border-white/10 bg-slate-950 text-white'
          : 'fixed inset-y-0 left-0 z-50 hidden border-r border-sidebar-border bg-slate-950/95 text-white backdrop-blur xl:flex xl:flex-col',
        !mobile && (collapsed ? 'w-24' : 'w-72')
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
            <Shield className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-[0.24em] text-white/45">
                Admin
              </p>
              <p className="-mt-0.5 truncate text-lg text-white">PROMOTE-CONNECT</p>
            </div>
          )}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className={cn(
            mobile
              ? 'inline-flex text-white/70 hover:bg-white/10 hover:text-white'
              : 'hidden text-white/70 hover:bg-white/10 hover:text-white xl:inline-flex',
            collapsed && 'rotate-180'
          )}
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className={cn('mb-6 rounded-3xl border border-white/10 bg-white/5 p-4', collapsed && 'px-2')}>
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-sm font-semibold text-amber-300">
              A
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">Console admin</p>
                <p className="truncate text-xs text-white/55">
                  Comptes, acces, activation et suivi
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {ADMIN_NAV.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
                  {section.title}
                </p>
              )}
              <nav className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all',
                        active
                          ? 'bg-white text-slate-950 shadow-lg shadow-black/20'
                          : 'text-white/72 hover:bg-white/8 hover:text-white'
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant={active ? 'secondary' : 'outline'}
                              className={cn(
                                'rounded-full border-white/15 px-2 text-[10px]',
                                active
                                  ? 'bg-slate-950/10 text-slate-950'
                                  : 'border-white/10 text-white/60'
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/app"
          className={cn(
            'flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white',
            !collapsed && 'justify-start'
          )}
        >
          {!collapsed ? 'Retour a la plateforme' : 'App'}
        </Link>
      </div>
    </aside>
  );
}
