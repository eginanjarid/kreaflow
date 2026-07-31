import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveWorkspaceId } from '@/lib/workspace'
import NotificationsModule from './NotificationsModule'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, user.id)
  if (!wsId) redirect('/login')
  const { data: wsData } = await supabase.from('kf_workspaces').select('plan').eq('id', wsId).maybeSingle()
  if (wsData?.plan !== 'lifetime') redirect('/upgrade')

  const { data: notifications } = await supabase
    .from('kf_notifications')
    .select('*')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false })
    .limit(100)

  return <NotificationsModule initialNotifs={notifications || []} workspaceId={wsId} />
}
