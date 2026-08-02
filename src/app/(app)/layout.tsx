import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import AppShell from '@/components/layout/AppShell'

const SUPER_ADMINS = ['eginanjarism@gmail.com']

type Workspace = { id: string; name: string; plan: string; brand_type: string }

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, wsId } = await getServerContext()

  const { data: memberRows } = await supabase
    .from('kf_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)

  const wsIds = memberRows?.map(r => r.workspace_id) || []
  const { data: allWorkspaces } = wsIds.length
    ? await supabase.from('kf_workspaces').select('id, name, plan, brand_type').in('id', wsIds)
    : { data: [] }

  const ws = (allWorkspaces as Workspace[] | null)?.find(w => w.id === wsId) || null
  const isSuperAdmin = SUPER_ADMINS.includes(user.email!)

  return (
    <AppShell
      workspace={ws}
      workspaces={(allWorkspaces as Workspace[] | null) || []}
      isSuperAdmin={isSuperAdmin}
      user={{ email: user.email!, nama: user.user_metadata?.nama || user.email! }}
    >
      {children}
    </AppShell>
  )
}
