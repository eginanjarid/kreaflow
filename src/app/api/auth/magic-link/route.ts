import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })

  const response = NextResponse.json({ success: true })

  const supabase = createServerClient(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Always use server-side APP_URL — never trust client origin (could be localhost)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'
  let nextPath = '/sprints'
  try {
    const parsed = new URL(redirectTo || '')
    const n = parsed.searchParams.get('next')
    if (n) nextPath = n
  } catch {}
  const callbackUrl = `${appUrl}/auth/callback${nextPath !== '/sprints' ? `?next=${encodeURIComponent(nextPath)}` : ''}`

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl,
      shouldCreateUser: false,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message || 'Gagal mengirim link. Pastikan email terdaftar.' }, { status: 400 })
  }

  return response
}
