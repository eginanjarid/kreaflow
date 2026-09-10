import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { sendMagicLinkEmail } from '@/lib/smtp-mailer'
import { DEFAULT_MAGIC_LINK_SETTINGS, APP_CONFIG_KEY, type MagicLinkSettings } from '@/lib/email-config'
import { TRIAL_DAYS, isPaidPlan } from '@/lib/workspace'

const KF_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'
const SETTINGS_KEY = 'trial_settings'

function adminClient() {
  return createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/trial — cek apakah trial lagi dibuka admin (public)
export async function GET() {
  const admin = adminClient()
  const { data } = await admin.from('kf_app_settings').select('value').eq('key', SETTINGS_KEY).maybeSingle()
  const enabled = (data?.value as { enabled?: boolean } | null)?.enabled === true
  return NextResponse.json({ enabled })
}

// POST /api/trial — mulai trial 7 hari (public)
export async function POST(req: NextRequest) {
  const { email, nama } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })

  const cleanEmail = (email as string).toLowerCase().trim()
  const cleanNama = ((nama as string) || '').trim() || 'KreaFlow User'
  const admin = adminClient()

  const { data: settingsData } = await admin.from('kf_app_settings').select('value').eq('key', SETTINGS_KEY).maybeSingle()
  const enabled = (settingsData?.value as { enabled?: boolean } | null)?.enabled === true
  if (!enabled) return NextResponse.json({ error: 'Trial sedang tidak dibuka saat ini.' }, { status: 400 })

  // Cari user existing
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = users.find(u => u.email === cleanEmail)

  if (existing) {
    const { data: existingWs } = await admin
      .from('kf_workspaces')
      .select('plan, trial_used_at')
      .eq('owner_id', existing.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (existingWs && isPaidPlan(existingWs.plan)) {
      return NextResponse.json({ error: 'Email ini sudah punya akses KreaFlow. Langsung masuk aja.', alreadyActive: true }, { status: 400 })
    }
    if (existingWs?.trial_used_at) {
      return NextResponse.json({ error: 'Email ini sudah pernah pakai trial sebelumnya.', alreadyUsed: true }, { status: 400 })
    }
  }

  let userId: string
  if (existing) {
    userId = existing.id
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: cleanEmail,
      email_confirm: true,
      user_metadata: { nama: cleanNama, provisioned_from: 'trial' },
    })
    if (createErr || !created?.user) return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 })
    userId = created.user.id
  }

  const now = new Date()
  const trialExpiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: existingWs } = await admin
    .from('kf_workspaces')
    .select('id')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!existingWs) {
    const { data: ws } = await admin.from('kf_workspaces').insert({
      name: 'My Workspace',
      owner_id: userId,
      plan: 'trial',
      brand_type: null,
      max_workspaces: 1,
      max_members: 4,
      trial_expires_at: trialExpiresAt,
      trial_used_at: now.toISOString(),
    }).select('id').single()

    if (ws?.id) {
      await admin.from('kf_workspace_members').insert({
        workspace_id: ws.id, user_id: userId, role: 'owner', jabatan: 'Content Strategist',
      })
    }
  } else {
    await admin.from('kf_workspaces').update({
      plan: 'trial',
      trial_expires_at: trialExpiresAt,
      trial_used_at: now.toISOString(),
    }).eq('id', existingWs.id)
  }

  // Kirim magic link
  try {
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: cleanEmail,
      options: { redirectTo: `${KF_APP_URL}/auth/callback` },
    })
    if (linkData?.properties?.hashed_token) {
      const loginUrl = `${KF_APP_URL}/auth/verify?token_hash=${linkData.properties.hashed_token}&type=email`
      const { data: config } = await admin.from('app_config').select('value').eq('key', APP_CONFIG_KEY).maybeSingle()
      const settings: MagicLinkSettings = {
        ...DEFAULT_MAGIC_LINK_SETTINGS,
        ...(config?.value ?? {}),
        subject: `Trial ${TRIAL_DAYS} hari KreaFlow kamu udah aktif! 🎉`,
      }
      await sendMagicLinkEmail(cleanEmail, loginUrl, settings)
    }
  } catch (e) {
    console.error('[trial/claim] Gagal kirim email:', e)
  }

  return NextResponse.json({ success: true })
}
