export type UserRole = 'visiteur' | 'exposant' | 'admin';
export type AccessLevel = 'classic' | 'premium';

export interface PermissionUser {
  role: UserRole | string | null;
  access_level: AccessLevel | string | null;
  id?: string;
}

export interface PermissionTarget {
  access_level?: AccessLevel | string | null;
  role?: UserRole | string | null;
  profile_id?: string | null;
}

const CLASSIC_DAILY_LIMIT = 50;

export function canReadFeed(user: PermissionUser): boolean {
  return user.role === 'admin' || user.role === 'exposant' || user.role === 'visiteur';
}

export function canReadAgenda(user: PermissionUser): boolean {
  return user.role === 'admin' || user.role === 'exposant' || user.role === 'visiteur';
}

export function canSeeExposants(user: PermissionUser): boolean {
  return user.role === 'admin' || user.role === 'exposant' || user.role === 'visiteur';
}

export function canRequestRdv(user: PermissionUser): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'exposant') return true;
  if (user.role === 'visiteur' && user.access_level === 'premium') return true;
  return false;
}

export function canContactExposant(user: PermissionUser): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'exposant') return true;
  if (user.role === 'visiteur' && user.access_level === 'premium') return true;
  return false;
}

export function canSeeContactDetails(user: PermissionUser): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'exposant') return true;
  if (user.role === 'visiteur' && user.access_level === 'premium') return true;
  return false;
}

export function canUseChat(user: PermissionUser): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'exposant') return true;
  if (user.role === 'visiteur' && user.access_level === 'premium') return true;
  return false;
}

export function hasUnlimitedMessaging(user: PermissionUser): boolean {
  if (user.role === 'admin') return true;
  if (user.access_level === 'premium') return true;
  return false;
}

export function canExchangeWith(
  currentUser: PermissionUser,
  targetUser: PermissionTarget
): boolean {
  if (currentUser.role === 'admin') return true;

  const currentIsPremium = currentUser.access_level === 'premium';
  const targetIsPremium = targetUser.access_level === 'premium';

  if (currentIsPremium || targetIsPremium) return true;

  return currentUser.role === 'exposant';
}

export function getDailyExchangeLimit(): number {
  return CLASSIC_DAILY_LIMIT;
}

export function hasReachedExchangeLimit(
  dailyCount: number,
  lastReset: string | null
): boolean {
  if (!lastReset) return dailyCount >= CLASSIC_DAILY_LIMIT;

  const lastResetDate = new Date(lastReset);
  const now = new Date();
  const isSameDay =
    lastResetDate.getFullYear() === now.getFullYear() &&
    lastResetDate.getMonth() === now.getMonth() &&
    lastResetDate.getDate() === now.getDate();

  if (!isSameDay) return false;

  return dailyCount >= CLASSIC_DAILY_LIMIT;
}
