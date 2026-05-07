import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

const PUBLIC_ROUTES = new Set(['/', '/login', '/register'])
const SUBSCRIPTION_EXCEPTION_PREFIXES = ['/abonnement', '/support']

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname)
}

function isSubscriptionException(pathname: string) {
  return SUBSCRIPTION_EXCEPTION_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(url)
  }

  if (!user) {
    return supabaseResponse
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, subscription_status')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const hasActiveSubscription =
    profile?.subscription_status === 'active' || profile?.subscription_status === 'trial'

  if (pathname === '/login' || pathname === '/register') {
    const url = request.nextUrl.clone()
    url.pathname = isAdmin ? '/admin' : '/app'
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && !isAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/app'
    return NextResponse.redirect(url)
  }

  if (!isAdmin && !isPublicRoute(pathname) && !isSubscriptionException(pathname) && !hasActiveSubscription) {
    const url = request.nextUrl.clone()
    url.pathname = '/abonnement'
    url.searchParams.set('subscription', 'required')
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
