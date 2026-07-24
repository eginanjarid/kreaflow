import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SprintsModule from './SprintsModule'

export default async function SprintsPage() {
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

  const [{ data: sprints }, { data: contents }, { data: products }, { data: members }] = await Promise.all([
    supabase.from('kf_sprints').select('*').eq('workspace_id', wsId).order('start_date', { ascending: false }),
    supabase.from('kf_content_ideas').select('*').eq('workspace_id', wsId).not('sprint_id', 'is', null).order('created_at', { ascending: false }),
    supabase.from('kf_products').select('id, nama, platform_affiliate').eq('workspace_id', wsId).eq('is_active', true),
    supabase.from('kf_workspace_members').select('user_id, role').eq('workspace_id', wsId),
  ])

  return (
    <SprintsModule
      initialSprints={sprints || []}
      initialContents={contents || []}
      products={products || []}
      workspaceId={wsId}
      memberCount={(members || []).length}
    />
  )
}
