import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

const PUBLIC_ROUTES = new Set(['/', '/login', '/register'])

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname)
}

async function getUserRole(supabase: ReturnType<typeof createServerClient<Database>>, userId: string): Promise<string | null> {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return data?.role ?? null
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

  const needsRoleCheck = pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin')
  let isAdmin = false
  if (needsRoleCheck) {
    const role = await getUserRole(supabase, user.id)
    isAdmin = role === 'admin'
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

  return response
}
