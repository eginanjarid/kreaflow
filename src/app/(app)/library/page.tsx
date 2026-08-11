import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import LibraryModule from './LibraryModule'

export default async function LibraryPage() {
  const { supabase, wsId } = await getServerContext()

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  const [{ data: wsData }, { data: ideas }, { data: products }, { data: pillars }, { data: tasks }, { data: sprints }] = await Promise.all([
    supabase.from('kf_workspaces').select('plan, name').eq('id', wsId).maybeSingle(),
    supabase.from('kf_content_ideas').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
    supabase.from('kf_products').select('id, nama').eq('workspace_id', wsId).eq('is_active', true),
    supabase.from('kf_content_pillars').select('id, nama').eq('workspace_id', wsId).order('urutan'),
    supabase.from('kf_tasks').select('id,nama,due_date,percent_complete,priority').eq('workspace_id', wsId).not('due_date', 'is', null),
    supabase.from('kf_sprints').select('id, nama, start_date, end_date').eq('workspace_id', wsId).gte('end_date', today).order('start_date', { ascending: true }),
  ])

  if (wsData?.plan !== 'lifetime') redirect('/upgrade')

  return (
    <LibraryModule
      initialIdeas={ideas || []}
      workspaceId={wsId}
      workspaceName={wsData?.name || 'workspace'}
      products={products || []}
      pillars={pillars || []}
      tasks={tasks || []}
      sprints={(sprints || []).map(s => ({ id: s.id as string, nama: s.nama as string, start_date: s.start_date as string, end_date: s.end_date as string }))}
    />
  )
}
