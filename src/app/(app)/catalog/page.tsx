import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveWorkspaceId } from '@/lib/workspace'
import CatalogModule from './CatalogModule'

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, user.id)
  if (!wsId) redirect('/login')
  const { data: wsData } = await supabase.from('kf_workspaces').select('plan').eq('id', wsId).maybeSingle()
  if (wsData?.plan !== 'lifetime') redirect('/upgrade')

  const [{ data: products }, { data: workspace }] = await Promise.all([
    supabase.from('kf_products').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
    supabase.from('kf_workspaces').select('brand_type').eq('id', wsId).single(),
  ])

  const brandType = (workspace?.brand_type as string | null) ?? 'creator'
  const modes = brandType === 'affiliate' ? ['affiliate'] : ['creator']

  return (
    <CatalogModule
      initialProducts={products || []}
      workspaceId={wsId}
      modes={modes}
    />
  )
}
