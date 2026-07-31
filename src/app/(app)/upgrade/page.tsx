import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveWorkspaceId } from '@/lib/workspace'
import UpgradeModule from './UpgradeModule'

export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ failed?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, user.id)
  if (!wsId) redirect('/login')

  const { data: ws } = await supabase
    .from('kf_workspaces')
    .select('plan')
    .eq('id', wsId)
    .single()

  if (ws?.plan === 'lifetime') redirect('/sprints')

  const { failed } = await searchParams

  return <UpgradeModule failed={failed === '1'} />
}
