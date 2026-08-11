import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'recovery' | 'invite' | null
  const next = searchParams.get('next') ?? '/sprints'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) return NextResponse.redirect(new URL(next, appUrl))
    console.error('[auth/verify] verifyOtp error:', error.message)
  }

  return NextResponse.redirect(new URL('/login?error=auth', appUrl))
}
