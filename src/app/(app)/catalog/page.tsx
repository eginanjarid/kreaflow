import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CatalogModule from './CatalogModule'

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('kf_workspace_members').select('workspace_id')
    .eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).single()
  if (!member) redirect('/login')

  const wsId = member.workspace_id
  const [{ data: products }, { data: workspace }] = await Promise.all([
    supabase.from('kf_products').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
    supabase.from('kf_workspaces').select('modes').eq('id', wsId).single(),
  ])

  return (
    <CatalogModule
      initialProducts={products || []}
      workspaceId={wsId}
      modes={(workspace?.modes as string[]) || ['creator']}
    />
  )
}
