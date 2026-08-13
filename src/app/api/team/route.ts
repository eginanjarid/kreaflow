import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { isSuperAdmin } from '@/lib/super-admins'
import { sendInviteEmail } from '@/lib/mailer'
import { sendMagicLinkEmail } from '@/lib/smtp-mailer'
import { DEFAULT_MAGIC_LINK_SETTINGS, APP_CONFIG_KEY, type MagicLinkSettings } from '@/lib/email-config'

const MAX_WORKSPACE_PER_MEMBER = 5

function adminClient() {
  return createAdmin(process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getCallerRole(userId: string, workspaceId: string): Promise<string | null> {
  const admin = adminClient()
  const { data } = await admin.from('kf_workspace_members').select('role').eq('user_id', userId).eq('workspace_id', workspaceId).single()
  return (data as { role: string } | null)?.role ?? null
}

// POST /api/team — invite member
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, email, role = 'member', jabatan = '' } = await req.json()
  if (!workspaceId || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const callerRole = await getCallerRole(user.id, workspaceId)
  if (!callerRole || callerRole === 'member') return NextResponse.json({ error: 'Tidak punya akses' }, { status: 403 })

  const admin = adminClient()
  const callerIsSuper = await isSuperAdmin(user.email!)

  // Check plan & member limit (super admin bypass)
  const { data: ws } = await admin.from('kf_workspaces').select('plan, name, max_members').eq('id', workspaceId).single()
  const wsData = ws as { plan: string; name: string; max_members: number | null } | null
  const plan = wsData?.plan || 'free'
  const workspaceName = wsData?.name || 'KreaFlow'
  const MAX_MEMBERS = wsData?.max_members ?? 4

  if (!callerIsSuper) {
    const { count: currentCount } = await admin
      .from('kf_workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)

    if ((currentCount || 0) >= MAX_MEMBERS) {
      const msg = plan === 'free'
        ? 'Upgrade ke paket berbayar untuk mengundang anggota tim.'
        : `Slot anggota penuh (${MAX_MEMBERS} member). Tambah slot dengan add-on +1 anggota Rp29.000.`
      return NextResponse.json({ error: msg, limit: true }, { status: 403 })
    }
  }

  const cleanEmail = email.toLowerCase().trim()
  const inviterName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Tim KreaFlow'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'

  // Cari atau buat user di Supabase auth
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
  let targetUser = authUsers?.users.find(u => u.email === cleanEmail) ?? null

  const isExistingUser = !!targetUser

  if (targetUser) {
    const { data: alreadyMember } = await admin.from('kf_workspace_members')
      .select('id').eq('workspace_id', workspaceId).eq('user_id', targetUser.id).single()
    if (alreadyMember) return NextResponse.json({ error: 'User sudah jadi member di workspace ini' }, { status: 400 })

    // Anti-fraud: max 5 workspace sebagai non-owner per akun (super admin bypass)
    if (!callerIsSuper) {
      const { count: nonOwnerCount } = await admin
        .from('kf_workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUser.id)
        .neq('role', 'owner')
      if ((nonOwnerCount || 0) >= MAX_WORKSPACE_PER_MEMBER) {
        return NextResponse.json({
          error: `Akun ini sudah bergabung di ${MAX_WORKSPACE_PER_MEMBER} workspace berbeda (batas maksimal untuk mencegah penyalahgunaan akun).`
        }, { status: 400 })
      }
    }
  } else {
    // Buat akun baru otomatis — email langsung terverifikasi
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: cleanEmail,
      email_confirm: true,
    })
    if (createErr || !created?.user) return NextResponse.json({ error: 'Gagal membuat akun tim: ' + (createErr?.message || 'unknown') }, { status: 500 })
    targetUser = created.user
  }

  // Langsung tambahkan ke workspace
  await admin.from('kf_workspace_members').insert({
    workspace_id: workspaceId,
    user_id: targetUser.id,
    role,
    jabatan: jabatan || null,
  })

  // Generate magic link agar tim member bisa langsung login tanpa password
  const callbackUrl = `${appUrl}/auth/callback`
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: cleanEmail,
    options: { redirectTo: callbackUrl },
  })

  if (linkErr || !linkData?.properties?.hashed_token) {
    // Fallback: kirim invite email biasa jika magic link gagal
    const { data: invite } = await admin.from('kf_invites').insert({
      workspace_id: workspaceId, email: cleanEmail, role, jabatan: jabatan || null, invited_by: user.id,
    }).select('token').single()
    const inviteUrl = `${appUrl}/invite/${(invite as { token: string })?.token}`
    sendInviteEmail({ to: cleanEmail, workspaceName, inviteUrl, inviterName })
      .catch(err => console.error('[invite] Fallback email error:', err))
    return NextResponse.json({ success: true, method: 'invite', existing: isExistingUser })
  }

  const loginUrl = `${appUrl}/auth/verify?token_hash=${linkData.properties.hashed_token}&type=email`

  // Ambil SMTP settings dari DB
  const { data: config } = await admin.from('app_config').select('value').eq('key', APP_CONFIG_KEY).maybeSingle()
  const settings: MagicLinkSettings = { ...DEFAULT_MAGIC_LINK_SETTINGS, ...(config?.value ?? {}), subject: `Kamu diundang ke tim ${workspaceName} — KreaFlow` }

  // Kirim via SMTP dengan magic link
  sendMagicLinkEmail(cleanEmail, loginUrl, settings, undefined)
    .catch(err => console.error('[invite] SMTP error:', err))

  return NextResponse.json({ success: true, method: 'magic_link', existing: isExistingUser })
}

// DELETE /api/team — remove member
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, memberId, inviteId } = await req.json()
  const callerRole = await getCallerRole(user.id, workspaceId)
  if (!callerRole || callerRole === 'member') return NextResponse.json({ error: 'Tidak punya akses' }, { status: 403 })

  const admin = adminClient()

  // Cancel pending invite
  if (inviteId) {
    await admin.from('kf_invites').delete().eq('id', inviteId).eq('workspace_id', workspaceId)
    return NextResponse.json({ success: true })
  }

  const { data: target } = await admin.from('kf_workspace_members').select('role').eq('id', memberId).single()
  if ((target as { role: string } | null)?.role === 'owner') return NextResponse.json({ error: 'Tidak bisa remove owner' }, { status: 400 })

  await admin.from('kf_workspace_members').delete().eq('id', memberId).eq('workspace_id', workspaceId)
  return NextResponse.json({ success: true })
}

// PATCH /api/team — change role or jabatan
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, memberId, role, jabatan } = await req.json()
  const callerRole = await getCallerRole(user.id, workspaceId)

  const admin = adminClient()

  // Jabatan can be changed by anyone with access (owner/admin)
  if (jabatan !== undefined) {
    if (!callerRole || callerRole === 'member') return NextResponse.json({ error: 'Tidak punya akses' }, { status: 403 })
    await admin.from('kf_workspace_members').update({ jabatan }).eq('id', memberId).eq('workspace_id', workspaceId)
    return NextResponse.json({ success: true })
  }

  // Role change: only owner
  if (callerRole !== 'owner') return NextResponse.json({ error: 'Hanya owner yang bisa ubah role' }, { status: 403 })
  const { data: target } = await admin.from('kf_workspace_members').select('role').eq('id', memberId).single()
  if ((target as { role: string } | null)?.role === 'owner') return NextResponse.json({ error: 'Tidak bisa ubah role owner' }, { status: 400 })

  await admin.from('kf_workspace_members').update({ role }).eq('id', memberId).eq('workspace_id', workspaceId)
  return NextResponse.json({ success: true })
}
