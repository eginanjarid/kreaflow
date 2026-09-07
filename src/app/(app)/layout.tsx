import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import AppShell from '@/components/layout/AppShell'

import { isSuperAdmin } from '@/lib/super-admins'

type Workspace = { id: string; name: string; plan: string; brand_type: string; myRole?: string }

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, wsId, role, jabatan } = await getServerContext()

  const { data: memberRows } = await supabase
    .from('kf_workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)

  const wsIds = memberRows?.map(r => r.workspace_id) || []
  const roleByWsId: Record<string, string> = {}
  memberRows?.forEach(r => { roleByWsId[r.workspace_id] = r.role })

  const { data: rawWorkspaces } = wsIds.length
    ? await supabase.from('kf_workspaces').select('id, name, plan, brand_type').in('id', wsIds)
    : { data: [] }

  const allWorkspaces = (rawWorkspaces as Workspace[] | null)?.map(w => ({ ...w, myRole: roleByWsId[w.id] || '' })) || []

  const ws = allWorkspaces.find(w => w.id === wsId) || null
  const superAdmin = await isSuperAdmin(user.email!)

  return (
    <AppShell
      workspace={ws}
      workspaces={allWorkspaces}
      isSuperAdmin={superAdmin}
      user={{ email: user.email!, nama: user.user_metadata?.nama || user.email!, avatar_url: user.user_metadata?.avatar_url || '' }}
      role={role}
      jabatan={jabatan}
      workspaceId={wsId}
    >
      {children}
    </AppShell>
  )
}
