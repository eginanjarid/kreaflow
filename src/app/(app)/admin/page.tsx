import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import AdminModule from './AdminModule'
import { isSuperAdmin, isGodAdmin, GOD_ADMIN } from '@/lib/super-admins'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sprints')
  const superAdmin = await isSuperAdmin(user.email!)
  if (!superAdmin) redirect('/sprints')

  const admin = createAdmin(process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const godAdmin = isGodAdmin(user.email!)

  const [{ data: authUsers }, { data: workspaces }, { data: members }, { data: invites }, { data: superAdmins }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 500 }),
    admin.from('kf_workspaces').select('id, name, plan, owner_id, created_at, modes'),
    admin.from('kf_workspace_members').select('workspace_id, user_id, role, created_at'),
    admin.from('kf_invites').select('workspace_id, email, role, created_at, accepted_at, expires_at'),
    admin.from('kf_super_admins').select('email, added_by, created_at'),
  ])

  const userMap = Object.fromEntries(
    (authUsers?.users || []).map(u => [u.id, { email: u.email || '', nama: (u.user_metadata?.nama as string) || '', created_at: u.created_at, last_sign_in: u.last_sign_in_at || '' }])
  )

  // Only KreaFlow users — must have at least one kf_workspace_members record
  const kfUserIds = new Set((members || []).map(m => m.user_id))

  const users = (authUsers?.users || [])
    .filter(u => kfUserIds.has(u.id))
    .map(u => {
      const userWorkspaces = (members || [])
        .filter(m => m.user_id === u.id)
        .map(m => {
          const ws = (workspaces || []).find(w => w.id === m.workspace_id)
          return ws ? { id: ws.id, name: ws.name as string, plan: ws.plan as string, role: m.role as string } : null
        })
        .filter(Boolean) as { id: string; name: string; plan: string; role: string }[]

      return {
        id: u.id,
        email: u.email || '',
        nama: (u.user_metadata?.nama as string) || '',
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at || '',
        workspaces: userWorkspaces,
        plan: userWorkspaces[0]?.plan || 'free',
      }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const workspaceList = (workspaces || []).map(ws => {
    const wsMembers = (members || [])
      .filter(m => m.workspace_id === ws.id)
      .map(m => ({
        user_id: m.user_id,
        role: m.role as string,
        joined_at: m.created_at as string,
        email: userMap[m.user_id]?.email || '',
        nama: userMap[m.user_id]?.nama || '',
      }))
    const wsInvites = (invites || []).filter(i => i.workspace_id === ws.id && !i.accepted_at)
    const owner = wsMembers.find(m => m.role === 'owner')
    return {
      id: ws.id,
      name: ws.name as string,
      plan: ws.plan as string,
      created_at: ws.created_at as string,
      modes: (ws.modes as string[]) || [],
      owner_email: owner?.email || '',
      member_count: wsMembers.length,
      members: wsMembers,
      pending_invites: wsInvites.length,
    }
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

  const lifetimeCount = workspaceList.filter(w => w.plan === 'lifetime').length

  const stats = {
    total: users.length,
    today: users.filter(u => u.created_at.startsWith(today)).length,
    week: users.filter(u => u.created_at > weekAgo).length,
    month: users.filter(u => u.created_at > monthAgo).length,
    byPlan: {
      free: workspaceList.filter(w => !w.plan || w.plan === 'free').length,
      lifetime: lifetimeCount,
    },
    totalWorkspaces: workspaceList.length,
    revenue: lifetimeCount * 149000,
  }

  const superAdminList = (superAdmins || []).map(s => ({
    email: s.email as string,
    added_by: s.added_by as string,
    created_at: s.created_at as string,
  }))

  return <AdminModule users={users} workspaces={workspaceList} stats={stats} isGodAdmin={godAdmin} superAdmins={superAdminList} godAdminEmail={GOD_ADMIN} />
}
