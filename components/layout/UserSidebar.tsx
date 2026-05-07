'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  Mail,
  MessageSquare,
  Newspaper,
  Sparkles,
  Users,
  Rss,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const VISITOR_SECTIONS: NavSection[] = [
  {
    title: 'Plateforme',
    items: [
      { label: 'Fil d actualites', href: '/feed', icon: Rss, badge: 'Nouveau' },
      { label: 'Accueil', href: '/app', icon: Newspaper },
      { label: 'Reseau', href: '/annuaire', icon: Users },
      { label: 'Messages', href: '/chat', icon: MessageSquare, badge: 'Live' },
      { label: 'Agenda', href: '/agenda', icon: CalendarDays },
    ],
  },
  {
    title: 'Compte',
    items: [
      { label: 'Newsletter', href: '/newsletter', icon: Mail },
      { label: 'Support', href: '/support', icon: LifeBuoy },
    ],
  },
];

const EXHIBITOR_SECTIONS: NavSection[] = [
  {
    title: 'Plateforme',
    items: [
      { label: 'Fil d actualites', href: '/feed', icon: Rss, badge: 'Nouveau' },
      { label: 'Accueil', href: '/app', icon: Newspaper },
      { label: 'Reseau', href: '/annuaire', icon: Users },
      { label: 'Messages', href: '/chat', icon: MessageSquare, badge: 'Live' },
      { label: 'Agenda', href: '/agenda', icon: CalendarDays },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Ma vitrine', href: '/vitrine', icon: BriefcaseBusiness },
      { label: 'Mes produits', href: '/vitrine/mes-produits', icon: Sparkles },
    ],
  },
  {
    title: 'Compte',
    items: [
      { label: 'Newsletter', href: '/newsletter', icon: Mail },
      { label: 'Support', href: '/support', icon: LifeBuoy },
    ],
  },
];

function isItemActive(pathname: string, href: string) {
  return pathname === href || (href !== '/app' && pathname.startsWith(href));
}

export function UserSidebar({
  role,
  collapsed,
  onToggle,
  user,
  onSignOut,
  mobile = false,
}: {
  role: 'exposant' | 'visiteur';
  collapsed: boolean;
  onToggle: () => void;
  user: { name: string; company?: string; avatar?: string } | null;
  onSignOut: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const sections = role === 'exposant' ? EXHIBITOR_SECTIONS : VISITOR_SECTIONS;

  return (
    <aside
      className={cn(
        mobile
          ? 'flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar'
          : 'fixed inset-y-0 left-0 z-50 hidden border-r border-sidebar-border bg-sidebar/95 backdrop-blur xl:flex xl:flex-col',
        !mobile && (collapsed ? 'w-24' : 'w-72')
      )}
    >
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
        <Link href="/app" className="flex min-w-0 items-center gap-3">
          <div className="brand-gradient flex size-10 items-center justify-center rounded-xl text-lg font-semibold text-white shadow-lg shadow-primary/20">
            P
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">
                Promote
              </p>
              <p className="-mt-0.5 truncate text-md text-sidebar-foreground">Connect</p>
            </div>
          )}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            mobile ? 'inline-flex' : 'hidden xl:inline-flex',
            collapsed && 'rotate-180'
          )}
          onClick={onToggle}
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className={cn('mb-6 rounded-xl border border-primary/10 bg-primary/6 p-2', collapsed && 'px-2')}>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-semibold text-primary shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.company || (role === 'exposant' ? 'Exposant' : 'Visiteur')}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <Badge variant="secondary" className="mt-4 rounded-full">
              {role === 'exposant' ? 'Espace exposant' : 'Espace visiteur'}
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {section.title}
                </p>
              )}
              <nav className="space-y-1.5">
                {section.items.map((item) => {
                  const active = isItemActive(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all',
                        active
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
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
                                  ? 'bg-white/15 text-white'
                                  : 'border-border text-muted-foreground'
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

      <div className="border-t border-sidebar-border p-3">
          <div className={cn('flex gap-2', collapsed ? 'flex-col' : 'items-center')}>
            <Button
              type="button"
              variant="outline"
              className={cn('flex-1 rounded-xl', collapsed && 'px-0')}
              onClick={onSignOut}
            >
              {collapsed ? <ChevronRight className="size-4 rotate-180" /> : 'Deconnexion'}
            </Button>
          </div>
      </div>
    </aside>
  );
}
