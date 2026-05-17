'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface Crumb {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

const ADMIN_MAP: Record<string, Omit<Crumb, 'href'>> = {
  '/admin': { label: 'layout.breadcrumb.dashboard' },
  '/admin/users': { label: 'layout.breadcrumb.users' },
  '/admin/exposants': { label: 'layout.breadcrumb.exposants' },
  '/admin/programme': { label: 'layout.breadcrumb.programme' },
  '/admin/tickets': { label: 'layout.breadcrumb.tickets' },
  '/admin/newsletter': { label: 'layout.breadcrumb.newsletter' },
  '/admin/espaces': { label: 'layout.breadcrumb.espaces' },
  '/admin/logs': { label: 'layout.breadcrumb.logs' },
};

const USER_MAP: Record<string, Omit<Crumb, 'href'>> = {
  '/app': { label: 'layout.breadcrumb.home' },
  '/feed': { label: 'layout.breadcrumb.feed' },
  '/annuaire': { label: 'layout.breadcrumb.annuaire' },
  '/chat': { label: 'layout.breadcrumb.messages' },
  '/agenda': { label: 'layout.breadcrumb.agenda' },
  '/vitrine': { label: 'layout.breadcrumb.catalogue' },
  '/exposant/ma-vitrine': { label: 'layout.breadcrumb.manage_vitrine' },
  '/newsletter': { label: 'layout.breadcrumb.newsletter' },
  '/support': { label: 'layout.breadcrumb.support' },
  '/abonnement': { label: 'layout.breadcrumb.abonnement' },
};

function buildAdminCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'layout.breadcrumb.admin', href: '/admin' }];

  if (pathname === '/admin') return crumbs;

  const detail = ADMIN_MAP[pathname];
  if (detail) {
    crumbs.push({ label: detail.label });
    return crumbs;
  }

  if (pathname.startsWith('/admin/tickets/')) {
    crumbs.push({ label: 'layout.breadcrumb.tickets', href: '/admin/tickets' }, { label: 'layout.breadcrumb.ticket' });
    return crumbs;
  }

  return crumbs;
}

function buildUserCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'layout.breadcrumb.plateforme', href: '/app' }];

  if (pathname === '/app') return crumbs;

  const detail = USER_MAP[pathname];
  if (detail) {
    const section = getSection(pathname);
    if (section && section !== 'layout.breadcrumb.plateforme') {
      crumbs[crumbs.length - 1] = { label: section, href: getSectionHref(pathname) };
    }
    crumbs.push({ label: detail.label });
    return crumbs;
  }

  if (pathname.startsWith('/annuaire/')) {
    crumbs.push({ label: 'layout.breadcrumb.annuaire', href: '/annuaire' }, { label: 'layout.breadcrumb.profile' });
    return crumbs;
  }
  if (pathname.startsWith('/chat/')) {
    crumbs.push({ label: 'layout.breadcrumb.messages', href: '/chat' }, { label: 'layout.breadcrumb.conversation' });
    return crumbs;
  }
  if (pathname.startsWith('/exposant/')) {
    crumbs.push({ label: 'layout.breadcrumb.business', href: '/vitrine' }, { label: 'layout.breadcrumb.manage_vitrine' });
    return crumbs;
  }
  if (pathname.startsWith('/support/')) {
    crumbs.push({ label: 'layout.breadcrumb.support', href: '/support' }, { label: 'layout.breadcrumb.ticket' });
    return crumbs;
  }

  return crumbs;
}

function getSection(pathname: string): string | null {
  if (pathname.startsWith('/vitrine') || pathname.startsWith('/exposant')) return 'layout.breadcrumb.business';
  if (['/newsletter', '/support', '/abonnement'].some((p) => pathname === p)) return 'layout.breadcrumb.account';
  return null;
}

function getSectionHref(pathname: string): string | undefined {
  if (pathname.startsWith('/vitrine') || pathname.startsWith('/exposant')) return '/vitrine';
  if (pathname === '/newsletter' || pathname === '/support' || pathname === '/abonnement') return undefined;
  return undefined;
}

export function AdminBreadcrumb({ className }: { className?: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const crumbs = buildAdminCrumbs(pathname);

  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)}>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3 text-muted-foreground/40" />}
          {crumb.href && i < crumbs.length - 1 ? (
            <Link href={crumb.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {t(crumb.label)}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{t(crumb.label)}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function UserBreadcrumb({ className }: { className?: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const crumbs = buildUserCrumbs(pathname);

  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)}>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3 text-muted-foreground/40" />}
          {crumb.href && i < crumbs.length - 1 ? (
            <Link href={crumb.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {t(crumb.label)}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{t(crumb.label)}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
