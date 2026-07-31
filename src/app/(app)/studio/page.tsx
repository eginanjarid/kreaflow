import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudioModule from './StudioModule'

export default async function StudioPage() {
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

  const { data: brandCheck } = await supabase.from('kf_brand_profiles').select('niche').eq('workspace_id', wsId).maybeSingle()
  if (!brandCheck?.niche) redirect('/brand?setup=1')

  const [{ data: contents }, { data: products }, { data: notifications }, { data: workspace }] = await Promise.all([
    supabase
      .from('kf_content_ideas')
      .select('*')
      .eq('workspace_id', wsId)
      .in('status', ['Naskah Siap', 'Produksi', 'Siap Tayang'])
      .order('created_at', { ascending: false }),
    supabase
      .from('kf_products')
      .select('id, nama')
      .eq('workspace_id', wsId)
      .eq('is_active', true),
    supabase
      .from('kf_notifications')
      .select('*')
      .eq('workspace_id', wsId)
      .eq('is_read', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('kf_workspaces')
      .select('name')
      .eq('id', wsId)
      .single(),
  ])

  return (
    <StudioModule
      initialContents={contents || []}
      products={products || []}
      initialNotifications={notifications || []}
      workspaceId={wsId}
      workspaceName={(workspace as { name: string } | null)?.name || 'studio'}
    />
  )
}
