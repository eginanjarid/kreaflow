import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { isSuperAdmin } from '@/lib/super-admins'
import { sendWelcomeAccessEmail } from '@/lib/smtp-mailer'
import { DEFAULT_MAGIC_LINK_SETTINGS, APP_CONFIG_KEY, type MagicLinkSettings } from '@/lib/email-config'

const KF_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'

function adminClient() {
  return createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getPlanLimits(plan: string) {
  if (plan === 'agency')  return { maxWorkspaces: 10, maxMembers: 11, expiresAt: null }
  if (plan === 'pro')     return { maxWorkspaces: 4,  maxMembers: 6,  expiresAt: null }
  if (plan === 'bulanan') {
    const exp = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)
    return { maxWorkspaces: 1, maxMembers: 4, expiresAt: exp.toISOString() }
  }
  return { maxWorkspaces: 2, maxMembers: 4, expiresAt: null } // basic (default)
}

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const ok = await isSuperAdmin(user.email!)
  return ok ? user : null
}

// GET /api/admin/access — list semua user dengan product_access kreaflow
export async function GET(req: NextRequest) {
  const caller = await requireSuperAdmin()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = adminClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q')?.toLowerCase() || ''

  const { data: accessRows } = await admin
    .from('product_access')
    .select('user_id, expires_at, created_at')
    .eq('app', 'kreaflow')
    .order('created_at', { ascending: false })

  if (!accessRows?.length) return NextResponse.json({ users: [] })

  const { data: authResult } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const authMap = Object.fromEntries(
    (authResult?.users || []).map(u => [u.id, { email: u.email, name: u.user_metadata?.full_name || u.user_metadata?.nama || '' }])
  )

  const { data: wsRows } = await admin
    .from('kf_workspaces')
    .select('owner_id, plan, max_members, max_workspaces')
    .in('owner_id', accessRows.map(r => r.user_id))

  const wsMap: Record<string, { plan: string; max_members: number; max_workspaces: number }> = {}
  wsRows?.forEach(w => {
    if (!wsMap[w.owner_id]) wsMap[w.owner_id] = { plan: w.plan, max_members: w.max_members, max_workspaces: w.max_workspaces }
  })

  let users = accessRows.map(r => ({
    user_id: r.user_id,
    email: authMap[r.user_id]?.email || '',
    name: authMap[r.user_id]?.name || '',
    expires_at: r.expires_at,
    created_at: r.created_at,
    plan: wsMap[r.user_id]?.plan || 'lifetime',
    max_members: wsMap[r.user_id]?.max_members || 4,
    max_workspaces: wsMap[r.user_id]?.max_workspaces || 1,
    is_active: !r.expires_at || new Date(r.expires_at) > new Date(),
  }))

  if (search) {
    users = users.filter(u => u.email.toLowerCase().includes(search) || u.name.toLowerCase().includes(search))
  }

  return NextResponse.json({ users })
}

// POST /api/admin/access — grant akses ke email
export async function POST(req: NextRequest) {
  const caller = await requireSuperAdmin()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { email, name = '', plan = 'basic', sendEmail = true } = await req.json()
  if (!email) return NextResponse.json({ error: 'email wajib' }, { status: 400 })

  const cleanEmail = email.toLowerCase().trim()
  const admin = adminClient()
  const limits = getPlanLimits(plan)

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
      user_metadata: { full_name: name, provisioned_by: 'admin', provisioned_app: 'kreaflow' },
    })
    if (createErr || !created?.user) {
      return NextResponse.json({ error: 'Gagal buat user: ' + (createErr?.message || 'unknown') }, { status: 500 })
    }
    userId = created.user.id
  }

  // Upsert product_access
  const { data: existingAccess } = await admin
    .from('product_access')
    .select('user_id, expires_at')
    .eq('user_id', userId)
    .eq('app', 'kreaflow')
    .maybeSingle()

  if (existingAccess) {
    await admin.from('product_access')
      .update({ expires_at: limits.expiresAt, granted_by: caller.id })
      .eq('user_id', userId).eq('app', 'kreaflow')
  } else {
    await admin.from('product_access').insert({
      user_id: userId,
      app: 'kreaflow',
      granted_by: caller.id,
      expires_at: limits.expiresAt,
    })
  }

  // Workspace: buat jika belum ada, update limits jika sudah ada
  const { data: existingWs } = await admin
    .from('kf_workspaces')
    .select('id, max_members, max_workspaces')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!existingWs) {
    const { data: ws } = await admin.from('kf_workspaces').insert({
      name: name || 'My Workspace',
      owner_id: userId,
      plan: 'lifetime',
      brand_type: null,
      max_workspaces: limits.maxWorkspaces,
      max_members: limits.maxMembers,
    }).select('id').single()

    if (ws?.id) {
      await admin.from('kf_workspace_members').insert({
        workspace_id: ws.id,
        user_id: userId,
        role: 'owner',
        jabatan: 'Content Strategist',
      })
    }
  } else if (limits.maxMembers > (existingWs.max_members ?? 0)) {
    await admin.from('kf_workspaces')
      .update({ max_workspaces: limits.maxWorkspaces, max_members: limits.maxMembers, plan: 'lifetime' })
      .eq('owner_id', userId)
  }

  // Kirim magic link welcome email
  let emailSent = false
  if (sendEmail) {
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
          subject: 'Akses KreaFlow kamu sudah aktif!',
        }
        await sendWelcomeAccessEmail(cleanEmail, loginUrl, settings)
        emailSent = true
      }
    } catch (e) {
      console.error('[admin/access] Gagal kirim email:', e)
    }
  }

  return NextResponse.json({
    success: true,
    user_id: userId,
    is_new: !existing,
    email_sent: emailSent,
    plan,
    limits,
  })
}

// PATCH /api/admin/access — update expiry atau extend akses
export async function PATCH(req: NextRequest) {
  const caller = await requireSuperAdmin()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { user_id, expires_at } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id wajib' }, { status: 400 })

  const admin = adminClient()
  await admin.from('product_access')
    .update({ expires_at: expires_at || null })
    .eq('user_id', user_id).eq('app', 'kreaflow')

  return NextResponse.json({ success: true })
}

// DELETE /api/admin/access — revoke akses
export async function DELETE(req: NextRequest) {
  const caller = await requireSuperAdmin()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id wajib' }, { status: 400 })

  const admin = adminClient()
  await admin.from('product_access')
    .delete()
    .eq('user_id', user_id).eq('app', 'kreaflow')

  return NextResponse.json({ success: true })
}
