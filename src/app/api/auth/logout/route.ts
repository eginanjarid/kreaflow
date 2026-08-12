import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const AUTH_COOKIE_NAME = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`

function buildSupabase(req: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: AUTH_COOKIE_NAME },
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )
}

// GET — called by server redirect when refresh token is invalid
export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', req.url))
  // Clear the auth cookie directly so expired token doesn't loop
  response.cookies.delete(AUTH_COOKIE_NAME)
  try {
    const supabase = buildSupabase(req, response)
    await supabase.auth.signOut()
  } catch { /* ignore signOut errors on invalid session */ }
  return response
}

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true })
  const supabase = buildSupabase(req, response)
  await supabase.auth.signOut()
  return response
}
