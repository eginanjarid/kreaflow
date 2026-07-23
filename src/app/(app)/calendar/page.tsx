import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarModule from './CalendarModule'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('kf_workspace_members').select('workspace_id')
    .eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).single()
  if (!member) redirect('/login')

  const wsId = member.workspace_id

  const [{ data: entries }, { data: ideas }, { data: tasks }] = await Promise.all([
    supabase.from('kf_calendar_entries').select('id,workspace_id,content_id,task_id,label,platform,scheduled_at,posted_at,posted_url,status').eq('workspace_id', wsId).order('scheduled_at'),
    supabase.from('kf_content_ideas').select('id, judul, format, platform').eq('workspace_id', wsId),
    supabase.from('kf_tasks').select('id,nama,platform,due_date,percent_complete,priority,stage').eq('workspace_id', wsId).not('due_date', 'is', null),
  ])

  return (
    <CalendarModule
      initialEntries={entries || []}
      workspaceId={wsId}
      ideas={ideas || []}
      tasks={tasks || []}
    />
  )
}
