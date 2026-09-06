import { isPaidPlan } from '@/lib/workspace'
import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import { canAccess, firstAccessibleRoute } from '@/lib/jabatan-access'
import BudgetModule from './BudgetModule'

export default async function BudgetPage() {
  const { supabase, wsId, role, jabatan } = await getServerContext()
  if (!canAccess(role, jabatan, 'budget')) redirect(firstAccessibleRoute(role, jabatan))

  const { data: wsData } = await supabase.from('kf_workspaces').select('plan, brand_type').eq('id', wsId).maybeSingle()
  if (!isPaidPlan(wsData?.plan)) redirect('/upgrade')

  const { data: brand } = await supabase.from('kf_brand_profiles').select('niche, affiliate_micro_niche, biz_nama_brand, biz_kategori').eq('workspace_id', wsId).maybeSingle()
  const brandIncomplete = wsData?.brand_type === 'business' ? (!brand?.biz_nama_brand && !brand?.biz_kategori) : (!brand?.niche && !brand?.affiliate_micro_niche)
  if (brandIncomplete && canAccess(role, jabatan, 'brand')) redirect('/brand?setup=1')

  const brandType = (wsData?.brand_type as string | null) ?? 'creator'
  const isAffiliate = brandType === 'affiliate'

  const { data: transactions } = await supabase
    .from('kf_transactions').select('*')
    .eq('workspace_id', wsId)
    .order('tanggal', { ascending: false })

  return <BudgetModule initialTx={transactions || []} workspaceId={wsId} isAffiliate={isAffiliate} />
}
