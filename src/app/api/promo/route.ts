import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { sendMagicLinkEmail } from '@/lib/smtp-mailer'
import { DEFAULT_MAGIC_LINK_SETTINGS, APP_CONFIG_KEY, type MagicLinkSettings } from '@/lib/email-config'
import type { PromoLink } from '@/app/api/admin/promo/route'

const KF_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'
const SETTINGS_KEY = 'promo_links'

function adminClient() {
  return createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getPlanLimits(plan: string) {
  if (plan === 'agency')  return { maxWorkspaces: 10, maxMembers: 11, expiresAt: null, name: 'Agency Lifetime' }
  if (plan === 'pro')     return { maxWorkspaces: 4,  maxMembers: 6,  expiresAt: null, name: 'Pro Lifetime' }
  if (plan === 'bulanan') {
    const exp = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)
    return { maxWorkspaces: 1, maxMembers: 4, expiresAt: exp.toISOString(), name: 'Bulanan' }
  }
  return { maxWorkspaces: 2, maxMembers: 4, expiresAt: null, name: 'Basic Lifetime' }
}

// GET /api/promo?token=XXX — check token validity (public)
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')?.toUpperCase()
  if (!token) return NextResponse.json({ error: 'Token diperlukan' }, { status: 400 })

  const admin = adminClient()
  const { data } = await admin.from('kf_app_settings').select('value').eq('key', SETTINGS_KEY).maybeSingle()
  const links: PromoLink[] = (data?.value as PromoLink[]) || []

  const link = links.find(l => l.token === token)
  if (!link || !link.active) return NextResponse.json({ valid: false, reason: 'invalid' })
  if (link.starts_at && new Date(link.starts_at) > new Date()) return NextResponse.json({ valid: false, reason: 'notyet', starts_at: link.starts_at })
  if (link.expires_at && new Date(link.expires_at) < new Date()) return NextResponse.json({ valid: false, reason: 'expired' })
  if (link.max_uses !== null && link.claimed_emails.length >= link.max_uses) return NextResponse.json({ valid: false, reason: 'maxed' })

  const limits = getPlanLimits(link.plan)
  return NextResponse.json({
    valid: true,
    plan: link.plan,
    plan_name: limits.name,
    label: link.label,
    remaining: link.max_uses !== null ? link.max_uses - link.claimed_emails.length : null,
  })
}

// POST /api/promo — claim token (public)
export async function POST(req: NextRequest) {
  const { token, email } = await req.json()
  if (!token || !email) return NextResponse.json({ error: 'token dan email wajib' }, { status: 400 })

  const cleanEmail = email.toLowerCase().trim()
  const cleanToken = token.toUpperCase().trim()
  const admin = adminClient()

  // Load dan validasi link
  const { data: settingsData } = await admin.from('kf_app_settings').select('value').eq('key', SETTINGS_KEY).maybeSingle()
  const links: PromoLink[] = (settingsData?.value as PromoLink[]) || []
  const idx = links.findIndex(l => l.token === cleanToken)

  if (idx === -1 || !links[idx].active) return NextResponse.json({ error: 'Link tidak valid atau sudah tidak aktif' }, { status: 400 })

  const link = links[idx]
  if (link.starts_at && new Date(link.starts_at) > new Date()) return NextResponse.json({ error: 'Promo ini belum dimulai' }, { status: 400 })
  if (link.expires_at && new Date(link.expires_at) < new Date()) return NextResponse.json({ error: 'Link sudah kadaluarsa' }, { status: 400 })
  if (link.max_uses !== null && link.claimed_emails.length >= link.max_uses) return NextResponse.json({ error: 'Kuota link sudah habis' }, { status: 400 })
  if (link.claimed_emails.includes(cleanEmail)) return NextResponse.json({ error: 'Email ini sudah pernah klaim link ini' }, { status: 400 })

  const limits = getPlanLimits(link.plan)

  // Cari atau buat user
  let userId: string | null = null
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = users.find(u => u.email === cleanEmail)

  if (existing) {
    userId = existing.id
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: cleanEmail,
      email_confirm: true,
      user_metadata: { provisioned_by: 'promo', promo_token: cleanToken },
    })
    if (createErr || !created?.user) return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 })
    userId = created.user.id
  }

  // Upsert product_access
  const { data: existingAccess } = await admin.from('product_access').select('user_id').eq('user_id', userId).eq('app', 'kreaflow').maybeSingle()
  if (existingAccess) {
    await admin.from('product_access').update({ expires_at: limits.expiresAt }).eq('user_id', userId).eq('app', 'kreaflow')
  } else {
    await admin.from('product_access').insert({ user_id: userId, app: 'kreaflow', expires_at: limits.expiresAt })
  }

  // Workspace
  const { data: existingWs } = await admin.from('kf_workspaces').select('id, max_members').eq('owner_id', userId).order('created_at', { ascending: true }).limit(1).maybeSingle()
  if (!existingWs) {
    const { data: ws } = await admin.from('kf_workspaces').insert({
      name: 'My Workspace',
      owner_id: userId,
      plan: 'lifetime',
      max_workspaces: limits.maxWorkspaces,
      max_members: limits.maxMembers,
    }).select('id').single()
    if (ws?.id) {
      await admin.from('kf_workspace_members').insert({ workspace_id: ws.id, user_id: userId, role: 'owner', jabatan: 'Content Strategist' })
    }
  } else if (limits.maxMembers > (existingWs.max_members ?? 0)) {
    await admin.from('kf_workspaces').update({ max_workspaces: limits.maxWorkspaces, max_members: limits.maxMembers }).eq('owner_id', userId)
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
        subject: `Akses ${limits.name} KreaFlow kamu sudah aktif! 🎉`,
      }
      await sendMagicLinkEmail(cleanEmail, loginUrl, settings)
    }
  } catch (e) {
    console.error('[promo/claim] Gagal kirim email:', e)
  }

  // Update claimed_emails di settings
  links[idx].claimed_emails.push(cleanEmail)
  await admin.from('kf_app_settings').upsert(
    { key: SETTINGS_KEY, value: links, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  return NextResponse.json({ success: true, plan: link.plan, plan_name: limits.name })
}
