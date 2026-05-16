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
  Sparkles,
  Users,
  Rss,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotificationState } from '@/lib/notification-context';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';

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

function isItemActive(pathname: string, href: string) {
  return pathname === href || (href !== '/app' && pathname.startsWith(href));
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

export function UserSidebar({
  role,
  collapsed,
  onToggle,
  onNavigate,
  user,
  onSignOut,
  mobile = false,
}: {
  role: 'exposant' | 'visiteur';
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  user: { name: string; company?: string; avatar?: string } | null;
  onSignOut: () => void;
  mobile?: boolean;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { unreadMessages } = useNotificationState();

  const VISITOR_SECTIONS: NavSection[] = [
    {
      title: t('layout.sidebar.plateforme'),
      items: [
        { label: t('layout.sidebar.feed'), href: '/feed', icon: Rss, badge: 'Nouveau' },
        { label: t('layout.sidebar.home'), href: '/app', icon: LayoutDashboard },
        { label: t('layout.sidebar.network'), href: '/annuaire', icon: Users },
        { label: t('layout.sidebar.messages'), href: '/chat', icon: MessageSquare, badge: 'Live' },
        { label: t('layout.sidebar.agenda'), href: '/agenda', icon: CalendarDays },
      ],
    },
    {
      title: t('layout.sidebar.compte'),
      items: [
        { label: t('layout.sidebar.newsletter'), href: '/newsletter', icon: Mail },
        { label: t('layout.sidebar.settings'), href: '/parametres', icon: Settings },
        { label: t('layout.sidebar.support'), href: '/support', icon: LifeBuoy },
      ],
    },
  ];

  const EXHIBITOR_SECTIONS: NavSection[] = [
    {
      title: t('layout.sidebar.plateforme'),
      items: [
        { label: t('layout.sidebar.feed'), href: '/feed', icon: Rss, badge: 'Nouveau' },
        { label: t('layout.sidebar.home'), href: '/app', icon: LayoutDashboard },
        { label: t('layout.sidebar.network'), href: '/annuaire', icon: Users },
        { label: t('layout.sidebar.messages'), href: '/chat', icon: MessageSquare, badge: 'Live' },
        { label: t('layout.sidebar.agenda'), href: '/agenda', icon: CalendarDays },
      ],
    },
    {
      title: t('layout.sidebar.business'),
      items: [
        { label: t('layout.sidebar.catalogue'), href: '/vitrine', icon: BriefcaseBusiness },
        { label: t('layout.sidebar.manage_vitrine'), href: '/exposant/ma-vitrine', icon: Sparkles },
      ],
    },
    {
      title: t('layout.sidebar.compte'),
      items: [
        { label: t('layout.sidebar.newsletter'), href: '/newsletter', icon: Mail },
        { label: t('layout.sidebar.settings'), href: '/parametres', icon: Settings },
        { label: t('layout.sidebar.support'), href: '/support', icon: LifeBuoy },
      ],
    },
  ];

  const sections = role === 'exposant' ? EXHIBITOR_SECTIONS : VISITOR_SECTIONS;

  return (
    <aside
      className={cn(
        mobile
          ? 'flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar'
          : 'fixed inset-y-0 left-0 z-50 hidden border-r border-sidebar-border bg-sidebar xl:flex xl:flex-col',
        !mobile && 'transition-[width] duration-300 ease-in-out',
        !mobile && (collapsed ? 'w-24' : 'w-64'),
      )}
    >
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3.5">
        <Link href="/feed" className="flex min-w-0 items-center gap-2.5">
          <div className="relative size-8 shrink-0 overflow-hidden rounded-lg shadow-sm shadow-primary/20 bg-primary/5">
            <Image
              src="/logo-promote.png"
              alt="Logo"
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
          <LabelText collapsed={collapsed}>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.24em] text-primary/60">
                Promote
              </p>
              <p className="-mt-0.5 truncate text-sm font-bold text-sidebar-foreground">Connect</p>
            </div>
          </LabelText>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={onToggle}
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
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <LabelText collapsed={collapsed}>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-sidebar-foreground">
                  {user?.name}
                </p>
                <p className="truncate text-[11px] text-sidebar-foreground/50">
                  {user?.company || t(role === 'exposant' ? 'layout.sidebar.exposant' : 'layout.sidebar.visiteur')}
                </p>
              </div>
            </LabelText>
          </div>
          <LabelText collapsed={collapsed} className="mt-2.5 !delay-0">
            <Badge
              variant="secondary"
              className="rounded-full bg-primary/10 px-2 py-px text-[10px] font-semibold text-primary hover:bg-primary/15"
            >
              {role === 'exposant' ? t('layout.sidebar.exposant_space') : t('layout.sidebar.visiteur_space')}
            </Badge>
          </LabelText>
        </div>

        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <LabelText collapsed={collapsed} className="mb-1.5 !delay-0">
                <p className="truncate px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-sidebar-foreground/35">
                  {section.title}
                </p>
              </LabelText>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isItemActive(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      )}
                      onClick={onItemClick}
                    >
                      <Icon className="size-4 shrink-0" />
                      <LabelText collapsed={collapsed} className="flex items-center gap-2">
                        <span className="truncate">{item.label}</span>
                        {(item.href === '/chat' && unreadMessages > 0) ? (
                          <Badge
                            variant={active ? 'secondary' : 'outline'}
                            className={cn(
                              'rounded-full px-1.5 py-px text-[9px] font-semibold shrink-0',
                              active
                                ? 'bg-primary-foreground/15 text-primary-foreground'
                                : 'border-sidebar-border text-sidebar-foreground/50',
                            )}
                          >
                            {unreadMessages > 99 ? '99+' : unreadMessages}
                          </Badge>
                        ) : item.badge ? (
                          <Badge
                            variant={active ? 'secondary' : 'outline'}
                            className={cn(
                              'rounded-full px-1.5 py-px text-[9px] font-semibold shrink-0',
                              active
                                ? 'bg-primary-foreground/15 text-primary-foreground'
                                : 'border-sidebar-border text-sidebar-foreground/50',
                            )}
                          >
                            {item.badge}
                          </Badge>
                        ) : null}
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
        <Button
          type="button"
          variant="ghost"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={onSignOut}
        >
          <ChevronLeft className={cn('size-3.5 shrink-0 transition-transform duration-300', collapsed && 'rotate-180')} />
          <LabelText collapsed={collapsed}>{t('layout.sidebar.signout')}</LabelText>
        </Button>
      </div>
    </aside>
  );
}
