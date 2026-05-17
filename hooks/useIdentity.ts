import { useAuth } from '@/lib/auth/context';

export interface ResolvedIdentity {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  companyName: string | null;
  role: string | null;
  exposantId: string | null;
}

export function useIdentity() {
  const { profile, exposant } = useAuth();

  if (!profile) return null;

  if (profile.role === 'exposant' && exposant) {
    return {
      id: profile.id,
      displayName: exposant.nom,
      avatarUrl: exposant.logo_url ?? profile.avatar_url,
      companyName: exposant.nom,
      role: profile.role,
      exposantId: exposant.id,
    } satisfies ResolvedIdentity;
  }

  return {
    id: profile.id,
    displayName: profile.full_name ?? 'Utilisateur',
    avatarUrl: profile.avatar_url,
    companyName: profile.company,
    role: profile.role,
    exposantId: null,
  } satisfies ResolvedIdentity;
}
