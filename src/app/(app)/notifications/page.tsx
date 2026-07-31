import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationsModule from './NotificationsModule'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('kf_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  if (!member) redirect('/login')

  const wsId = member.workspace_id
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
