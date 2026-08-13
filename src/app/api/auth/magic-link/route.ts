import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendMagicLinkEmail } from '@/lib/smtp-mailer'
import { DEFAULT_MAGIC_LINK_SETTINGS, APP_CONFIG_KEY, type MagicLinkSettings } from '@/lib/email-config'

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existingUser = users.find((u: { email?: string }) => u.email === email)

  if (!existingUser) {
    return NextResponse.json(
      { error: 'Email ini belum terdaftar. Silakan beli akses KreaFlow terlebih dahulu.' },
      { status: 400 }
    )
  }

  // Cek apakah user punya product_access kreaflow
  const { data: userAccess } = await supabase
    .from('product_access')
    .select('app, expires_at')
    .eq('user_id', existingUser.id)
    .eq('app', 'kreaflow')
    .maybeSingle()

  if (!userAccess) {
    // Fallback: cek apakah user adalah member di workspace manapun (diundang oleh owner)
    const { data: membership } = await supabase
      .from('kf_workspace_members')
      .select('id')
      .eq('user_id', existingUser.id)
      .limit(1)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: 'Akun ini belum punya akses KreaFlow. Silakan beli akses terlebih dahulu.' },
        { status: 403 }
      )
    }
    // Member workspace → boleh login, lanjut
  } else if (userAccess.expires_at && new Date(userAccess.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'Akses KreaFlow sudah kedaluwarsa.' },
      { status: 403 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'
  let nextPath = '/sprints'
  try {
    const parsed = new URL(redirectTo || '')
    const n = parsed.searchParams.get('next')
    if (n) nextPath = n
  } catch {}
  const callbackUrl = `${appUrl}/auth/callback${nextPath !== '/sprints' ? `?next=${encodeURIComponent(nextPath)}` : ''}`

  // Generate magic link via admin API — kita yang kirim emailnya
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: callbackUrl },
  })

  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json({ error: 'Gagal membuat link. Coba beberapa saat lagi.' }, { status: 500 })
  }

  // Gunakan token_hash untuk server-side verification (hindari implicit flow)
  const verifyUrl = `${appUrl}/auth/verify?token_hash=${data.properties.hashed_token}&type=email${nextPath !== '/sprints' ? `&next=${encodeURIComponent(nextPath)}` : ''}`

  // Ambil template dari DB, fallback ke default
  const { data: config } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', APP_CONFIG_KEY)
    .maybeSingle()

  const settings: MagicLinkSettings = {
    ...DEFAULT_MAGIC_LINK_SETTINGS,
    ...(config?.value ?? {}),
  }

  try {
    await sendMagicLinkEmail(email, verifyUrl, settings, data.properties.email_otp)
  } catch (e) {
    console.error('[kreaflow/magic-link] Gagal kirim email:', e)
    return NextResponse.json({ error: 'Gagal mengirim email. Periksa konfigurasi SMTP.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
