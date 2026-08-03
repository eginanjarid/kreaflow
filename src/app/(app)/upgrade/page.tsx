import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UpgradeModule from './UpgradeModule'
import { isSuperAdmin } from '@/lib/super-admins'

export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ failed?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Super admins have unlimited workspaces — never show upgrade page
  if (await isSuperAdmin(user.email!)) redirect('/sprints')

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

    // If lifetime and still have room for workspaces, redirect back
    if (isLifetime && wsCount < currentMaxWs) {
      redirect('/sprints')
    }
  }

  const { failed } = await searchParams

  return <UpgradeModule failed={failed === '1'} isLifetime={isLifetime} currentMaxWs={currentMaxWs} />
}
