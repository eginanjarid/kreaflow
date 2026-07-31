import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveWorkspaceId } from '@/lib/workspace'
import TrackerModule from './TrackerModule'

export default async function TrackerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, user.id)
  if (!wsId) redirect('/login')
  const { data: wsData } = await supabase.from('kf_workspaces').select('plan').eq('id', wsId).maybeSingle()
  if (wsData?.plan !== 'lifetime') redirect('/upgrade')

  const { data: metrics } = await supabase
    .from('kf_monthly_metrics').select('*')
    .eq('workspace_id', wsId)
    .order('year', { ascending: false })

  return <TrackerModule initialMetrics={metrics || []} workspaceId={wsId} />
}
