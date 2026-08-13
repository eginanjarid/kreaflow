import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { isSuperAdmin } from '@/lib/super-admins'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, brand_type } = await req.json()
  if (!name || !brand_type) return NextResponse.json({ error: 'name dan brand_type wajib diisi' }, { status: 400 })

  const superAdmin = await isSuperAdmin(user.email!)

  // Non-superadmin harus punya product_access kreaflow
  if (!superAdmin) {
    const { data: access } = await supabase
      .from('product_access')
      .select('app')
      .eq('user_id', user.id)
      .eq('app', 'kreaflow')
      .maybeSingle()

    if (!access) return NextResponse.json({ error: 'Akses KreaFlow diperlukan' }, { status: 403 })
  }

  // Ambil workspace pertama milik user untuk inherit limits
  const { data: firstWs } = await admin
    .from('kf_workspaces')
    .select('plan, max_workspaces, max_members')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const inheritMaxMembers = (firstWs?.max_members as number) ?? 4
  const inheritMaxWorkspaces = (firstWs?.max_workspaces as number) ?? 1

  if (!superAdmin) {
    const wsIds: string[] = []
    const { data: memberRows } = await supabase
      .from('kf_workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')

    memberRows?.forEach(r => wsIds.push(r.workspace_id))
    const wsCount = wsIds.length

    if (wsIds.length > 0) {
      const { data: ownedWs } = await supabase
        .from('kf_workspaces')
        .select('plan, max_workspaces')
        .in('id', wsIds)

      const lifetimeWs = ownedWs?.find(w => w.plan === 'lifetime')

      if (!lifetimeWs) {
        return NextResponse.json({ error: 'Akun belum diaktivasi. Silakan upgrade terlebih dahulu.', needUpgrade: true }, { status: 403 })
      }

      const maxWorkspaces = (lifetimeWs.max_workspaces as number) || 1
      if (wsCount >= maxWorkspaces) {
        return NextResponse.json({
          error: `Batas workspace tercapai (${maxWorkspaces}). Upgrade paket atau beli add-on workspace.`,
          limitReached: true,
          maxWorkspaces,
          current: wsCount,
        }, { status: 403 })
      }
    }
  }

  const { data: ws, error } = await admin
    .from('kf_workspaces')
    .insert({
      name,
      owner_id: user.id,
      plan: 'lifetime',
      brand_type,
      max_members: superAdmin ? 999 : inheritMaxMembers,
      max_workspaces: superAdmin ? 999 : inheritMaxWorkspaces,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('kf_workspace_members').insert({
    workspace_id: ws.id, user_id: user.id, role: 'owner',
  })

  const res = NextResponse.json({ success: true, workspace_id: ws.id })
  res.cookies.set('selected_workspace_id', ws.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: 'lax',
  })
  return res
}
