'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

const ADMIN_MAP: Record<string, Omit<Crumb, 'href'>> = {
  '/admin': { label: 'Dashboard' },
  '/admin/users': { label: 'Utilisateurs' },
  '/admin/exposants': { label: 'Exposants' },
  '/admin/abonnes': { label: 'Acces' },
  '/admin/programme': { label: 'Programme' },
  '/admin/tickets': { label: 'Tickets' },
  '/admin/newsletter': { label: 'Newsletter' },
};

const USER_MAP: Record<string, Omit<Crumb, 'href'>> = {
  '/app': { label: 'Accueil' },
  '/feed': { label: "Fil d'actualites" },
  '/annuaire': { label: 'Annuaire' },
  '/chat': { label: 'Messages' },
  '/agenda': { label: 'Agenda' },
  '/vitrine': { label: 'Catalogue produits' },
  '/exposant/ma-vitrine': { label: 'Gérer ma vitrine' },
  '/newsletter': { label: 'Newsletter' },
  '/support': { label: 'Support' },
  '/abonnement': { label: 'Abonnement' },
};

function buildAdminCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Administration', href: '/admin' }];

  if (pathname === '/admin') return crumbs;

  const detail = ADMIN_MAP[pathname];
  if (detail) {
    crumbs.push({ label: detail.label });
    return crumbs;
  }

  return crumbs;
}

function buildUserCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Plateforme', href: '/app' }];

  if (pathname === '/app') return crumbs;

  const detail = USER_MAP[pathname];
  if (detail) {
    const section = getSection(pathname);
    if (section && section !== 'Plateforme') {
      crumbs[crumbs.length - 1] = { label: section, href: getSectionHref(pathname) };
    }
    crumbs.push({ label: detail.label });
    return crumbs;
  }

  if (pathname.startsWith('/annuaire/')) {
    crumbs.push({ label: 'Annuaire', href: '/annuaire' }, { label: 'Fiche exposant' });
    return crumbs;
  }
  if (pathname.startsWith('/chat/')) {
    crumbs.push({ label: 'Messages', href: '/chat' }, { label: 'Conversation' });
    return crumbs;
  }
  if (pathname.startsWith('/exposant/')) {
    crumbs.push({ label: 'Business', href: '/vitrine' }, { label: 'Gérer ma vitrine' });
    return crumbs;
  }
  if (pathname.startsWith('/support/')) {
    crumbs.push({ label: 'Support', href: '/support' }, { label: 'Ticket' });
    return crumbs;
  }

  return crumbs;
}

function getSection(pathname: string): string | null {
  if (pathname.startsWith('/vitrine') || pathname.startsWith('/exposant')) return 'Business';
  if (['/newsletter', '/support', '/abonnement'].some((p) => pathname === p)) return 'Compte';
  return null;
}

function getSectionHref(pathname: string): string | undefined {
  if (pathname.startsWith('/vitrine') || pathname.startsWith('/exposant')) return '/vitrine';
  if (pathname === '/newsletter' || pathname === '/support' || pathname === '/abonnement') return undefined;
  return undefined;
}

export function AdminBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname();
  const crumbs = buildAdminCrumbs(pathname);

  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)}>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3 text-muted-foreground/40" />}
          {crumb.href && i < crumbs.length - 1 ? (
            <Link href={crumb.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function UserBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname();
  const crumbs = buildUserCrumbs(pathname);

  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)}>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3 text-muted-foreground/40" />}
          {crumb.href && i < crumbs.length - 1 ? (
            <Link href={crumb.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
