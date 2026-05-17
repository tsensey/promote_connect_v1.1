import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface IdentityData {
  displayName: string;
  avatarUrl: string | null;
  companyName: string | null;
  role: string | null;
  exposantId: string | null;
}

export function getDisplayName(
  profile?: { full_name?: string | null; role?: string | null } | null,
  exposants?: Array<{ nom?: string | null }> | null
): string | undefined {
  if (profile?.role === 'exposant' && exposants?.[0]?.nom) {
    return exposants[0].nom ?? undefined;
  }
  return profile?.full_name ?? undefined;
}

export function getAvatarUrl(
  profile?: { avatar_url?: string | null; role?: string | null } | null,
  exposants?: Array<{ logo_url?: string | null }> | null
): string | undefined {
  if (profile?.role === 'exposant' && exposants?.[0]?.logo_url) {
    return exposants[0].logo_url ?? undefined;
  }
  return profile?.avatar_url ?? undefined;
}

export function getCompanyName(
  profile?: { company?: string | null; role?: string | null } | null,
  exposants?: Array<{ nom?: string | null }> | null
): string | undefined {
  if (profile?.role === 'exposant' && exposants?.[0]?.nom) {
    return exposants[0].nom ?? undefined;
  }
  return profile?.company ?? undefined;
}

export function getExposantId(exposants?: Array<{ id?: string }> | null): string | undefined {
  return exposants?.[0]?.id ?? undefined;
}

export function UserIdentity({
  identity,
  size = 'sm',
  showCompany = true,
  className,
}: {
  identity: IdentityData | null;
  size?: 'sm' | 'md' | 'lg';
  showCompany?: boolean;
  className?: string;
}) {
  if (!identity) return null;

  const sizeClasses = {
    sm: { avatar: 'size-8', text: 'text-sm', company: 'text-xs' },
    md: { avatar: 'size-10', text: 'text-base', company: 'text-sm' },
    lg: { avatar: 'size-14', text: 'text-lg', company: 'text-sm' },
  };

  const s = sizeClasses[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Avatar className={cn(s.avatar, 'shrink-0 ring-2 ring-border/20')}>
        {identity.avatarUrl ? (
          <AvatarImage src={identity.avatarUrl} />
        ) : (
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {identity.displayName?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="min-w-0">
        <p className={cn(s.text, 'font-semibold text-foreground truncate')}>
          {identity.displayName}
        </p>
        {showCompany && identity.companyName && (
          <p className={cn(s.company, 'text-muted-foreground truncate')}>
            {identity.companyName}
          </p>
        )}
      </div>
    </div>
  );
}
