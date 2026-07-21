import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LibraryModule from './LibraryModule'

export default async function LibraryPage() {
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

  const [{ data: ideas }, { data: products }, { data: pillars }, { data: tasks }, { data: workspace }] = await Promise.all([
    supabase.from('kf_content_ideas').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
    supabase.from('kf_products').select('id, nama').eq('workspace_id', wsId).eq('is_active', true),
    supabase.from('kf_content_pillars').select('id, nama').eq('workspace_id', wsId).order('urutan'),
    supabase.from('kf_tasks').select('id,nama,due_date,percent_complete,priority').eq('workspace_id', wsId).not('due_date', 'is', null),
    supabase.from('kf_workspaces').select('name').eq('id', wsId).single(),
  ])

  return (
    <LibraryModule
      initialIdeas={ideas || []}
      workspaceId={wsId}
      workspaceName={(workspace as { name: string } | null)?.name || 'workspace'}
      products={products || []}
      pillars={pillars || []}
      tasks={tasks || []}
    />
  )
}
