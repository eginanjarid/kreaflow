import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  const { email, token } = await req.json()
  if (!email || !token) return NextResponse.json({ error: 'Email dan kode wajib diisi' }, { status: 400 })

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

  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) return NextResponse.json({ error: 'Kode salah atau sudah expired. Coba kirim ulang.' }, { status: 401 })

  return response
}
