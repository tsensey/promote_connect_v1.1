import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

const PUBLIC_ROUTES = new Set(['/', '/login', '/register'])

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname)
}

async function getUserProfile(supabase: ReturnType<typeof createServerClient<Database>>, userId: string) {
  const { data } = await (supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', userId)
    .single() as never) as { data: { role: string | null; is_active: boolean | null } | null };
  return data ? { role: data.role, is_active: data.is_active ?? true } : null
}

async function getSubscriptionStatus(supabase: ReturnType<typeof createServerClient<Database>>, userId: string) {
  const { data, error } = await (supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', userId)
    .single() as never) as { data: { subscription_status: string | null } | null; error: unknown };

  if (error) return null
  return data?.subscription_status ?? null
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
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
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

  const needsProfileCheck = pathname === '/login' || pathname === '/register' || pathname === '/' || pathname.startsWith('/admin') || pathname.startsWith('/exposant') || pathname.startsWith('/app') || pathname.startsWith('/feed') || pathname.startsWith('/chat') || pathname.startsWith('/annuaire') || pathname.startsWith('/agenda') || pathname.startsWith('/vitrine') || pathname.startsWith('/abonnement')

  let profile: { role: string | null; is_active: boolean } | null = null
  if (needsProfileCheck) {
    profile = await getUserProfile(supabase, user.id)
  }

  const role = profile?.role ?? null
  const isAdmin = role === 'admin'
  const isExposant = role === 'exposant'
  const isActive = profile?.is_active ?? true

  if (!isActive) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('suspended', 'true')
    return NextResponse.redirect(url)
  }

  const subscriptionStatus = !isAdmin && needsProfileCheck
    ? await getSubscriptionStatus(supabase, user.id)
    : null

  if (!isAdmin && (subscriptionStatus === 'expired' || subscriptionStatus === 'past_due' || subscriptionStatus === 'canceled')) {
    if (!isPublicRoute(pathname) && !pathname.startsWith('/abonnement')) {
      const url = request.nextUrl.clone()
      url.pathname = '/abonnement'
      url.searchParams.set('expired', 'true')
      return NextResponse.redirect(url)
    }
  }

  if (pathname === '/login' || pathname === '/register') {
    const url = request.nextUrl.clone()
    url.pathname = isAdmin ? '/admin' : '/feed'
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && !isAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/exposant') && !isExposant) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  return response
}
