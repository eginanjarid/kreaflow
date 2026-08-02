import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import { canAccess, firstAccessibleRoute } from '@/lib/jabatan-access'
import StudioModule from './StudioModule'

export default async function StudioPage() {
  const { supabase, wsId, role, jabatan } = await getServerContext()
  if (!canAccess(role, jabatan, 'studio')) redirect(firstAccessibleRoute(role, jabatan))

  const [{ data: wsData }, { data: brandCheck }, { data: contents }, { data: products }, { data: notifications }, { data: workspace }, { count: productCount }] = await Promise.all([
    supabase.from('kf_workspaces').select('plan, brand_type').eq('id', wsId).maybeSingle(),
    supabase.from('kf_brand_profiles').select('niche, affiliate_micro_niche').eq('workspace_id', wsId).maybeSingle(),
    supabase.from('kf_content_ideas').select('*').eq('workspace_id', wsId).in('status', ['Naskah Siap', 'Produksi', 'Siap Tayang', 'Terjadwal', 'Tayang']).order('created_at', { ascending: false }),
    supabase.from('kf_products').select('id, nama').eq('workspace_id', wsId).eq('is_active', true),
    supabase.from('kf_notifications').select('*').eq('workspace_id', wsId).eq('is_read', false).order('created_at', { ascending: false }),
    supabase.from('kf_workspaces').select('name').eq('id', wsId).single(),
    supabase.from('kf_products').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).eq('is_active', true),
  ])

  if (wsData?.plan !== 'lifetime') redirect('/upgrade')
  if (!brandCheck?.niche && !brandCheck?.affiliate_micro_niche) redirect('/brand?setup=1')
  if (wsData?.brand_type === 'affiliate' && !productCount) redirect('/catalog?setup=1')

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
