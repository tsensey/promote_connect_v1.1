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
  Crown,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotificationState } from '@/lib/notification-context';
import { usePermissions } from '@/hooks/usePermissions';
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
        'overflow-hidden whitespace-nowrap transition-[max-width,opacity,max-height,margin] duration-300 ease-in-out',
        collapsed
          ? 'max-w-0 max-h-0 opacity-0 delay-0 m-0'
          : 'max-w-56 max-h-24 opacity-100 delay-150',
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
  onItemClick,
  user,
  onSignOut,
  mobile = false,
}: {
  role: 'exposant' | 'visiteur';
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  onItemClick?: () => void;
  user: { name: string; company?: string; avatar?: string } | null;
  onSignOut: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { unreadMessages } = useNotificationState();
  const { isPaid, isFreeTrial } = usePermissions();

  const VISITOR_SECTIONS: NavSection[] = [
    {
      title: t('layout.sidebar.plateforme'),
      items: [
        { label: t('layout.sidebar.feed'), href: '/feed', icon: Rss, badge: t('layout.sidebar.new_badge') },
        { label: t('layout.sidebar.home'), href: '/app', icon: LayoutDashboard },
        { label: t('layout.sidebar.network'), href: '/annuaire', icon: Users },
        { label: t('layout.sidebar.messages'), href: '/chat', icon: MessageSquare, badge: t('layout.sidebar.live_badge') },
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
        { label: t('layout.sidebar.feed'), href: '/feed', icon: Rss, badge: t('layout.sidebar.new_badge') },
        { label: t('layout.sidebar.home'), href: '/app', icon: LayoutDashboard },
        { label: t('layout.sidebar.network'), href: '/annuaire', icon: Users },
        { label: t('layout.sidebar.messages'), href: '/chat', icon: MessageSquare, badge: t('layout.sidebar.live_badge') },
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
      <div className={cn(
        'flex items-center border-b border-sidebar-border',
        collapsed ? 'flex-col gap-3 py-4 px-2' : 'justify-between px-4 py-3.5'
      )}>
        <Link href="/feed" className={cn(
          'flex min-w-0 items-center gap-2.5',
          collapsed && 'justify-center'
        )}>
          <div className="relative size-8 shrink-0 overflow-hidden rounded-lg-primary/20 bg-primary/5">
            <Image
              src="/logo_transparent.png"
              alt="Logo"
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
          <LabelText collapsed={collapsed}>
            <div className="min-w-0 text-center">
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
          className={cn(
            'shrink-0 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all',
          )}
          onClick={onToggle}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
      </div>

      <div className={`flex-1 overflow-y-auto  py-4 ${collapsed ? 'px-3' : 'px-2'}`}>
        <div className={cn(
          'rounded-xl border transition-all duration-300 mb-5',
          collapsed ? 'border-transparent bg-transparent p-1 flex justify-center mb-2' : 'border-sidebar-border bg-sidebar-accent/50 p-3'
        )}>
          <div className={cn(
            'flex items-center',
            collapsed ? 'justify-center' : 'gap-2.5'
          )}>
            <div className={cn(
              'flex shrink-0 items-center justify-center rounded-lg overflow-hidden',
              collapsed ? 'size-10 text-sm' : 'size-9 text-xs'
            )}>
              {user?.avatar ? (
                <Avatar className={cn('rounded-lg', collapsed ? 'size-10' : 'size-9')}>
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary text-xs rounded-lg">
                    {user.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex size-full items-center justify-center bg-primary/10 font-semibold text-primary">
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
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
            <div className="flex flex-wrap gap-1.5 items-center justify-center">
              <Badge
                variant="secondary"
                className="rounded-full bg-primary/10 px-2 py-px text-[10px] font-semibold text-primary hover:bg-primary/15"
              >
                {role === 'exposant' ? t('layout.sidebar.exposant_space') : t('layout.sidebar.visiteur_space')}
              </Badge>
              {isPaid ? (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-emerald-500/10 border border-emerald-200/50 px-2 py-px text-[9px] font-semibold text-emerald-600 hover:bg-emerald-500/15"
                >
                  <Crown className="size-3 mr-1" />
                  Premium
                </Badge>
              ) : isFreeTrial ? (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-amber-500/10 border border-amber-200/50 px-2 py-px text-[9px] font-semibold text-amber-600 hover:bg-amber-500/15"
                >
                  Essai Gratuit
                </Badge>
              ) : null}
            </div>
          </LabelText>
        </div>

        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <LabelText collapsed={collapsed} className={cn("!delay-0", collapsed ? "mb-0" : "mb-1.5")}>
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
                      onClick={() => { onNavigate?.(); onItemClick?.(); }}
                      className={cn(
                        'group flex items-center rounded-lg text-sm font-medium transition-all',
                        collapsed
                          ? 'justify-center px-0 py-2.5 mx-auto w-10'
                          : 'px-3 py-2 gap-3',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      )}
                    >
                      <Icon className={cn('shrink-0', collapsed ? 'size-5' : 'size-4')} />
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

      <div className={cn('border-t border-sidebar-border', collapsed ? 'p-2 flex flex-col gap-2 items-center safe-bottom' : 'p-3')}>
        {isFreeTrial && (
          <Link href="/abonnement" className={cn('block', collapsed ? 'w-full' : 'mb-2')}>
            <Button
              type="button"
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-sm border-0 transition-all',
                collapsed ? 'size-10 mx-auto p-0' : 'w-full px-3 py-2'
              )}
              title={collapsed ? t('layout.sidebar.upgrade') || 'Passer Premium' : undefined}
            >
              <Crown className={cn('size-4 shrink-0', collapsed && 'mr-0')} />
              <LabelText collapsed={collapsed} className="font-semibold text-xs tracking-wide">
                {t('layout.sidebar.upgrade') || 'Passer Premium'}
              </LabelText>
            </Button>
          </Link>
        )}
        {isPaid && (
          <Link href="/abonnement" className={cn('block', collapsed ? 'w-full' : 'mb-2')}>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg border-emerald-200/50 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all',
                collapsed ? 'size-10 mx-auto p-0' : 'w-full px-3 py-2'
              )}
              title={collapsed ? t('layout.sidebar.my_subscription') || 'Mon Abonnement' : undefined}
            >
              <Crown className={cn('size-4 shrink-0', collapsed && 'mr-0')} />
              <LabelText collapsed={collapsed} className="font-semibold text-xs">
                {t('layout.sidebar.my_subscription') || 'Mon Abonnement'}
              </LabelText>
            </Button>
          </Link>
        )}

        <Button
          type="button"
          variant="ghost"
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all',
            collapsed ? 'size-10 mx-auto p-0' : 'w-full px-3 py-2 mt-2'
          )}
          onClick={onSignOut}
          title={collapsed ? t('layout.sidebar.signout') : undefined}
        >
          <LogOut className="size-4 shrink-0" />
          <LabelText collapsed={collapsed}>{t('layout.sidebar.signout')}</LabelText>
        </Button>
      </div>
    </aside>
  );
}
