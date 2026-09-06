import { isPaidPlan } from '@/lib/workspace'
import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import { canAccess, firstAccessibleRoute } from '@/lib/jabatan-access'
import TrackerModule from './TrackerModule'

export default async function TrackerPage() {
  const { supabase, wsId, role, jabatan } = await getServerContext()
  if (!canAccess(role, jabatan, 'tracker')) redirect(firstAccessibleRoute(role, jabatan))

  const { data: wsData } = await supabase.from('kf_workspaces').select('plan, brand_type').eq('id', wsId).maybeSingle()
  if (!isPaidPlan(wsData?.plan)) redirect('/upgrade')

  const { data: brand } = await supabase.from('kf_brand_profiles').select('niche, affiliate_micro_niche, biz_nama_brand, biz_kategori').eq('workspace_id', wsId).maybeSingle()
  const brandIncomplete = wsData?.brand_type === 'business' ? (!brand?.biz_nama_brand && !brand?.biz_kategori) : (!brand?.niche && !brand?.affiliate_micro_niche)
  if (brandIncomplete && canAccess(role, jabatan, 'brand')) redirect('/brand?setup=1')

  const { data: metrics } = await supabase
    .from('kf_daily_metrics')
    .select('*')
    .eq('workspace_id', wsId)
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })

  return <TrackerModule initialMetrics={metrics || []} workspaceId={wsId} />
}
