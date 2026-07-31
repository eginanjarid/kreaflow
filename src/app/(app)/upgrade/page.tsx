import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveWorkspaceId } from '@/lib/workspace'
import UpgradeModule from './UpgradeModule'

export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ failed?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberRows } = await supabase
    .from('kf_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('role', 'owner')

  const wsIds = memberRows?.map(r => r.workspace_id) || []
  const wsCount = wsIds.length

  let isLifetime = false
  let currentMaxWs = 1

  if (wsIds.length > 0) {
    const { data: ownedWs } = await supabase
      .from('kf_workspaces')
      .select('plan, max_workspaces')
      .in('id', wsIds)

    const lifetimeWs = ownedWs?.find(w => w.plan === 'lifetime')
    isLifetime = !!lifetimeWs
    currentMaxWs = (lifetimeWs?.max_workspaces as number) || 1

    // If lifetime and still have room for workspaces, redirect away
    if (isLifetime && wsCount < currentMaxWs) {
      const wsId = await resolveWorkspaceId(supabase, user.id)
      if (wsId) redirect('/sprints')
    }
  }

  const { failed } = await searchParams

  return <UpgradeModule failed={failed === '1'} isLifetime={isLifetime} currentMaxWs={currentMaxWs} />
}
