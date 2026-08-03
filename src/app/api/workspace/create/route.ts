import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { superAdmin } from '@/lib/super-admins'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, brand_type } = await req.json()
  if (!name || !brand_type) return NextResponse.json({ error: 'name dan brand_type wajib diisi' }, { status: 400 })

  const superAdmin = await superAdmin(user.email!)

  if (!superAdmin) {
    // Enforce workspace limit: find user's owned workspaces
    const { data: memberRows } = await supabase
      .from('kf_workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')

    const wsIds = memberRows?.map(r => r.workspace_id) || []
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

  const { data: ws, error } = await supabase
    .from('kf_workspaces')
    .insert({ name, owner_id: user.id, plan: superAdmin ? 'lifetime' : 'free', brand_type })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('kf_workspace_members').insert({
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
