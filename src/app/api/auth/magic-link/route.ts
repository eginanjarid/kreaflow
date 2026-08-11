import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendMagicLinkEmail } from '@/lib/smtp-mailer'
import { DEFAULT_MAGIC_LINK_SETTINGS, APP_CONFIG_KEY, type MagicLinkSettings } from '@/lib/email-config'

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })

  const supabase = createServiceClient()

  // Check user exists (shouldCreateUser = false)
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const exists = users.some((u: { email?: string }) => u.email === email)
  if (!exists) {
    return NextResponse.json(
      { error: 'Email ini belum terdaftar. Silakan beli akses KreaFlow terlebih dahulu.' },
      { status: 400 }
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

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: 'Gagal membuat link. Coba beberapa saat lagi.' }, { status: 500 })
  }

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
    await sendMagicLinkEmail(email, data.properties.action_link, settings)
  } catch (e) {
    console.error('[kreaflow/magic-link] Gagal kirim email:', e)
    return NextResponse.json({ error: 'Gagal mengirim email. Periksa konfigurasi SMTP.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
