import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrackerModule from './TrackerModule'

export default async function TrackerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('kf_workspace_members').select('workspace_id')
    .eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).single()
  if (!member) redirect('/login')

  const { data: metrics } = await supabase
    .from('kf_monthly_metrics').select('*')
    .eq('workspace_id', member.workspace_id)
    .order('year', { ascending: false })

  return <TrackerModule initialMetrics={metrics || []} workspaceId={member.workspace_id} />
}
