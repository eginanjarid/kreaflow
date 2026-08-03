import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { isSuperAdmin, isGodAdmin } from '@/lib/super-admins'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isSuperAdmin(user.email!))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, userId, plan, workspaceId, password } = await req.json()
  const admin = createAdmin(process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  if (action === 'plan') {
    if (workspaceId) await admin.from('kf_workspaces').update({ plan }).eq('id', workspaceId)
    return NextResponse.json({ success: true })
  }

  if (action === 'password') {
    if (!password || password.length < 6) return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    const { error } = await admin.auth.admin.updateUserById(userId, { password })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'deleteUser') {
    // Only god admin can delete users
    if (!isGodAdmin(user.email!)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!userId) return NextResponse.json({ error: 'userId wajib diisi' }, { status: 400 })

    // Get user's email to prevent deleting super admins
    const { data: targetUser } = await admin.auth.admin.getUserById(userId)
    if (targetUser?.user?.email && await isSuperAdmin(targetUser.user.email)) {
      return NextResponse.json({ error: 'Tidak bisa hapus super admin' }, { status: 400 })
    }

    // Delete owned workspaces and all their members
    const { data: ownedWs } = await admin.from('kf_workspace_members').select('workspace_id').eq('user_id', userId).eq('role', 'owner')
    const ownedWsIds = ownedWs?.map(r => r.workspace_id) || []
    if (ownedWsIds.length > 0) {
      await admin.from('kf_workspace_members').delete().in('workspace_id', ownedWsIds)
      await admin.from('kf_invites').delete().in('workspace_id', ownedWsIds)
      await admin.from('kf_workspaces').delete().in('id', ownedWsIds)
    }
    // Remove from other workspaces as member
    await admin.from('kf_workspace_members').delete().eq('user_id', userId)

    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
