import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import { canAccess, firstAccessibleRoute } from '@/lib/jabatan-access'
import StudioModule from './StudioModule'

export default async function StudioPage() {
  const { supabase, wsId, role, jabatan } = await getServerContext()
  if (!canAccess(role, jabatan, 'studio')) redirect(firstAccessibleRoute(role, jabatan))

  const [{ data: wsData }, { data: brandCheck }, { data: contents }, { data: products }, { data: notifications }] = await Promise.all([
    supabase.from('kf_workspaces').select('plan, brand_type, name').eq('id', wsId).maybeSingle(),
    supabase.from('kf_brand_profiles').select('niche, affiliate_micro_niche, biz_nama_brand, biz_kategori').eq('workspace_id', wsId).maybeSingle(),
    supabase.from('kf_content_ideas').select('*, kf_sprints!sprint_id(nama)').eq('workspace_id', wsId).in('status', ['Naskah Siap', 'Produksi', 'Siap Tayang', 'Terjadwal', 'Tayang']).order('created_at', { ascending: false }),
    supabase.from('kf_products').select('id, nama').eq('workspace_id', wsId).eq('is_active', true),
    supabase.from('kf_notifications').select('*').eq('workspace_id', wsId).eq('is_read', false).order('created_at', { ascending: false }),
  ])
  const productCount = products?.length ?? 0

  if (wsData?.plan !== 'lifetime') redirect('/upgrade')
  const brandIncomplete = wsData?.brand_type === 'business' ? (!brandCheck?.biz_nama_brand && !brandCheck?.biz_kategori) : (!brandCheck?.niche && !brandCheck?.affiliate_micro_niche)
  if (brandIncomplete && canAccess(role, jabatan, 'brand')) redirect('/brand?setup=1')
  if (wsData?.brand_type === 'affiliate' && !productCount && canAccess(role, jabatan, 'catalog')) redirect('/catalog?setup=1')

  const contentsWithSprint = (contents || []).map((c: any) => ({
    ...c,
    sprint_nama: c.kf_sprints?.nama || null,
  }))

  return (
    <StudioModule
      initialContents={contentsWithSprint}
      products={products || []}
      initialNotifications={notifications || []}
      workspaceId={wsId}
      workspaceName={wsData?.name || 'studio'}
    />
  )
}
