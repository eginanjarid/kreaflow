import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Cookie name must match middleware and server client
const AUTH_COOKIE_NAME = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'recovery' | 'invite' | null
  const next = searchParams.get('next') ?? '/sprints'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'
  const errorUrl = new URL('/login?error=auth', appUrl)

  if (!token_hash || !type) return NextResponse.redirect(errorUrl)

  // Create response first — setAll will attach cookies to it
  const successResponse = NextResponse.redirect(new URL(next, appUrl))

  const supabase = createServerClient(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: AUTH_COOKIE_NAME },
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            successResponse.cookies.set({ name, value, ...(options ?? {}) })
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({ token_hash, type })
  if (error) {
    console.error('[kreaflow/auth/verify] verifyOtp error:', error.message)
    return NextResponse.redirect(errorUrl)
  }

  return successResponse
}
