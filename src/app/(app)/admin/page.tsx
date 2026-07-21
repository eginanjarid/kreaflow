import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import AdminModule from './AdminModule'

const SUPER_ADMINS = ['eginanjarism@gmail.com']

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !SUPER_ADMINS.includes(user.email!)) redirect('/brand')

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const [{ data: authUsers }, { data: workspaces }, { data: members }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 500 }),
    admin.from('kf_workspaces').select('id, name, plan, owner_id, created_at, modes'),
    admin.from('kf_workspace_members').select('workspace_id, user_id, role'),
  ])

  const users = (authUsers?.users || []).map(u => {
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

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

  const stats = {
    total: users.length,
    today: users.filter(u => u.created_at.startsWith(today)).length,
    week: users.filter(u => u.created_at > weekAgo).length,
    month: users.filter(u => u.created_at > monthAgo).length,
    byPlan: {
      free: users.filter(u => !u.plan || u.plan === 'free').length,
      solo: users.filter(u => u.plan === 'solo').length,
      pro: users.filter(u => u.plan === 'pro').length,
      team: users.filter(u => u.plan === 'team').length,
    },
    totalWorkspaces: (workspaces || []).length,
  }

  return <AdminModule users={users} stats={stats} />
}
