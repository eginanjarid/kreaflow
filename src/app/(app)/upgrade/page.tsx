import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import UpgradeModule from './UpgradeModule'
import { isSuperAdmin } from '@/lib/super-admins'
import { fetchPricingConfig } from '@/lib/pricing'

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

  const adminClient = createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const pricing = await fetchPricingConfig(adminClient)

  return <UpgradeModule failed={failed === '1'} isLifetime={isLifetime} currentMaxWs={currentMaxWs} wsCount={wsCount} pricing={pricing} />
}
