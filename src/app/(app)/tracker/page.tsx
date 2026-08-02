import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import { canAccess, firstAccessibleRoute } from '@/lib/jabatan-access'
import TrackerModule from './TrackerModule'

export default async function TrackerPage() {
  const { supabase, wsId, role, jabatan } = await getServerContext()
  if (!canAccess(role, jabatan, 'tracker')) redirect(firstAccessibleRoute(role, jabatan))

  const { data: wsData } = await supabase.from('kf_workspaces').select('plan').eq('id', wsId).maybeSingle()
  if (wsData?.plan !== 'lifetime') redirect('/upgrade')

  const { data: metrics } = await supabase
    .from('kf_daily_metrics')
    .select('*')
    .eq('workspace_id', wsId)
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })

  return <TrackerModule initialMetrics={metrics || []} workspaceId={wsId} />
}
