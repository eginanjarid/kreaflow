import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_COOKIE_NAME = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: AUTH_COOKIE_NAME },
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

  const isPublicRoute = pathname === '/' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/payment/success' ||
    pathname === '/email-magic-link.html' ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/auth/')

  const isNoAccess = pathname.startsWith('/no-access')
  const isExpired  = pathname.startsWith('/expired')

  if (!user && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/sprints', request.url))
  }

  // Cek product_access — user harus punya akses KreaFlow (tidak cukup hanya punya akun Supabase)
  if (user && !isAuthRoute && !isPublicRoute && !isNoAccess && !isExpired) {
    const { data: access } = await supabase
      .from('product_access')
      .select('app, expires_at')
      .eq('user_id', user.id)
      .eq('app', 'kreaflow')
      .maybeSingle()

    if (!access) {
      return NextResponse.redirect(new URL('/no-access', request.url))
    }
    if (access.expires_at && new Date(access.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/expired', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|supabase).*)'],
}
