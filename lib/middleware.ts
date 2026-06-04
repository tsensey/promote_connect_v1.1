import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import { shouldShowTrialBanner } from '@/lib/subscription'

const PUBLIC_ROUTES = new Set(['/', '/login', '/register', '/forgot-password'])

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname) || pathname.startsWith('/reset-password')
}

interface UserProfile {
  role: string | null;
  account_status: string | null;
  is_active: boolean | null;
  subscription_tier: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
}

const PROFILE_CACHE_COOKIE = 'pc';
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedProfile(request: NextRequest): { profile: UserProfile | null; userId: string | null } {
  const raw = request.cookies.get(PROFILE_CACHE_COOKIE)?.value;
  if (!raw) return { profile: null, userId: null };
  try {
    const parsed = JSON.parse(atob(raw));
    if (Date.now() - parsed.ts > PROFILE_CACHE_TTL) return { profile: null, userId: null };
    return { profile: parsed.data as UserProfile, userId: parsed.uid };
  } catch {
    return { profile: null, userId: null };
  }
}

function setCachedProfile(response: NextResponse, userId: string, profile: UserProfile) {
  const value = btoa(JSON.stringify({ data: profile, uid: userId, ts: Date.now() }));
  response.cookies.set(PROFILE_CACHE_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 300,
  });
}

async function getUserProfile(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await (supabase
    .from('profiles')
    .select('role, account_status, is_active, subscription_tier, trial_ends_at, subscription_ends_at')
    .eq('id', userId)
    .single() as never) as { data: UserProfile | null, error: any };

  if (error) {
    console.error('[Middleware] Error fetching profile for user', userId, ':', error);
  } else {
    console.log('[Middleware] Successfully fetched profile for user', userId, 'role:', data?.role);
  }

  return data;
}

function isAccountBlocked(profile: UserProfile): boolean {
  // Vérifier d'abord le nouveau champ account_status
  if (profile.account_status) {
    return profile.account_status === 'suspended' || profile.account_status === 'blocked';
  }
  // Fallback legacy is_active
  return profile.is_active === false;
}

function hasExpiredAccess(profile: UserProfile): boolean {
  // Pour les abonnés PAID — vérifier subscription_ends_at
  if (profile.subscription_tier === 'paid' && profile.subscription_ends_at) {
    return new Date(profile.subscription_ends_at) < new Date();
  }
  return false;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (!isPublicRoute(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(url)
    }
    return response
  }

  // Déterminer si on a besoin de vérifier le profil
  const needsProfileCheck = !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/offline')

  let profile: UserProfile | null = null
  if (needsProfileCheck) {
    // Try cache first
    const cached = getCachedProfile(request);
    if (cached.userId === user.id && cached.profile) {
      profile = cached.profile;
    } else {
      profile = await getUserProfile(supabase, user.id);
      if (profile) {
        setCachedProfile(response, user.id, profile);
      }
    }
  }

  // Fallback sur user_metadata si le profil n'a pas pu être chargé (ex: erreur RLS)
  const role = profile?.role ?? user.user_metadata?.role ?? null
  const isAdmin = role === 'admin'

  // SEC-04 CORRIGÉ: Message générique — ne pas révéler si l'utilisateur est suspendu ou bloqué
  // CdC §3.1 : "Le message affiché à l'utilisateur à la connexion ne doit pas préciser s'il est suspendu ou bloqué"
  if (profile && isAccountBlocked(profile)) {
    if (!isPublicRoute(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      // Utiliser un message générique au lieu de 'suspended=true'
      url.searchParams.set('error', 'access_denied')
      return NextResponse.redirect(url)
    }
    return response
  }

  // Vérifier l'expiration d'accès pour les non-admins
  if (!isAdmin && profile && hasExpiredAccess(profile)) {
    if (!isPublicRoute(pathname) && !pathname.startsWith('/abonnement')) {
      const url = request.nextUrl.clone()
      url.pathname = '/abonnement'
      url.searchParams.set('expired', 'true')
      return NextResponse.redirect(url)
    }
  }

  // Rediriger les utilisateurs connectés depuis les pages auth
  if (pathname === '/login' || pathname === '/register') {
    const url = request.nextUrl.clone()
    url.pathname = isAdmin ? '/admin' : '/feed'
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  // Garder admin uniquement sur /admin/*
  if (pathname.startsWith('/admin') && !isAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  // Garder exposant uniquement sur /exposant/*
  if (pathname.startsWith('/exposant') && role !== 'exposant' && !isAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  // Injecter un header indiquant si la bannière trial doit s'afficher
  // Le layout client peut lire ce header pour afficher TrialBanner
  if (profile?.subscription_tier === 'free_trial' && profile?.trial_ends_at) {
    if (shouldShowTrialBanner(profile.trial_ends_at)) {
      response.headers.set('x-show-trial-banner', 'true')
      response.headers.set('x-trial-ends-at', profile.trial_ends_at)
    }
  }

  return response
}
